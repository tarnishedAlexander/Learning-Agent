export class ExtractedText {
  constructor(
    public readonly content: string,
    public readonly pageCount?: number,
    public readonly documentTitle?: string,
    public readonly documentAuthor?: string,
    public readonly language?: string,
    public readonly extractionMetadata?: Record<string, any>,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.content || this.content.trim().length === 0) {
      throw new Error('El texto extraído no puede estar vacío');
    }

    if (this.pageCount !== undefined && this.pageCount < 1) {
      throw new Error('El número de páginas debe ser mayor a 0');
    }
  }

  /**
   * Obtiene la longitud del texto extraído
   */
  getContentLength(): number {
    return this.content.length;
  }

  /**
   * Obtiene el número de palabras aproximado
   */
  getWordCount(): number {
    return this.content.trim().split(/\s+/).length;
  }

  /**
   * Verifica si el texto tiene un título extraído
   */
  hasTitle(): boolean {
    return Boolean(this.documentTitle && this.documentTitle.trim().length > 0);
  }

  /**
   * Verifica si el texto tiene autor extraído
   */
  hasAuthor(): boolean {
    return Boolean(
      this.documentAuthor && this.documentAuthor.trim().length > 0,
    );
  }

  /**
   * Obtiene un resumen del texto (primeros N caracteres)
   */
  getSummary(maxLength: number = 200): string {
    if (this.content.length <= maxLength) {
      return this.content;
    }

    return this.content.substring(0, maxLength).trim() + '...';
  }

  /**
   * Crea una instancia con metadatos adicionales
   */
  withMetadata(metadata: Record<string, any>): ExtractedText {
    return new ExtractedText(
      this.content,
      this.pageCount,
      this.documentTitle,
      this.documentAuthor,
      this.language,
      { ...this.extractionMetadata, ...metadata },
    );
  }
}
