import { Injectable, Logger } from '@nestjs/common';
import pdfParse from 'pdf-parse';
import { TextExtractionPort } from '../../domain/ports/text-extraction.port';
import { ExtractedText } from '../../domain/value-objects/extracted-text.vo';

@Injectable()
export class PdfTextExtractionAdapter implements TextExtractionPort {
  private readonly logger = new Logger(PdfTextExtractionAdapter.name);

  /**
   * Extrae texto de un archivo PDF
   */
  async extractTextFromPdf(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<ExtractedText> {
    try {
      this.logger.log(`Iniciando extracción de texto para: ${fileName}`);

      // Validar que sea un PDF válido
      await this.validatePdfBuffer(fileBuffer);

      // Extraer texto usando pdf-parse
      const pdfData = await pdfParse(fileBuffer, {
        max: 0, // Sin límite de páginas
        pagerender: this.renderPage,
      });

      // Limpiar y procesar el texto extraído
      const cleanedText = this.cleanExtractedText(pdfData.text);

      // Extraer metadatos del PDF
      const metadata = this.extractMetadata(pdfData, fileName);

      this.logger.log(
        `Texto extraído exitosamente. Páginas: ${pdfData.numpages}, Caracteres: ${cleanedText.length}`,
      );


      
      return new ExtractedText(
        cleanedText,
        pdfData.numpages,
        metadata.title,
        metadata.author,
        metadata.language,
        {
          fileName,
          extractionTimestamp: new Date().toISOString(),
          pdfInfo: pdfData.info,
          pdfMetadata: pdfData.metadata,
          wordCount: this.countWords(cleanedText),
        },
      );
    } catch (error) {
      this.logger.error(
        `Error extrayendo texto de ${fileName}: ${error.message}`,
      );
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Verifica si el archivo es válido para extracción
   */
  async isValidForExtraction(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<boolean> {
    try {
      // Verificar MIME type
      if (mimeType !== 'application/pdf') {
        return false;
      }

      // Verificar cabecera PDF
      return this.validatePdfBuffer(fileBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Obtiene información básica del PDF sin extraer todo el texto
   */
  async getPdfInfo(fileBuffer: Buffer): Promise<{
    pageCount: number;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  }> {
    try {
      await this.validatePdfBuffer(fileBuffer);

      const pdfData = await pdfParse(fileBuffer, {
        max: 1, // Solo primera página para metadatos
      });

      return {
        pageCount: pdfData.numpages,
        title: pdfData.info?.Title || undefined,
        author: pdfData.info?.Author || undefined,
        subject: pdfData.info?.Subject || undefined,
        creator: pdfData.info?.Creator || undefined,
      };
    } catch (error) {
      throw new Error(`Failed to get PDF info: ${error.message}`);
    }
  }

  /**
   * Valida que el buffer contenga un PDF válido
   */
  private async validatePdfBuffer(fileBuffer: Buffer): Promise<boolean> {
    // Verificar tamaño mínimo
    if (fileBuffer.length < 100) {
      throw new Error('File too small to be a valid PDF');
    }

    // Verificar cabecera PDF (%PDF-)
    const header = fileBuffer.subarray(0, 8).toString();
    if (!header.startsWith('%PDF-')) {
      throw new Error('Invalid PDF header');
    }

    // Verificar que termine con %%EOF o similar
    const tail = fileBuffer.subarray(-1024).toString();
    if (!tail.includes('%%EOF') && !tail.includes('endobj')) {
      this.logger.warn('PDF might be incomplete or corrupted');
    }

    return true;
  }

  /**
   * Función personalizada para renderizar páginas
   */
  private renderPage = (pageData: any) => {
    // Función para procesar el contenido de cada página
    let renderOptions = {
      normalizeWhitespace: false,
      disableCombineTextItems: false,
    };

    return pageData.getTextContent(renderOptions).then((textContent: any) => {
      let lastY: number | undefined;
      let text = '';

      for (let item of textContent.items) {
        if (lastY === item.transform[5] || !lastY) {
          text += item.str;
        } else {
          text += '\n' + item.str;
        }
        lastY = item.transform[5];
      }

      return text;
    });
  };

  /**
   * Limpia y normaliza el texto extraído
   */
  private cleanExtractedText(rawText: string): string {
    return (
      rawText
        // Normalizar espacios en blanco
        .replace(/\s+/g, ' ')
        // Eliminar caracteres de control
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Normalizar saltos de línea
        .replace(/\n\s*\n/g, '\n\n')
        // Eliminar espacios al inicio y final
        .trim()
    );
  }

  /**
   * Extrae metadatos del PDF
   */
  private extractMetadata(
    pdfData: any,
    fileName: string,
  ): {
    title?: string;
    author?: string;
    language?: string;
  } {
    const info = pdfData.info || {};
    const metadata = pdfData.metadata || {};

    // Intentar extraer título
    let title = info.Title || metadata.Title;
    if (!title || title.trim().length === 0) {
      // Usar nombre del archivo como título si no hay título en metadatos
      title = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    }

    // Extraer autor
    const author = info.Author || metadata.Author || undefined;

    // Intentar detectar idioma (muy básico)
    const language = this.detectLanguage(pdfData.text);

    return {
      title: title?.trim(),
      author: author?.trim(),
      language,
    };
  }

  /**
   * Detecta el idioma del texto de forma básica
   */
  private detectLanguage(text: string): string {
    const sample = text.substring(0, 1000).toLowerCase();

    // Palabras comunes en español
    const spanishWords = [
      'el',
      'la',
      'de',
      'que',
      'y',
      'en',
      'un',
      'es',
      'se',
      'no',
      'te',
      'lo',
      'le',
      'da',
      'su',
      'por',
      'son',
      'con',
      'para',
      'como',
      'las',
      'pero',
      'sus',
      'una',
      'está',
      'ser',
      'tiene',
    ];

    // Palabras comunes en inglés
    const englishWords = [
      'the',
      'and',
      'is',
      'in',
      'to',
      'of',
      'a',
      'that',
      'it',
      'with',
      'for',
      'as',
      'was',
      'on',
      'are',
      'you',
      'this',
      'be',
      'at',
      'or',
      'have',
      'from',
      'an',
      'they',
      'which',
      'one',
      'had',
      'by',
    ];

    let spanishCount = 0;
    let englishCount = 0;

    spanishWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = sample.match(regex);
      if (matches) spanishCount += matches.length;
    });

    englishWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = sample.match(regex);
      if (matches) englishCount += matches.length;
    });

    return spanishCount > englishCount ? 'es' : 'en';
  }

  /**
   * Cuenta palabras en el texto
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }
}
