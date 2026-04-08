export interface Student {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  individualPrice: number | null;
  groupPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentDto {
  name: string;
  phone?: string;
  email?: string;
  individualPrice?: number | null;
  groupPrice?: number | null;
}

export interface UpdateStudentDto {
  name?: string;
  phone?: string;
  email?: string;
  individualPrice?: number | null;
  groupPrice?: number | null;
}
