import type { Student } from '@/entities/student/model/types';
import type { LessonType, LessonSubject } from '@/entities/lesson/model/types';

export interface RecurringLessonStudent {
  id: number;
  recurringLessonId: number;
  studentId: number;
  student: Student;
}

export interface RecurringLesson {
  id: number;
  daysOfWeek: string;
  startTime: string;
  endTime: string;
  type: LessonType;
  subject: LessonSubject;
  pricePerStudent: number;
  repeatUntil: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  students: RecurringLessonStudent[];
  lessons: { id: number }[];
}

export interface CreateRecurringLessonDto {
  daysOfWeek: string;
  startTime: string;
  endTime: string;
  type: LessonType;
  subject: LessonSubject;
  studentIds: number[];
  repeatUntil?: string;
}
