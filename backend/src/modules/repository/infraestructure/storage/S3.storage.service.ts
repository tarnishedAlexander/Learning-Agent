/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandOutput,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3StorageService {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;
  safeFilename: any;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    const region = process.env.MINIO_REGION || 'us-east-1';
    const accessKeyId = process.env.MINIO_ACCESS_KEY;
    const secretAccessKey = process.env.MINIO_SECRET_KEY;
    this.bucket = process.env.MINIO_BUCKET || 'documents';
    this.endpoint = endpoint;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('MINIO_ACCESS_KEY and MINIO_SECRET_KEY must be defined');
    }
    this.client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
      },
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
    // utilidad si quieres URL no firmada (depende de configuración MinIO)
    return `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${encodeURIComponent(key)}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      const cmd = new HeadObjectCommand({ Bucket: this.bucket, Key: key });
      const res: HeadObjectCommandOutput = await this.client.send(cmd);
      return true;
    } catch (err: any) {
      if (err?.$metadata?.httpStatusCode === 404) return false;
      if (err?.code === 'NotFound' || err?.code === 'NoSuchKey') return false;
      throw new InternalServerErrorException(
        'Error checking object existence: ' + (err?.message || err),
      );
    }
  }

  async getPresignedUrl(
    key: string,
    downloadFilename?: string,
    expiresInSeconds = 900,
  ): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const safeName = downloadFilename
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        ? this.safeFilename(downloadFilename)
        : key;
      const getCmd = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${safeName}"`,
      });
      const url = await getSignedUrl(this.client, getCmd, {
        expiresIn: expiresInSeconds,
      });
      return url;
      return url;
    } catch (err: any) {
      throw new InternalServerErrorException(
        'Error generating presigned URL: ' + (err?.message || err),
      );
    }
  }
}
