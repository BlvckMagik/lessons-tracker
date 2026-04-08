import { NextRequest, NextResponse } from 'next/server';
import { generateLessonInstances } from '@/shared/lib/generateLessons';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const weeks = body.weeks || 8;

  const created = await generateLessonInstances(Number(id), weeks);

  return NextResponse.json({ created });
}
