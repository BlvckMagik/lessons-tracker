export interface Student {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentDto {
  name: string;
  phone?: string;
  email?: string;
}

export interface UpdateStudentDto {
  name?: string;
  phone?: string;
  email?: string;
}
