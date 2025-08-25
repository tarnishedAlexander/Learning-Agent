export class Document {
  constructor(
    public readonly fileName: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly url: string,
    public readonly uploadedAt: Date = new Date(),
  ) {}

  static create(
    fileName: string,
    originalName: string,
    mimeType: string,
    size: number,
    url: string,
  ): Document {
    return new Document(fileName, originalName, mimeType, size, url);
  }
}
