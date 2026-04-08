import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { resolveStudentPrices } from '@/shared/lib/priceHelper';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id: Number(id) },
    include: { students: { include: { student: true } } },
  });
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(lesson);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const numId = Number(id);

  const data: Record<string, unknown> = {};
  if (body.type) data.type = body.type;
  if (body.subject) data.subject = body.subject;
  if (body.startTime) data.startTime = new Date(body.startTime);
  if (body.endTime) data.endTime = new Date(body.endTime);
  if (body.status) data.status = body.status;

  if (body.studentIds) {
    const lessonType = body.type || (await prisma.lesson.findUnique({ where: { id: numId }, select: { type: true } }))?.type || 'INDIVIDUAL';
    const studentIds = body.studentIds as number[];
    const priceMap = await resolveStudentPrices(studentIds, lessonType);

    await prisma.lessonStudent.deleteMany({ where: { lessonId: numId } });
    await prisma.lessonStudent.createMany({
      data: studentIds.map((studentId) => ({
        lessonId: numId,
        studentId,
        price: priceMap.get(studentId) ?? 0,
      })),
    });
  }

  const lesson = await prisma.lesson.update({
    where: { id: numId },
    data,
    include: { students: { include: { student: true } } },
  });

  return NextResponse.json(lesson);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.lesson.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
