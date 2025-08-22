export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public lastname: string,
    public email: string,
    public password: string,
    public isActive: boolean,
    public created_at: Date,
    public updated_at: Date,
  ) {}
}