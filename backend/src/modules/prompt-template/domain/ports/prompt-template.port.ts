export interface PromptTemplatePort {
  render(templateId: string, vars: Record<string, any>): Promise<string>;
}
