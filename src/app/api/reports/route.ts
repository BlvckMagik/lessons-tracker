import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { CHARGEABLE_STATUSES } from '@/shared/config/constants';

export async function GET() {
  const students = await prisma.student.findMany({
    include: {
      lessons: {
        include: {
          lesson: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const reports = students.map((student) => {
    const lessons = student.lessons.map((ls) => {
      const effectiveStatus = ls.status ?? ls.lesson.status;
      const charged = (CHARGEABLE_STATUSES as readonly string[]).includes(effectiveStatus);
      const price = ls.price || ls.lesson.pricePerStudent;
      return {
        lessonId: ls.lessonId,
        lessonStudentId: ls.id,
        type: ls.lesson.type,
        subject: ls.lesson.subject,
        startTime: ls.lesson.startTime.toISOString(),
        status: effectiveStatus,
        studentStatus: ls.status,
        pricePerStudent: price,
        paid: ls.paid,
        charged,
      };
    });

    const completed = lessons.filter((l) => l.status === 'COMPLETED').length;
    const missed = lessons.filter((l) => l.status === 'MISSED').length;
    const cancelled = lessons.filter((l) => l.status === 'CANCELLED').length;
    const totalCharged = lessons
      .filter((l) => l.charged)
      .reduce((sum, l) => sum + l.pricePerStudent, 0);
    const totalPaid = lessons
      .filter((l) => l.paid && l.charged)
      .reduce((sum, l) => sum + l.pricePerStudent, 0);

    return {
      studentId: student.id,
      studentName: student.name,
      totalLessons: lessons.length,
      completed,
      missed,
      cancelled,
      totalCharged,
      totalPaid,
      totalOwed: totalCharged - totalPaid,
      lessons,
    };
  });

  return NextResponse.json(reports);
}
