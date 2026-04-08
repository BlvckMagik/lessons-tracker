import { prisma } from './prisma';
import { resolveStudentPrices } from './priceHelper';

const DEFAULT_WEEKS_AHEAD = 12;
const MIN_FUTURE_WEEKS = 4;

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function generateLessonInstances(recurringLessonId: number, weeksAhead: number = DEFAULT_WEEKS_AHEAD) {
  const recurring = await prisma.recurringLesson.findUnique({
    where: { id: recurringLessonId },
    include: { students: true, lessons: { select: { startTime: true } } },
  });

  if (!recurring || !recurring.active) return 0;

  const days = recurring.daysOfWeek.split(',').map(Number);
  const [startH, startM] = recurring.startTime.split(':').map(Number);
  const [endH, endM] = recurring.endTime.split(':').map(Number);

  const existingDates = new Set(
    recurring.lessons.map((l) => toLocalDateString(l.startTime))
  );

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = recurring.repeatUntil
    ? new Date(Math.min(recurring.repeatUntil.getTime(), today.getTime() + weeksAhead * 7 * 86400000))
    : new Date(today.getTime() + weeksAhead * 7 * 86400000);

  const lessonsToCreate: Array<{
    startTime: Date;
    endTime: Date;
  }> = [];

  const cursor = new Date(today);
  while (cursor <= endDate) {
    const dayOfWeek = cursor.getDay();
    if (days.includes(dayOfWeek)) {
      const dateStr = toLocalDateString(cursor);
      if (!existingDates.has(dateStr)) {
        const start = new Date(cursor);
        start.setHours(startH, startM, 0, 0);
        const end = new Date(cursor);
        end.setHours(endH, endM, 0, 0);

        if (start >= now || start >= today) {
          lessonsToCreate.push({ startTime: start, endTime: end });
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const studentIds = recurring.students.map((s) => s.studentId);
  const priceMap = await resolveStudentPrices(studentIds, recurring.type);

  for (const lessonData of lessonsToCreate) {
    await prisma.lesson.create({
      data: {
        type: recurring.type,
        subject: recurring.subject,
        startTime: lessonData.startTime,
        endTime: lessonData.endTime,
        pricePerStudent: 0,
        recurringLessonId: recurring.id,
        students: {
          create: recurring.students.map((s) => ({
            studentId: s.studentId,
            price: priceMap.get(s.studentId) ?? 0,
          })),
        },
      },
    });
  }

  return lessonsToCreate.length;
}

export async function ensureRecurringLessonsGenerated() {
  const activeTemplates = await prisma.recurringLesson.findMany({
    where: { active: true, repeatUntil: null },
    include: {
      lessons: {
        where: { status: 'PLANNED' },
        orderBy: { startTime: 'desc' },
        take: 1,
        select: { startTime: true },
      },
    },
  });

  const now = new Date();
  const threshold = new Date(now.getTime() + MIN_FUTURE_WEEKS * 7 * 86400000);

  for (const template of activeTemplates) {
    const lastPlanned = template.lessons[0]?.startTime;
    if (!lastPlanned || lastPlanned < threshold) {
      await generateLessonInstances(template.id, DEFAULT_WEEKS_AHEAD);
    }
  }
}
