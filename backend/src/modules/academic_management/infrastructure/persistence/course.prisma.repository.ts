import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/prisma/prisma.service";
import { CourseRepositoryPort } from "../../domain/ports/courses.repository.ports";
import { Course } from "../../domain/entities/course.entity";

@Injectable()
export class CoursePrismaRepository implements CourseRepositoryPort {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<Course | null> {
        const courseData = await this.prisma.course.findUnique({ where: { id } });
        if (!courseData) return null;
        return new Course(
            courseData.id,
            courseData.name,
            courseData.isActive,
            courseData.teacherId
        )
    }

    async findByTeacherId(teacherId: string): Promise<Course[]> {
        const coursesData = await this.prisma.course.findMany({ where: { teacherId } });
        if (!coursesData) return [];
        return coursesData.map(c => new Course(
            c.id,
            c.name,
            c.isActive,
            c.teacherId
        ))
    }

    async create(name: string, teacherId: string): Promise<Course> {
        const newCourse = await this.prisma.course.create({
            data: {
                name,
                teacherId
            }
        })
        return new Course(
            newCourse.id,
            newCourse.name,
            newCourse.isActive,
            newCourse.teacherId
        )
    }

    async softDelete(id: string): Promise<Course> {
        return this.prisma.course.update({
            where: { id },
            data: {
                isActive: false
            }
        })
    }

    async list(): Promise<Course[]> {
        const rows = await this.prisma.course.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
        return rows.map((c) => new Course(
            c.id,
            c.name,
            c.isActive,
            c.teacherId
        ));
    }
}