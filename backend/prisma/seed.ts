/* eslint-disable @typescript-eslint/no-misused-promises */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('==> Seed iniciado');
  // --- Crear Roles ---
  let docenteRole, estudianteRole;
  try {
    docenteRole = await prisma.role.upsert({
    where: { name: 'docente' },
    update: {},
    create: {
      name: 'docente',
      description: 'Docente que dicta materias',
    },
    });
    estudianteRole = await prisma.role.upsert({
      where: { name: 'estudiante' },
      update: {},
      create: {
        name: 'estudiante',
        description: 'Estudiante inscrito en materias',
      },
    });
    console.log('==> Roles creados');
  } catch (err) {
    console.error('Error creando roles:', err);
    throw err;
  }

  // --- Hash de contraseñas ---
  let docentePassword, estudiantePassword;
  try {
    docentePassword = await bcrypt.hash('Docente123!', 10);
    estudiantePassword = await bcrypt.hash('Estudiante123!', 10);
    console.log('==> Contraseñas hasheadas');
  } catch (err) {
    console.error('Error hasheando contraseñas:', err);
    throw err;
  }

  // --- Crear usuario docente ---
  try {
    const docente = await prisma.user.create({
      data: {
        email: 'docente@example.com',
        password: docentePassword,
        isActive: true,
        name: 'Doc',
        lastname: 'Ejemplo',
        roles: {
          create: [{ roleId: docenteRole.id }],
        },
        teacherProfile: {
          create: {
            academicUnit: 'Ingeniería de Sistemas',
            title: 'Ing.',
            bio: 'Docente de bases de datos avanzadas',
          },
        },
      },
    });
    console.log('==> Usuario docente creado');
  } catch (err) {
    console.error('Error creando usuario docente:', err);
    throw err;
  }

  // --- Crear usuario estudiante ---
  try {
    const estudiante = await prisma.user.create({
      data: {
        email: 'estudiante@example.com',
        password: estudiantePassword,
        isActive: true,
        name: 'Patricio', 
        lastname: 'Estrella',
        roles: {
          create: [{ roleId: estudianteRole.id }],
        },
        studentProfile: {
          create: {
            code: '2025001',
            career: 'Ingeniería de Sistemas',
            admissionYear: 2025,
          },
        },
      },
    });
    console.log('==> Usuario estudiante creado');
  } catch (err) {
    console.error('Error creando usuario estudiante:', err);
    throw err;
  }

  // crear user
  try {
    const email = 'admin@example.com';
    const pass = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, password: pass, isActive: true, name: 'Patricio', lastname: 'Estrella', },
    });
    console.log('==> Usuario admin creado');
  } catch (err) {
    console.error('Error creando usuario admin:', err);
    throw err;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Seed ejecutado');
  });
