import type { Student } from '@/entities/student/model/types';

export type LessonType = 'INDIVIDUAL' | 'GROUP';
export type LessonSubject = 'ENGLISH' | 'GERMAN';
export type LessonStatus = 'PLANNED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

export interface LessonStudent {
  id: number;
  lessonId: number;
  studentId: number;
  paid: boolean;
  status: LessonStatus | null;
  price: number;
  student: Student;
}

export interface Lesson {
  id: number;
  type: LessonType;
  subject: LessonSubject;
  startTime: string;
  endTime: string;
  status: LessonStatus;
  pricePerStudent: number;
  recurringLessonId: number | null;
  createdAt: string;
  updatedAt: string;
  students: LessonStudent[];
}

export interface CreateLessonDto {
  type: LessonType;
  subject: LessonSubject;
  startTime: string;
  endTime: string;
  studentIds: number[];
}

export interface UpdateLessonDto {
  type?: LessonType;
  subject?: LessonSubject;
  startTime?: string;
  endTime?: string;
  studentIds?: number[];
  status?: LessonStatus;
}

export interface StudentReport {
  studentId: number;
  studentName: string;
  totalLessons: number;
  completed: number;
  missed: number;
  cancelled: number;
  totalCharged: number;
  totalPaid: number;
  totalOwed: number;
  lessons: LessonReportItem[];
}

export interface LessonReportItem {
  lessonId: number;
  lessonStudentId: number;
  type: LessonType;
  subject: LessonSubject;
  startTime: string;
  status: LessonStatus;
  studentStatus: LessonStatus | null;
  pricePerStudent: number;
  paid: boolean;
  charged: boolean;
}
