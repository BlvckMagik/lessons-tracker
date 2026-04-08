import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { status } = await req.json();

  const lesson = await prisma.lesson.update({
    where: { id: Number(id) },
    data: { status },
    include: { students: { include: { student: true } } },
  });

  return NextResponse.json(lesson);
}
