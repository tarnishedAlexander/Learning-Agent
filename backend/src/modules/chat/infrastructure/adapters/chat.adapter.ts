import { Injectable } from '@nestjs/common';
import {
  ChatPort,
  ChatOptions,
  ChatTextOutput,
  Chatmessage,
} from '../../domain/ports/chat.port';
import { OpenAI } from 'openai';

@Injectable()
export class ChatAdapter implements ChatPort {
  private client: any;

  constructor() {
    const host = process.env.Chat_HOST ?? 'http://localhost:11434';
    this.client = new (OpenAI as any)({ host });
  }

  async complete(
    prompt: string,
    options: ChatOptions,
  ): Promise<ChatTextOutput> {
    const res = await this.client.generate({
      model: options.model.name,
      prompt,
      options: {
        temperature: options.temperature,
        top_p: options.top_p,
      },
    });
    return {
      text: res?.response ?? '',
      tokens: { total: res?.eval_count },
      raw: res,
    };
  }

  async chat(
    messages: Chatmessage[],
    options: ChatOptions,
  ): Promise<ChatTextOutput> {
    const res = await this.client.chat({
      model: options.model.name,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      options: {
        temperature: options.temperature,
        top_p: options.top_p,
      },
    });
    const last = res?.message?.content ?? '';
    return { text: last, tokens: { total: res?.eval_count }, raw: res };
  }

  async embed(
    texts: string[],
    options: Pick<ChatOptions, 'model'>,
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
    messages: Chatmessage[] | string,
    options: ChatOptions,
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
