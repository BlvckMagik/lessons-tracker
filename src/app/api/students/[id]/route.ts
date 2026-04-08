import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id: Number(id) } });
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(student);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const student = await prisma.student.update({
    where: { id: Number(id) },
    data: body,
  });
  return NextResponse.json(student);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.student.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
