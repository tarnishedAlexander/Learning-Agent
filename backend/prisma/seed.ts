/* eslint-disable @typescript-eslint/no-misused-promises */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // // --- Crear Roles ---
  // const docenteRole = await prisma.role.upsert({
  //   where: { name: 'docente' },
  //   update: {},
  //   create: {
  //     name: 'docente',
  //     description: 'Docente que dicta materias',
  //   },
  // });

  // const estudianteRole = await prisma.role.upsert({
  //   where: { name: 'estudiante' },
  //   update: {},
  //   create: {
  //     name: 'estudiante',
  //     description: 'Estudiante inscrito en materias',
  //   },
  // });

  // // --- Hash de contraseñas ---
  // const docentePassword = await bcrypt.hash('Docente123!', 10);
  // const estudiantePassword = await bcrypt.hash('Estudiante123!', 10);

  // // --- Crear usuario docente ---
  // const docente = await prisma.user.create({
  //   data: {
  //     email: 'docente@example.com',
  //     password: docentePassword,
  //     isActive: true,
  //     name: 'Doc',
  //     lastname: 'Ejemplo',
  //     roles: {
  //       create: [{ roleId: docenteRole.id }],
  //     },
  //     teacherProfile: {
  //       create: {
  //         academicUnit: 'Ingeniería de Sistemas',
  //         title: 'Ing.',
  //         bio: 'Docente de bases de datos avanzadas',
  //       },
  //     },
  //   },
  // });

  // // --- Crear usuario estudiante ---
  // const estudiante = await prisma.user.create({
  //   data: {
  //     email: 'estudiante@example.com',
  //     password: estudiantePassword,
  //     isActive: true,
  //     name: 'Patricio', 
  //     lastname: 'Estrella',
  //     roles: {
  //       create: [{ roleId: estudianteRole.id }],
  //     },
  //     studentProfile: {
  //       create: {
  //         code: '2025001',
  //         career: 'Ingeniería de Sistemas',
  //         admissionYear: 2025,
  //       },
  //     },
  //   },
  // });

  // // crear user
  // const email = 'admin@example.com';
  // const pass = await bcrypt.hash('admin123', 10);
  // await prisma.user.upsert({
  //   where: { email },
  //   update: {},
  //   create: { email, password: pass, isActive: true, name: 'Patricio', lastname: 'Estrella', },
  // });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
