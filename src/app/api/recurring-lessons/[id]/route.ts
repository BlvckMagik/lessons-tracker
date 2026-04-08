import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

type Params = { params: Promise<{ id: string }> };

function isValidIanaTimeZone(z: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: z });
    return true;
  } catch {
    return false;
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const recurring = await prisma.recurringLesson.findUnique({
    where: { id: Number(id) },
    include: { students: { include: { student: true } }, lessons: { select: { id: true } } },
  });
  if (!recurring) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(recurring);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.active !== undefined) data.active = body.active;
  if (body.daysOfWeek) data.daysOfWeek = body.daysOfWeek;
  if (body.startTime) data.startTime = body.startTime;
  if (body.endTime) data.endTime = body.endTime;
  if (body.type) data.type = body.type;
  if (body.subject) data.subject = body.subject;
  if (body.pricePerStudent !== undefined) data.pricePerStudent = body.pricePerStudent;
  if (body.repeatUntil !== undefined) data.repeatUntil = body.repeatUntil ? new Date(body.repeatUntil) : null;
  if (typeof body.timeZone === 'string' && isValidIanaTimeZone(body.timeZone.trim())) {
    data.timeZone = body.timeZone.trim();
  }

  const recurring = await prisma.recurringLesson.update({
    where: { id: Number(id) },
    data,
    include: { students: { include: { student: true } }, lessons: { select: { id: true } } },
  });

  return NextResponse.json(recurring);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const numId = Number(id);

  await prisma.lesson.deleteMany({
    where: {
      recurringLessonId: numId,
      status: 'PLANNED',
      startTime: { gt: new Date() },
    },
  });

  await prisma.recurringLesson.delete({ where: { id: numId } });

  return NextResponse.json({ success: true });
}
