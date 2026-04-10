import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { sendMessage, setWebhook } from '@/shared/lib/telegram';
import { LESSON_SUBJECT_LABELS, LESSON_TYPE_LABELS } from '@/shared/config/constants';

const SETTINGS_ID = 1;

async function getSettings() {
  return prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' });
}

function buildStatusKeyboard(lessonId: number) {
  return {
    inline_keyboard: [[
      { text: '✅ Проведено', callback_data: `status:${lessonId}:COMPLETED` },
      { text: '❌ Пропущено', callback_data: `status:${lessonId}:MISSED` },
      { text: '🚫 Скасовано', callback_data: `status:${lessonId}:CANCELLED` },
    ]],
  };
}

export async function GET(request: Request) {
  const settings = await getSettings();
  if (!settings?.telegramChatId) {
    return NextResponse.json({ skipped: 'no telegramChatId configured' });
  }

  const chatId = settings.telegramChatId;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (appUrl) {
    const webhookUrl = `${appUrl}/api/telegram/webhook`;
    await setWebhook(webhookUrl);
  }

  const now = new Date();
  const reminderWindowStart = new Date(now.getTime() + 25 * 60 * 1000);
  const reminderWindowEnd = new Date(now.getTime() + 40 * 60 * 1000);
  const statusWindowStart = new Date(now.getTime() - 20 * 60 * 1000); // 20 min ago
  const statusWindowEnd = new Date(now.getTime() - 5 * 60 * 1000);    // 5 min ago

  // Upcoming lesson reminders
  const upcomingLessons = await prisma.lesson.findMany({
    where: {
      status: 'PLANNED',
      startTime: { gte: reminderWindowStart, lte: reminderWindowEnd },
      reminderSentAt: null,
    },
    include: { students: { include: { student: true } } },
  });

  for (const lesson of upcomingLessons) {
    const studentNames = lesson.students.map((ls) => ls.student.name).join(', ');
    const text = `📅 <b>Урок через ~30 хвилин</b>\n👤 ${studentNames}\n📚 ${LESSON_SUBJECT_LABELS[lesson.subject as keyof typeof LESSON_SUBJECT_LABELS]} · ${LESSON_TYPE_LABELS[lesson.type as keyof typeof LESSON_TYPE_LABELS]}\n🕐 ${formatTime(lesson.startTime)}–${formatTime(lesson.endTime)}`;

    await sendMessage(chatId, text);
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { reminderSentAt: now },
    });
  }

  // Post-lesson status prompts
  const pendingStatusLessons = await prisma.lesson.findMany({
    where: {
      status: 'PLANNED',
      endTime: { gte: statusWindowStart, lte: statusWindowEnd },
    },
    include: { students: { include: { student: true } } },
  });

  for (const lesson of pendingStatusLessons) {
    const studentNames = lesson.students.map((ls) => ls.student.name).join(', ');
    const text = `⏰ <b>Урок завершився</b>\n👤 ${studentNames}\n📚 ${LESSON_SUBJECT_LABELS[lesson.subject as keyof typeof LESSON_SUBJECT_LABELS]}\n🕐 ${formatTime(lesson.startTime)}–${formatTime(lesson.endTime)}\n\nЯк пройшов урок?`;

    await sendMessage(chatId, text, buildStatusKeyboard(lesson.id));
  }

  return NextResponse.json({
    reminders: upcomingLessons.length,
    statusPrompts: pendingStatusLessons.length,
  });
}
