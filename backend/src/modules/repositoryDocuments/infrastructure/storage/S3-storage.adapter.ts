import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DocumentStoragePort } from '../../domain/ports/document-storage.port';
import { Document } from '../../domain/entities/document.entity';
import {
  UploadDocumentRequest,
  DocumentListItem,
} from '../../domain/value-objects/upload-document.vo';
import { minioConfig } from '../config/minio.config';

/**
 * S3 Storage Adapter
 *
 * Implementa la interfaz DocumentRepositoryPort para almacenar documentos
 * en MinIO (S3 compatible).
 *
 * Funcionalidades:
 * - Subida de documentos a MinIO
 * - Generación de URLs firmadas para descarga
 * - Listado de documentos almacenados
 */
@Injectable()
export class S3StorageAdapter implements DocumentStoragePort {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly endpoint: string;

  constructor() {
    this.s3Client = new S3Client({
      region: minioConfig.region,
      endpoint: minioConfig.endpoint,
      credentials: {
        accessKeyId: minioConfig.accessKeyId,
        secretAccessKey: minioConfig.secretAccessKey,
      },
      forcePathStyle: true, // Necesario para MinIO
    });

    this.bucketName = minioConfig.bucketName;
    this.endpoint = minioConfig.endpoint;
  }

  /**
   * Sube un documento a MinIO
   * @param req - Datos del documento a subir
   * @returns Documento creado con metadata
   */
  async uploadDocument(req: UploadDocumentRequest): Promise<Document> {
    try {
      // Generar nombre único para el archivo
      const fileName = this.generateFileName(req.originalName);

      // Configurar comando de subida
      const putObjectCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: req.file,
        ContentType: req.mimeType,
        ContentLength: req.size,
        Metadata: {
          originalName: req.originalName,
          uploadDate: new Date().toISOString(),
        },
      });

      // Subir archivo a MinIO
      await this.s3Client.send(putObjectCommand);

      const url = `${this.endpoint}/${this.bucketName}/${fileName}`;

      // Crear entidad Document
      const document = Document.create(
        fileName,
        req.originalName,
        req.mimeType,
        req.size,
        url,
      );

      return document;
    } catch (error: any) {
      throw new Error(`Error uploading document to MinIO: ${error.message}`);
    }
  }

  /**
   * Genera una URL firmada para descargar un documento
   * @param fileName - Nombre del archivo en MinIO
   * @returns URL firmada válida por 1 hora
   */
  async generateDownloadUrl(fileName: string): Promise<string> {
    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      // Generar URL firmada válida por 1 hora
      const signedUrl = await getSignedUrl(this.s3Client, getObjectCommand, {
        expiresIn: 3600,
      });

      return signedUrl;
    } catch (error: any) {
      throw new Error(`Error generating download URL: ${error.message}`);
    }
  }

  /**
   * Lista todos los documentos almacenados en MinIO
   * @returns Array de documentos con metadata básica
   */
  async listDocuments(): Promise<DocumentListItem[]> {
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucketName,
      });

      const response = await this.s3Client.send(listCommand);
      if (!response.Contents || response.Contents.length === 0) {
        return [];
      }

      // Mapear objetos S3 a DocumentListItem
      const documents: DocumentListItem[] = [];

      for (const object of response.Contents) {
        if (!object.Key) continue;
        if (!object.Key.toLowerCase().endsWith('.pdf')) continue; // Filtrar solo PDFs

        try {
          const metadata = await this.s3Client.send(
            new HeadObjectCommand({
              Bucket: this.bucketName,
              Key: object.Key,
            }),
          );

          if (metadata.ContentType !== 'application/pdf') continue; // MIME PDF

          const downloadUrl = await this.generateDownloadUrl(object.Key);

          // Extraer el nombre original usando el parser de nombres o los metadatos
          const parsedInfo = this.parseFileName(object.Key);
          const originalName =
            metadata.Metadata?.originalName ||
            parsedInfo?.originalName ||
            object.Key;

          documents.push(
            new DocumentListItem(
              object.Key,
              originalName,
              metadata.ContentType || 'application/pdf',
              metadata.ContentLength || 0,
              downloadUrl,
              metadata.LastModified || new Date(),
            ),
          );
        } catch (error: any) {
          console.error(
            `Error fetching metadata for ${object.Key}: ${error.message}`,
          );
        }
      }

      return documents;
    } catch (error: any) {
      throw new Error(`Error listing documents from MinIO: ${error.message}`);
    }
  }

  /**
   * Genera un nombre único para el archivo combinando timestamp, UUID y nombre original
   * @param originalFileName - Nombre original del archivo
   * @returns Nombre único para MinIO con formato: documents/timestamp_uuid_nombreOriginal.pdf
   */
  private generateFileName(originalFileName: string): string {
    const timestamp = Date.now();
    const uniqueId = randomUUID();

    // Extraer la extensión del archivo
    const extension = originalFileName.split('.').pop()?.toLowerCase() || 'pdf';

    // Sanitizar el nombre original (solo mantener letras, números, guiones y puntos)
    const baseName = originalFileName
      .replace(/\.[^/.]+$/, '') // Remover extensión
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Reemplazar caracteres especiales
      .substring(0, 50); // Limitar longitud

    // Generar nombre único: timestamp_uuid_nombreOriginal.extension
    const uniqueFileName = `${timestamp}_${uniqueId}_${baseName}.${extension}`;

    return `documents/${uniqueFileName}`;
  }

  /**
   * Extrae información del nombre de archivo generado
   * @param fileName - Nombre del archivo generado (ej: documents/1234567890_uuid_documento.pdf)
   * @returns Objeto con timestamp, uuid, nombre original y extensión
   */
  private parseFileName(fileName: string): {
    timestamp: number;
    uuid: string;
    originalName: string;
    extension: string;
  } | null {
    try {
      // Remover el prefijo "documents/"
      const baseFileName = fileName.replace('documents/', '');

      // Buscar el patrón: timestamp_uuid_nombreOriginal.extension
      const match = baseFileName.match(/^(\d+)_([a-f0-9-]+)_(.+)\.([^.]+)$/);

      if (!match) {
        return null;
      }

      const [, timestampStr, uuid, originalName, extension] = match;

      return {
        timestamp: parseInt(timestampStr, 10),
        uuid,
        originalName: originalName.replace(/_/g, ' '), // Restaurar espacios
        extension,
      };
    } catch {
      return null;
    }
  }

  /**
   * Verifica si un archivo existe en MinIO
   * @param fileName - Nombre del archivo a verificar
   * @returns true si existe, false si no
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      await this.s3Client.send(headCommand);
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Elimina un archivo de MinIO
   * @param fileName - Nombre del archivo a eliminar
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      await this.s3Client.send(deleteCommand);
    } catch (error: any) {
      throw new Error(`Error deleting file from MinIO: ${error.message}`);
    }
  }
}
