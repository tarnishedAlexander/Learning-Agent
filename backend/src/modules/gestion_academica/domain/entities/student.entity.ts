export class Student {
  constructor(
    public readonly userId: string,
    public code: string,
    public career?: string,
    public admissionYear?: number,
  ) {}
}