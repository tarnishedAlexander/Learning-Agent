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
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class S3StorageService {
  private client: S3Client;
  private bucket: string;
  private endpoint: string;

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
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: process.env.MINIO_FORCE_PATH_STYLE === 'true',
    });
  }

  private async ensureBucketExists() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (err: any) {
      throw new InternalServerErrorException(
        `Bucket "${this.bucket}" does not exist or is not accessible: ${err?.message || err}`,
      );
    }
  }

  async upload(buffer: Buffer, key: string, contentType: string) {
    try {
      await this.ensureBucketExists();

      if (!buffer || buffer.length === 0) {
        throw new Error('File buffer is empty');
      }

      if (!contentType) {
        contentType = 'application/octet-stream'; // fallback
      }

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      const res = await this.client.send(command);
      return { key, etag: res.ETag };
    } catch (err: any) {
      console.error('UPLOAD ERROR (raw):', err); // log detallado
      throw new InternalServerErrorException(
        'Error uploading file to storage: ' + (err?.message || err?.Code || err),
      );
    }
  }

  getPublicUrl(key: string) {
    return `${this.endpoint.replace(/\/$/, '')}/${this.bucket}/${encodeURIComponent(key)}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      const cmd = new HeadObjectCommand({ Bucket: this.bucket, Key: key });
      await this.client.send(cmd);
      return true;
    } catch (err: any) {
      if (err?.$metadata?.httpStatusCode === 404) return false;
      if (err?.code === 'NotFound' || err?.code === 'NoSuchKey') return false;
      throw new InternalServerErrorException(
        'Error checking object existence: ' + (err?.message || err),
      );
    }
  }

  private safeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  async getPresignedUrl(key: string, downloadFilename?: string, expiresInSeconds = 900) {
    try {
      const safeName = downloadFilename ? this.safeFilename(downloadFilename) : key;
      const getCmd = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${safeName}"`,
      });
      const url = await getSignedUrl(this.client, getCmd, { expiresIn: expiresInSeconds });
      return url;
    } catch (err: any) {
      throw new InternalServerErrorException(
        'Error generating presigned URL: ' + (err?.message || err),
      );
    }
  }

  async getFile(key: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    return response.Body as Readable;
  }
}