import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { studentId, paid } = await req.json();

  await prisma.lessonStudent.updateMany({
    where: {
      lessonId: Number(id),
      studentId: Number(studentId),
    },
    data: { paid },
  });

  return NextResponse.json({ success: true });
}
