import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

export async function GET() {
  const students = await prisma.student.findMany({
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const student = await prisma.student.create({
    data: {
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      individualPrice: body.individualPrice ?? null,
      groupPrice: body.groupPrice ?? null,
    },
  });
  return NextResponse.json(student, { status: 201 });
}
