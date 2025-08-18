export class DocumentEntity {
  constructor(
    public id: string,
    public originalName: string,
    public storedName: string,
    public s3Key: string,
    public size: number,
    public contentType: string,
    public uploadedAt: Date,
  ) {}
}
