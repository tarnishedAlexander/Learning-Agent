/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { DocumentRepository } from '../../domain/ports/document.repository.port';
import { DocumentEntity } from '../../domain/entities/document.entity';
import type { Document as PrismaDocument } from '@prisma/client';
import { Readable } from 'stream';

@Injectable()
export class DocumentPrismaRepository implements DocumentRepository {
  storage: any;
  constructor(private readonly prisma: PrismaService) {}

  async save(doc: Omit<DocumentEntity, 'id'>): Promise<DocumentEntity> {
    const created: PrismaDocument = await this.prisma.document.create({
      data: {
        originalName: doc.originalName,
        storedName: doc.storedName,
        s3Key: doc.s3Key,
        size: doc.size,
        contentType: doc.contentType,
        uploadedAt: doc.uploadedAt,
      },
    });

    return new DocumentEntity(
      created.id,
      doc.originalName,
      created.originalName,
      created.s3Key,
      created.size,
      created.contentType,
      created.uploadedAt,
    );
  }


async download(s3Key: string): Promise<Readable> {
    const document = await this.prisma.document.findFirst({
      where: { s3Key: s3Key },
    });

    if (!document) {
      throw new Error('Document not found');
    }
    return this.storage.getFile(document.s3Key);
  }
} 
