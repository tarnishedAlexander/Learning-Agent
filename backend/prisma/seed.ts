/* eslint-disable @typescript-eslint/no-misused-promises */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // --- Crear Roles ---
  const docenteRole = await prisma.role.upsert({
    where: { name: 'docente' },
    update: {},
    create: {
      name: 'docente',
      description: 'Docente que dicta materias',
    },
  });

  const estudianteRole = await prisma.role.upsert({
    where: { name: 'estudiante' },
    update: {},
    create: {
      name: 'estudiante',
      description: 'Estudiante inscrito en materias',
    },
  });

  // --- Hash de contraseñas ---
  const docentePassword = await bcrypt.hash('Docente123!', 10);
  const estudiantePassword = await bcrypt.hash('Estudiante123!', 10);

  // --- Crear usuario docente ---
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

  // --- Crear usuario estudiante ---
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

  // crear user
  const email = 'admin@example.com';
  const pass = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: pass,
      isActive: true,
      name: 'Patricio',
      lastname: 'Estrella',
    },
  });

  // --- Crear Categorías Predefinidas ---
  const categories = [
    {
      name: 'Matemáticas',
      description:
        'Documentos relacionados con matemáticas, álgebra, cálculo, geometría y estadística',
      color: '#3b82f6',
      icon: '📚',
    },
    {
      name: 'Programación',
      description:
        'Documentos sobre desarrollo de software, algoritmos, lenguajes de programación',
      color: '#10b981',
      icon: '💻',
    },
    {
      name: 'Historia',
      description:
        'Documentos históricos, biografías, eventos históricos y análisis temporal',
      color: '#f59e0b',
      icon: '🏛️',
    },
    {
      name: 'Ciencias',
      description:
        'Documentos científicos, investigación, física, química, biología',
      color: '#8b5cf6',
      icon: '🔬',
    },
    {
      name: 'Literatura',
      description:
        'Obras literarias, novelas, ensayos, poesía y análisis literario',
      color: '#ec4899',
      icon: '📖',
    },
    {
      name: 'Medicina',
      description:
        'Documentos médicos, anatomía, tratamientos, investigación médica',
      color: '#ef4444',
      icon: '⚕️',
    },
    {
      name: 'Economía',
      description:
        'Documentos económicos, finanzas, mercados, análisis económico',
      color: '#06b6d4',
      icon: '💰',
    },
    {
      name: 'Derecho',
      description: 'Documentos legales, leyes, jurisprudencia, contratos',
      color: '#64748b',
      icon: '⚖️',
    },
    {
      name: 'Educación',
      description:
        'Documentos educativos, pedagogía, metodologías de enseñanza',
      color: '#84cc16',
      icon: '🎓',
    },
    {
      name: 'General',
      description: 'Documentos que no encajan en categorías específicas',
      color: '#6b7280',
      icon: '📄',
    },
  ];

  for (const category of categories) {
    await prisma.documentCategory.upsert({
      where: { name: category.name },
      update: {},
      create: {
        id: `cat-${category.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
