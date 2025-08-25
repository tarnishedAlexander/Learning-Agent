import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateRoleUseCase } from '../../application/commands/create-role.usecase';
import { CreatePermissionUseCase } from '../../application/commands/create-permission.usecase';
import { AttachPermissionUseCase } from '../../application/commands/attach-permission.usecase';
import { ListRolesUseCase } from '../../application/queries/list-roles.usecase';
import { ListPermissionsUseCase } from '../../application/queries/list-permissions.usecase';
import { CreateRoleDto } from './dtos/create-role.dto';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rbac')
export class RbacController {
  constructor(
    private readonly createRole: CreateRoleUseCase,
    private readonly createPerm: CreatePermissionUseCase,
    private readonly attachPerm: AttachPermissionUseCase,
    private readonly listRoles: ListRolesUseCase,
    private readonly listPerms: ListPermissionsUseCase,
  ) {}

  @Post('roles')
  createRoleEndpoint(@Body() dto: CreateRoleDto) {
    return this.createRole.execute(dto);
  }

  @Post('permissions')
  createPermEndpoint(@Body() dto: CreatePermissionDto) {
    return this.createPerm.execute(dto);
  }

  @Post('roles/:roleId/permissions/:permissionId')
  attachPermission(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.attachPerm.execute({ roleId, permissionId });
  }

  @Get('roles')
  listRolesEndpoint() {
    return this.listRoles.execute();
  }

  @Get('permissions')
  listPermsEndpoint() {
    return this.listPerms.execute();
  }
}
