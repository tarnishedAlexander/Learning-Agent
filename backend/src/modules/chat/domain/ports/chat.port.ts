import { FinishReason } from "@google/generative-ai";
import { promises } from "dns";
import { Completions } from "openai/resources";
import { text } from "stream/consumers";
export type ChatRole = 'assistant'; 
export type Chatmessage =  {
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
}

export type ChatTextOutput= {
    text: string; 
    finishReason?: 'stop' | 'length' | 'error'; 
    tokens?: {prompt?: number; completion?: number; total ?: number; }; 
    raw ?: unknown; 
}; 

export interface ChatPort {
    complete(prompt : string, options: ChatOptions): Promise<ChatTextOutput>;
    chat(message: Chatmessage[], options: ChatOptions): Promise<ChatTextOutput>; 
    embed(
        text: string[], 
        options: Pick<ChatOptions, 'model'>
    ): Promise<number[][]>;
    stream?(
         messages: Chatmessage | string,
        options: ChatOptions,
        onToken: (chunk: string) => void,
    ): Promise<ChatTextOutput>;
}
