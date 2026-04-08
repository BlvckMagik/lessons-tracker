import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

export async function GET(req: NextRequest) {
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

  const lesson = await prisma.lesson.create({
    data: {
      type: body.type,
      subject: body.subject,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      pricePerStudent: body.pricePerStudent,
      students: {
        create: (body.studentIds as number[]).map((studentId) => ({
          studentId,
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
