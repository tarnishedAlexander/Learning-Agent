import { Injectable } from '@nestjs/common';
import {
  LlmPort,
  LlmGenOptions,
  LlmTextOutput,
  LlmMessage,
} from '../../domain/ports/llm.port';
import { Ollama } from 'ollama';

@Injectable()
export class OllamaAdapter implements LlmPort {
  private client: any;

  constructor() {
    const host = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
    this.client = new (Ollama as any)({ host });
  }

  async complete(
    prompt: string,
    options: LlmGenOptions,
  ): Promise<LlmTextOutput> {
    const res = await this.client.generate({
      model: options.model.name,
      prompt,
      options: {
        temperature: options.temperature,
        top_p: options.topP,
        stop: options.stop,
      },
    });
    return {
      text: res?.response ?? '',
      tokens: { total: res?.eval_count },
      raw: res,
    };
  }

  async chat(
    messages: LlmMessage[],
    options: LlmGenOptions,
  ): Promise<LlmTextOutput> {
    const res = await this.client.chat({
      model: options.model.name,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      options: {
        temperature: options.temperature,
        top_p: options.topP,
        stop: options.stop,
      },
    });
    const last = res?.message?.content ?? '';
    return { text: last, tokens: { total: res?.eval_count }, raw: res };
  }

  async embed(
    texts: string[],
    options: Pick<LlmGenOptions, 'model'>,
  ): Promise<number[][]> {
    const res = await this.client.embeddings({
      model: options.model.name,
      input: Array.isArray(texts) ? texts.join('\n\n') : String(texts),
    });
    const vec = Array.isArray(res?.embedding?.[0])
      ? res.embedding
      : [res?.embedding];
    return vec as number[][];
  }

  async stream?(
    messages: LlmMessage[] | string,
    options: LlmGenOptions,
    onToken: (t: string) => void,
  ) {
    // const stream = await this.client.chat({ ..., stream: true });
    // let full = '';
    // for await (const chunk of stream) {
    //   const piece = chunk?.message?.content ?? '';
    //   full += piece;
    //   onToken(piece);
    // }
    // return { text: full };
    // Fallback no-stream:
    const res = await this.chat(
      Array.isArray(messages)
        ? messages
        : [{ role: 'user', content: messages }],
      options,
    );
    onToken?.(res.text);
    return res;
  }
}
