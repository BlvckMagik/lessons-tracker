import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { ensureRecurringLessonsGenerated } from '@/shared/lib/generateLessons';
import { resolveStudentPrices } from '@/shared/lib/priceHelper';

export async function GET(req: NextRequest) {
  await ensureRecurringLessonsGenerated();

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.startTime = {};
    if (from) (where.startTime as Record<string, unknown>).gte = new Date(from);
    if (to) (where.startTime as Record<string, unknown>).lte = new Date(to);
  }

  const lessons = await prisma.lesson.findMany({
    where,
    include: {
      students: {
        include: { student: true },
      },
    },
    orderBy: { startTime: 'asc' },
  });

  return NextResponse.json(lessons);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const studentIds = body.studentIds as number[];
  const priceMap = await resolveStudentPrices(studentIds, body.type);

  const lesson = await prisma.lesson.create({
    data: {
      type: body.type,
      subject: body.subject,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      pricePerStudent: 0,
      students: {
        create: studentIds.map((studentId) => ({
          studentId,
          price: priceMap.get(studentId) ?? 0,
        })),
      },
    },
    include: {
      students: {
        include: { student: true },
      },
    },
  });

  return NextResponse.json(lesson, { status: 201 });
}
