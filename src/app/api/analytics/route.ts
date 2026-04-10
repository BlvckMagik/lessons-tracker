import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthsBack = parseInt(searchParams.get('months') ?? '6', 10);

  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
  const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // All completed/missed lessons in range (chargeable)
  const lessons = await prisma.lesson.findMany({
    where: {
      startTime: { gte: fromDate, lte: toDate },
      status: { in: ['COMPLETED', 'MISSED'] },
    },
    include: {
      students: { include: { student: true } },
    },
  });

  // Income by month: { month: 'YYYY-MM', income: number }[]
  const incomeByMonth: Record<string, number> = {};
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    incomeByMonth[key] = 0;
  }
  for (const lesson of lessons) {
    const key = `${lesson.startTime.getFullYear()}-${String(lesson.startTime.getMonth() + 1).padStart(2, '0')}`;
    if (key in incomeByMonth) {
      const paid = lesson.students.reduce((sum, ls) => sum + (ls.paid ? (ls.price || lesson.pricePerStudent) : 0), 0);
      incomeByMonth[key] += paid;
    }
  }

  // Lesson count by month
  const lessonCountByMonth: Record<string, number> = {};
  for (const key of Object.keys(incomeByMonth)) lessonCountByMonth[key] = 0;
  for (const lesson of lessons) {
    const key = `${lesson.startTime.getFullYear()}-${String(lesson.startTime.getMonth() + 1).padStart(2, '0')}`;
    if (key in lessonCountByMonth) lessonCountByMonth[key]++;
  }

  // Student debts: who owes money (all time, not just range)
  const allStudents = await prisma.student.findMany({
    include: {
      lessons: {
        where: {
          lesson: { status: { in: ['COMPLETED', 'MISSED'] } },
          paid: false,
        },
        include: { lesson: true },
      },
    },
  });
  const debts = allStudents
    .map((s) => ({
      studentId: s.id,
      studentName: s.name,
      unpaidLessons: s.lessons.length,
      totalDebt: s.lessons.reduce((sum, ls) => sum + (ls.price || ls.lesson.pricePerStudent), 0),
    }))
    .filter((d) => d.totalDebt > 0)
    .sort((a, b) => b.totalDebt - a.totalDebt);

  // Missed lessons this month per student
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const missedThisMonth = await prisma.lessonStudent.findMany({
    where: {
      lesson: { startTime: { gte: thisMonthStart }, status: 'MISSED' },
    },
    include: { student: true },
  });
  const missedByStudent: Record<number, { studentId: number; studentName: string; count: number }> = {};
  for (const ls of missedThisMonth) {
    if (!missedByStudent[ls.studentId]) {
      missedByStudent[ls.studentId] = { studentId: ls.studentId, studentName: ls.student.name, count: 0 };
    }
    missedByStudent[ls.studentId].count++;
  }

  // Summary cards
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const incomeThisMonth = incomeByMonth[thisMonthKey] ?? 0;
  const lessonsThisMonth = lessonCountByMonth[thisMonthKey] ?? 0;
  const totalDebt = debts.reduce((sum, d) => sum + d.totalDebt, 0);

  return NextResponse.json({
    summary: { incomeThisMonth, lessonsThisMonth, totalDebt },
    incomeByMonth: Object.entries(incomeByMonth)
      .map(([month, income]) => ({ month, income }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    lessonCountByMonth: Object.entries(lessonCountByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    debts,
    missedThisMonth: Object.values(missedByStudent).sort((a, b) => b.count - a.count),
  });
}
