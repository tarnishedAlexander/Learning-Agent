import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../core/prisma/prisma.service";
import { ClassesRepositoryPort } from "../../domain/ports/classes.repository.ports";
import { Classes } from "../../domain/entities/classes.entity";

@Injectable()
export class ClassesPrismaRepository implements ClassesRepositoryPort {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<Classes | null> {
        const classesData = await this.prisma.classes.findUnique({ where: { id } });
        if (!classesData) return null;
        return new Classes(
            classesData.id,
            classesData.name,
            classesData.semester,
            classesData.isActive,
            new Date(classesData.dateBegin),
            new Date(classesData.dateEnd),
            classesData.courseId
        )
    }

    async findByCourseId(courseId: string): Promise<Classes[]> {
        const isActive=true;
        const classesData = await this.prisma.classes.findMany({ where: { courseId, isActive } });
        if (!classesData) return [];
        return classesData.map(c => new Classes(
            c.id,
            c.name,
            c.semester,
            c.isActive,
            new Date(c.dateBegin),
            new Date(c.dateEnd),
            c.courseId
        ));
    };

    async create(name: string, semester: string, courseId: string, dateBegin: Date, dateEnd: Date): Promise<Classes> {
        const newClass = await this.prisma.classes.create({
            data: {
                name,
                semester,
                isActive: true,
                dateBegin,
                dateEnd,
                courseId
            }
        });
        return new Classes(
            newClass.id,
            newClass.name,
            newClass.semester,
            newClass.isActive,
            new Date(newClass.dateBegin),
            new Date(newClass.dateEnd),
            newClass.courseId
        );
    }

    async updateInfo(id: string, name: string, semester: string, dateBegin: Date, dateEnd: Date): Promise<Classes> {
        const data: { name?: string; semester?: string; dateBegin?: Date; dateEnd?: Date } = {};
        if (name) data.name=name;
        if (semester) data.semester=semester;
        if (dateBegin) data.dateBegin=dateBegin;
        if (dateEnd) data.dateEnd=dateEnd;
        
        return this.prisma.classes.update({
            where: {id},
            data
        })
    }

    async softDelete(id: string): Promise<Classes> {
        return this.prisma.classes.update({
            where: {id},
            data: {
                isActive:false
            }
        })
    }

    async list(): Promise<Classes[]> {
        const rows = await this.prisma.classes.findMany({ where: {isActive: true}, orderBy: { name: 'asc' } });
        return rows.map((c) => new Classes(
            c.id,
            c.name,
            c.semester,
            c.isActive,
            new Date(c.dateBegin),
            new Date(c.dateEnd),
            c.courseId
        ));
    }

}