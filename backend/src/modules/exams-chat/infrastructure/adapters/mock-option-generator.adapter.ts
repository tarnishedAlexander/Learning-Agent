import { Injectable } from '@nestjs/common';
import type { OptionGeneratorPort } from '../../domain/ports/option-generator.port';


@Injectable()
export class MockOptionGeneratorAdapter implements OptionGeneratorPort {
  async generateOptions(text: string): Promise<string[]> {
    return [
      `${text} — opción A`,
      `${text} — opción B`,
      `${text} — opción C`,
      `${text} — opción D`,
    ];
  }
}
