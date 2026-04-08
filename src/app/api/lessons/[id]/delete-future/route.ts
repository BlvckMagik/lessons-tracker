import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numId = Number(id);

  const lesson = await prisma.lesson.findUnique({ where: { id: numId } });
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  if (!lesson.recurringLessonId) {
    await prisma.lesson.delete({ where: { id: numId } });
    return NextResponse.json({ deleted: 1 });
  }

  const result = await prisma.lesson.deleteMany({
    where: {
      recurringLessonId: lesson.recurringLessonId,
      status: 'PLANNED',
      startTime: { gte: lesson.startTime },
    },
  });

  const remaining = await prisma.lesson.count({
    where: { recurringLessonId: lesson.recurringLessonId },
  });

  if (remaining === 0) {
    await prisma.recurringLesson.update({
      where: { id: lesson.recurringLessonId },
      data: { active: false },
    });
  } else {
    const lastLesson = await prisma.lesson.findFirst({
      where: { recurringLessonId: lesson.recurringLessonId },
      orderBy: { startTime: 'desc' },
    });
    if (lastLesson) {
      await prisma.recurringLesson.update({
        where: { id: lesson.recurringLessonId },
        data: { repeatUntil: lastLesson.startTime },
      });
    }
  }

  return NextResponse.json({ deleted: result.count });
}
