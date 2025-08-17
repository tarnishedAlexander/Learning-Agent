import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3StorageService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT;
    const region = process.env.MINIO_REGION || 'us-east-1';
    const accessKeyId = process.env.MINIO_ACCESS_KEY;
    const secretAccessKey = process.env.MINIO_SECRET_KEY;
    this.bucket = process.env.MINIO_BUCKET || 'documents';

    this.client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: process.env.MINIO_FORCE_PATH_STYLE === 'true',
    });
  }

  async upload(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<{ key: string; etag?: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      const res: PutObjectCommandOutput = await this.client.send(command);
      return { key, etag: res.ETag };
    } catch (err) {
      throw new InternalServerErrorException(
        'Error uploading file to storage: ' + (err as any).message,
      );
    }
  }

  getPublicUrl(key: string) {
    const endpoint =
      process.env.MINIO_ENDPOINT?.replace(/\/$/, '') || 'http://localhost:9000';
    const bucket = this.bucket;
    return `${endpoint}/${bucket}/${encodeURIComponent(key)}`;
  }
}
