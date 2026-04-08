import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { generateLessonInstances } from '@/shared/lib/generateLessons';

export async function GET() {
  const recurring = await prisma.recurringLesson.findMany({
    include: { students: { include: { student: true } }, lessons: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(recurring);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const recurring = await prisma.recurringLesson.create({
    data: {
      daysOfWeek: body.daysOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      type: body.type,
      subject: body.subject,
      pricePerStudent: 0,
      repeatUntil: body.repeatUntil ? new Date(body.repeatUntil) : null,
      students: {
        create: (body.studentIds as number[]).map((studentId) => ({ studentId })),
      },
    },
    include: { students: { include: { student: true } } },
  });

  await generateLessonInstances(recurring.id);

  const result = await prisma.recurringLesson.findUnique({
    where: { id: recurring.id },
    include: { students: { include: { student: true } }, lessons: { select: { id: true } } },
  });

  return NextResponse.json(result, { status: 201 });
}
