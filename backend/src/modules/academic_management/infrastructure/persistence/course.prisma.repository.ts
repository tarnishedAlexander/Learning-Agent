import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/prisma/prisma.service";
import { CourseRepositoryPort } from "../../domain/ports/courses.repository.ports";
import { Course } from "../../domain/entities/course.entity";

@Injectable()
export class CoursePrismaRepository implements CourseRepositoryPort {
    constructor(private readonly prisma: PrismaService) {}
    
    async findById(id: string): Promise<Course | null> {
        throw new Error("Method not implemented.");
    }

    async findByTeacherId(id: string): Promise<Course[]> {
        throw new Error("Method not implemented.");
    }

    async create(name: string, teacherId: string): Promise<Course> {
        throw new Error("Method not implemented.");
    }

    async softDelete(id: string): Promise<Course> {
        throw new Error("Method not implemented.");
    }

    async list(): Promise<Course[]> {
        throw new Error("Method not implemented.");
    }
}