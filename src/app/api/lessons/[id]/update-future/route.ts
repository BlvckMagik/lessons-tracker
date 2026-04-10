import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { resolveStudentPrices } from '@/shared/lib/priceHelper';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/lessons/[id]/update-future
// Updates the given lesson AND all future lessons in the same recurring series.
// Propagates: type, subject, studentIds, label.
// Per-lesson fields (startTime, endTime, status, notes, rating, homework) are not touched.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const numId = Number(id);
  const body = await req.json();

  const anchor = await prisma.lesson.findUnique({
    where: { id: numId },
    select: { recurringLessonId: true, startTime: true, type: true },
  });

  if (!anchor?.recurringLessonId) {
    return NextResponse.json({ error: 'Not a recurring lesson' }, { status: 400 });
  }

  const futureIds = (
    await prisma.lesson.findMany({
      where: {
        recurringLessonId: anchor.recurringLessonId,
        startTime: { gte: anchor.startTime },
      },
      select: { id: true },
    })
  ).map((l) => l.id);

  const data: Record<string, unknown> = {};
  if (body.type) data.type = body.type;
  if (body.subject) data.subject = body.subject;
  if (body.label !== undefined) data.label = body.label;

  // Update scalar fields on all future lessons
  if (Object.keys(data).length > 0) {
    await prisma.lesson.updateMany({ where: { id: { in: futureIds } }, data });
  }

  // Re-assign students for all future lessons if studentIds provided
  if (Array.isArray(body.studentIds) && body.studentIds.length > 0) {
    const studentIds = body.studentIds as number[];
    const lessonType = (body.type as string | undefined) ?? anchor.type;
    const priceMap = await resolveStudentPrices(
      studentIds,
      lessonType ?? 'INDIVIDUAL',
    );

    for (const lessonId of futureIds) {
      await prisma.lessonStudent.deleteMany({ where: { lessonId } });
      await prisma.lessonStudent.createMany({
        data: studentIds.map((studentId) => ({
          lessonId,
          studentId,
          price: priceMap.get(studentId) ?? 0,
        })),
      });
    }
  }

  const updated = await prisma.lesson.findUnique({
    where: { id: numId },
    include: { students: { include: { student: true } } },
  });

  return NextResponse.json({ updated, count: futureIds.length });
}
