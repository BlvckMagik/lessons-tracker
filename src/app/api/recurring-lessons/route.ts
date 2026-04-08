import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { generateLessonInstances } from '@/shared/lib/generateLessons';
import { parseRepeatUntilInput } from '@/shared/lib/repeatUntilParse';

const DEFAULT_TIMEZONE = 'Europe/Kyiv';

function isValidIanaTimeZone(z: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: z });
    return true;
  } catch {
    return false;
  }
}

function parseTimeZone(body: { timeZone?: unknown }): string {
  if (typeof body.timeZone === 'string' && isValidIanaTimeZone(body.timeZone.trim())) {
    return body.timeZone.trim();
  }
  return DEFAULT_TIMEZONE;
}

type CreateRecurringBody = {
  daysOfWeek: string;
  startTime: string;
  endTime: string;
  type: string;
  subject: string;
  studentIds: number[];
  repeatUntil?: string;
  timeZone?: unknown;
};

export async function GET() {
  const recurring = await prisma.recurringLesson.findMany({
    include: { students: { include: { student: true } }, lessons: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(recurring);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateRecurringBody;

  if (!Array.isArray(body.studentIds) || body.studentIds.length === 0) {
    return NextResponse.json({ error: 'Оберіть хоча б одного учня' }, { status: 400 });
  }

  const tz = parseTimeZone(body);
  const createData = {
    daysOfWeek: body.daysOfWeek,
    startTime: body.startTime,
    endTime: body.endTime,
    timeZone: tz,
    type: body.type,
    subject: body.subject,
    pricePerStudent: 0,
    repeatUntil: parseRepeatUntilInput(body.repeatUntil ?? null, tz),
    students: {
      create: body.studentIds.map((studentId) => ({ studentId })),
    },
  };

  const recurring = await prisma.recurringLesson.create({
    data: createData,
    include: { students: { include: { student: true } } },
  });

  await generateLessonInstances(recurring.id);

  const result = await prisma.recurringLesson.findUnique({
    where: { id: recurring.id },
    include: { students: { include: { student: true } }, lessons: { select: { id: true } } },
  });

  return NextResponse.json(result, { status: 201 });
}
