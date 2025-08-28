export type ChatRole = 'assistant' | 'user';

export type Chatmessage = {
  role: ChatRole;
  content: string;
};

export type ChatModel = {
  provider: 'openai';
  name: string;
};

export type ChatOptions = {
  model: ChatModel;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
};

export type ChatTextOutput = {
  text: string;
  finishReason?: 'stop' | 'length' | 'error';
  tokens?: { prompt?: number; completion?: number; total?: number };
  raw?: unknown;
};

export interface ChatPort {
  complete(prompt: string, options: ChatOptions): Promise<ChatTextOutput>;
  chat(messages: Chatmessage[], options: ChatOptions): Promise<ChatTextOutput>;
  embed(
    text: string[],
    options: Pick<ChatOptions, 'model'>,
  ): Promise<number[][]>;
  stream?(
    messages: string | Chatmessage | Chatmessage[],
    options: ChatOptions,
    onToken: (chunk: string) => void,
  ): Promise<ChatTextOutput>;
}
