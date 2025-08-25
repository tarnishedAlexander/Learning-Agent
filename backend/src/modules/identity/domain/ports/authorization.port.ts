export interface AuthorizationPort {
  getRolesForUser(userId: string): Promise<string[]>;
}
