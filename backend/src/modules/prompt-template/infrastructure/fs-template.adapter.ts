import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import Handlebars from 'handlebars';
import { PromptTemplatePort } from '../domain/ports/prompt-template.port';

@Injectable()
export class FsTemplateAdapter implements PromptTemplatePort {
  private baseDir =
    process.env.PROMPT_TPL_DIR ?? path.resolve(process.cwd(), 'templates');

  async render(templateId: string, vars: Record<string, any>): Promise<string> {
    const filePath = path.join(this.baseDir, `${templateId}.md`);
    let src: string;
    try {
      src = await fs.readFile(filePath, 'utf8');
    } catch {
      throw new NotFoundException(`Template not found: ${templateId}`);
    }
    const compile = Handlebars.compile(src);
    return compile(vars);
  }
}
