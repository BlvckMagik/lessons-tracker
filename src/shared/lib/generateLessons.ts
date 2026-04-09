import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { prisma } from './prisma';
import { resolveStudentPrices } from './priceHelper';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const DEFAULT_WEEKS_AHEAD = 12;
const MIN_FUTURE_WEEKS = 4;
const DEFAULT_TIMEZONE = 'Europe/Kyiv';

function isValidIanaTimeZone(z: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: z });
    return true;
  } catch {
    return false;
  }
}

function resolveLessonTimeZone(raw: string | null | undefined): string {
  if (raw && typeof raw === 'string') {
    const t = raw.trim();
    if (t && isValidIanaTimeZone(t)) return t;
  }
  return DEFAULT_TIMEZONE;
}

function wallClockToUtc(
  dateYmd: string,
  hour: number,
  minute: number,
  tz: string,
): dayjs.Dayjs {
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return dayjs.tz(`${dateYmd} ${h}:${m}:00`, 'YYYY-MM-DD HH:mm:ss', tz).utc();
}

export async function generateLessonInstances(recurringLessonId: number, weeksAhead: number = DEFAULT_WEEKS_AHEAD) {
  const recurring = await prisma.recurringLesson.findUnique({
    where: { id: recurringLessonId },
    include: { students: true, lessons: { select: { startTime: true } } },
  });

  if (!recurring || !recurring.active) return 0;

  const tz = resolveLessonTimeZone((recurring as unknown as { timeZone?: string | null }).timeZone);
  const days = Array.from(
    new Set(
      recurring.daysOfWeek
        .split(',')
        .map((p) => Number(p.trim()))
        .filter((n) => n >= 0 && n <= 6),
    ),
  );
  if (days.length === 0) return 0;

  const [startH, startM] = recurring.startTime.split(':').map(Number);
  const [endH, endM] = recurring.endTime.split(':').map(Number);

  const nowUtc = dayjs.utc();

  const existingDates = new Set(
    recurring.lessons.map((l) => dayjs.utc(l.startTime).tz(tz).format('YYYY-MM-DD')),
  );

  const nowInTz = dayjs.tz(nowUtc.valueOf(), tz);
  const minStartUtc = nowInTz.startOf('day').utc();
  const dow = nowInTz.day();
  const offsetFromMonday = dow === 0 ? 6 : dow - 1;
  let cursor = nowInTz.subtract(offsetFromMonday, 'day').startOf('day');
  const weeksEnd = nowInTz.add(weeksAhead, 'week').endOf('day');
  let rangeEnd = weeksEnd;
  if (recurring.repeatUntil) {
    const until = dayjs.utc(recurring.repeatUntil).tz(tz).endOf('day');
    rangeEnd = until.isBefore(weeksEnd) ? until : weeksEnd;
  }

  const lessonsToCreate: Array<{ startTime: Date; endTime: Date }> = [];

  while (!cursor.isAfter(rangeEnd)) {
    const dow = cursor.day();
    if (days.includes(dow)) {
      const dateStr = cursor.format('YYYY-MM-DD');
      if (!existingDates.has(dateStr)) {
        const startUtc = wallClockToUtc(dateStr, startH, startM, tz);
        const endUtc = wallClockToUtc(dateStr, endH, endM, tz);
        if (endUtc.isAfter(startUtc) && !startUtc.isBefore(minStartUtc)) {
          lessonsToCreate.push({
            startTime: startUtc.toDate(),
            endTime: endUtc.toDate(),
          });
        }
      }
    }
    cursor = cursor.add(1, 'day');
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
