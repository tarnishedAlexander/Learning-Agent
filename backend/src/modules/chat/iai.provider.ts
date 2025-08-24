export interface IAIProvider {
  ask(prompt: string, options?: { lang?: string; context?: string }): Promise<string>;
}
