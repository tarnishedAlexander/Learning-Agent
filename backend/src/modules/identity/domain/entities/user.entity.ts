export class User {
  constructor(
    public readonly id: string,
    public email: string,
    public passwordHash: string,
    public isActive: boolean = true,
  ) {}
}
