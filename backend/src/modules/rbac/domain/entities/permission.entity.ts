export class Permission {
  constructor(
    public readonly id: string,
    public action: string,
    public resource: string,
    public description?: string | null,
  ) {}
}
