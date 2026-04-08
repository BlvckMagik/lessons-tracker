import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = Number(id);
  const { studentId, status } = await req.json();

  const ls = await prisma.lessonStudent.findFirst({
    where: { lessonId: numId, studentId },
  });

  if (!ls) {
    return NextResponse.json({ error: 'LessonStudent not found' }, { status: 404 });
  }

  await prisma.lessonStudent.update({
    where: { id: ls.id },
    data: { status: status === 'PLANNED' ? null : status },
  });

  const allStudentStatuses = await prisma.lessonStudent.findMany({
    where: { lessonId: numId },
    select: { status: true },
  });

  const allSet = allStudentStatuses.every((s) => s.status !== null);
  if (allSet) {
    const statuses = allStudentStatuses.map((s) => s.status!);
    const hasCompleted = statuses.includes('COMPLETED');
    const hasMissed = statuses.includes('MISSED');
    let lessonStatus = 'CANCELLED';
    if (hasCompleted) lessonStatus = 'COMPLETED';
    else if (hasMissed) lessonStatus = 'MISSED';
    await prisma.lesson.update({
      where: { id: numId },
      data: { status: lessonStatus },
    });
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: numId },
    include: { students: { include: { student: true } } },
  });

  return NextResponse.json(lesson);
}
