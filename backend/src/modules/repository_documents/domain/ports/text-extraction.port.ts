import { ExtractedText } from '../value-objects/extracted-text.vo';

export interface TextExtractionPort {
  /**
   * Extrae texto de un archivo PDF
   * @param fileBuffer Buffer del archivo PDF
   * @param fileName Nombre original del archivo
   * @returns Texto extraído con metadatos
   */
  extractTextFromPdf(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<ExtractedText>;

  /**
   * Verifica si el archivo es válido para extracción
   * @param fileBuffer Buffer del archivo
   * @param mimeType Tipo MIME del archivo
   * @returns true si es válido para extracción
   */
  isValidForExtraction(fileBuffer: Buffer, mimeType: string): Promise<boolean>;

  /**
   * Obtiene información básica del PDF sin extraer todo el texto
   * @param fileBuffer Buffer del archivo PDF
   * @returns Metadatos básicos del PDF
   */
  getPdfInfo(fileBuffer: Buffer): Promise<{
    pageCount: number;
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  }>;
}
