export interface Student {
  nombres: string;
  apellidos: string;
  codigo: number;
  asistencia?: number;
  "1er_parcial"?: number;
  "2do_parcial"?: number;
  final?: number;
}

export interface StudentGroup {
  id: string;
  claseId: string;
  students: Student[];
}

export interface StudentInfo {
  userId: string;
  code: string;
  name: string;
  lastname: string;
  email: string;
  isActive: boolean;
  career?: string;
  admissionYear?: number;
}