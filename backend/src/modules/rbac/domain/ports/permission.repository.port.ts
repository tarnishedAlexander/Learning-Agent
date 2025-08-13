import { Permission } from '../entities/permission.entity';
export interface PermissionRepositoryPort {
  findById(id: string): Promise<Permission | null>;
  findByActionResource(
    action: string,
    resource: string,
  ): Promise<Permission | null>;
  create(
    action: string,
    resource: string,
    description?: string | null,
  ): Promise<Permission>;
  list(): Promise<Permission[]>;
}
