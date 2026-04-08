import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const numId = Number(id);
  const { status } = await req.json();

  const lesson = await prisma.lesson.update({
    where: { id: numId },
    data: { status },
    include: { students: { include: { student: true } } },
  });

  await prisma.lessonStudent.updateMany({
    where: { lessonId: numId },
    data: { status: status === 'PLANNED' ? null : status },
  });

  const updated = await prisma.lesson.findUnique({
    where: { id: numId },
    include: { students: { include: { student: true } } },
  });

  return NextResponse.json(updated);
}
