export interface Student {
  id: number;
  name: string;
  telegram: string | null;
  individualPrice: number | null;
  groupPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentDto {
  name: string;
  telegram?: string;
  individualPrice?: number | null;
  groupPrice?: number | null;
}

export interface UpdateStudentDto {
  name?: string;
  telegram?: string;
  individualPrice?: number | null;
  groupPrice?: number | null;
}
