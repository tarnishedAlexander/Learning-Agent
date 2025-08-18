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
        name: doc.storedName, 
        minIOKey: doc.s3Key,
        size: doc.size,
        contentType: doc.contentType,
        uploadAt: doc.uploadedAt,
      },
    });

    return new DocumentEntity(
      created.id,
      doc.originalName,
      created.name,
      created.minIOKey,
      created.size,
      created.contentType,
      created.uploadAt,
    );
  }


async download(s3Key: string): Promise<Readable> {
    const document = await this.prisma.document.findFirst({
      where: { minIOKey: s3Key },
    });

    if (!document) {
      throw new Error('Document not found');
    }
    return this.storage.getFile(document.minIOKey);
  }
} 
