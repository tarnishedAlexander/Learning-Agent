export interface OptionGeneratorPort {
  generateOptions(text: string): Promise<string[]>;
}
