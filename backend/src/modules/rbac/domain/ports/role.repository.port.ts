import { Role } from '../entities/role.entity';
export interface RoleRepositoryPort {
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  create(name: string, description?: string | null): Promise<Role>;
  list(): Promise<Role[]>;
  attachPermission(roleId: string, permissionId: string): Promise<void>;
}
