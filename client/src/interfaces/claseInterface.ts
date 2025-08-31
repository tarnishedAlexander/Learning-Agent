export interface Clase {
  id: string;
  name: string;
  semester: string;
  teacherId: string;
  courseId?: string;
  dateBegin: string;
  dateEnd: string;
}

export interface CreateClassDTO {
  teacherId: string,
  courseId: string,
  semester: string,
  dateBegin: string,
  dateEnd: string
}
