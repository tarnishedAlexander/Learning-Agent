export class User {
  constructor(
    public readonly id: string,
    public email: string,
    public name: string,
    public lastname: string,
    public passwordHash: string,
    public isActive: boolean = true,
  ) {}
}
