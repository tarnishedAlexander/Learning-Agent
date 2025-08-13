import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const permManageUsers = await prisma.permission.upsert({
    where: { action_resource: { action: 'manage', resource: 'users' } },
    update: {},
    create: { action: 'manage', resource: 'users', description: 'CRUD users' },
  });

  const roleAdmin = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Administrator' },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: roleAdmin.id,
        permissionId: permManageUsers.id,
      },
    },
    update: {},
    create: { roleId: roleAdmin.id, permissionId: permManageUsers.id },
  });
}

main().finally(() => prisma.$disconnect());
