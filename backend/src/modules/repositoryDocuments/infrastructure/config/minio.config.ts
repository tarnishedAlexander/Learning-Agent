export interface MinioConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  region: string;
}

export const minioConfig: MinioConfig = {
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  accessKeyId: process.env.MINIO_ROOT_USER || 'minioadmin',
  secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
  bucketName: process.env.MINIO_BUCKET_NAME || 'documents',
  region: process.env.MINIO_REGION || 'us-east-1',
};
