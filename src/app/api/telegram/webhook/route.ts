import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { sendMessage, answerCallbackQuery, verifyWebhookSecret } from '@/shared/lib/telegram';
import { LESSON_SUBJECT_LABELS } from '@/shared/config/constants';

const SETTINGS_ID = 1;

type ConversationState = { step: 'awaiting_notes' | 'awaiting_rating'; lessonId: number } | null;

async function getConversationState(): Promise<ConversationState> {
  const settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  if (!settings?.telegramConversationState) return null;
  try {
    return JSON.parse(settings.telegramConversationState);
  } catch {
    return null;
  }
}

async function setConversationState(state: ConversationState) {
  await prisma.settings.update({
    where: { id: SETTINGS_ID },
    data: { telegramConversationState: state ? JSON.stringify(state) : null },
  });
}

async function getChatId(): Promise<string | null> {
  const settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  return settings?.telegramChatId ?? null;
}

function getLessonSubjectLabel(subject: string): string {
  return LESSON_SUBJECT_LABELS[subject as keyof typeof LESSON_SUBJECT_LABELS] ?? subject;
}

export async function POST(req: NextRequest) {
  if (!verifyWebhookSecret(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const chatId = await getChatId();
  if (!chatId) return NextResponse.json({ ok: true });

  // Handle inline button tap
  if (body.callback_query) {
    const cq = body.callback_query;
    const data: string = cq.data ?? '';
    await answerCallbackQuery(cq.id);

    if (data.startsWith('status:')) {
      const [, lessonIdStr, status] = data.split(':');
      const lessonId = parseInt(lessonIdStr, 10);

      const VALID_STATUSES = ['COMPLETED', 'MISSED', 'CANCELLED'];
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ ok: true });
      }

      await prisma.lesson.update({ where: { id: lessonId }, data: { status } });
      await prisma.lessonStudent.updateMany({
        where: { lessonId },
        data: { status },
      });

      if (status === 'COMPLETED') {
        await setConversationState({ step: 'awaiting_notes', lessonId });
        await sendMessage(chatId, '✅ Статус оновлено!\n\nДодайте нотатки до уроку (або надішліть <b>–</b> щоб пропустити):');
      } else {
        const label = status === 'MISSED' ? '❌ Пропущено' : '🚫 Скасовано';
        await sendMessage(chatId, `${label} Статус оновлено.`);
      }
    }

    return NextResponse.json({ ok: true });
  }

  // Handle text message
  if (body.message?.text) {
    const text: string = body.message.text.trim();
    const state = await getConversationState();

    // Commands
    if (text === '/today') {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      const lessons = await prisma.lesson.findMany({
        where: { startTime: { gte: start, lte: end } },
        include: { students: { include: { student: true } } },
        orderBy: { startTime: 'asc' },
      });

      if (lessons.length === 0) {
        await sendMessage(chatId, '📅 Сьогодні уроків немає.');
      } else {
        const lines = lessons.map((l) => {
          const names = l.students.map((ls) => ls.student.name).join(', ');
          const startT = l.startTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' });
          const endT = l.endTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' });
          return `🕐 ${startT}–${endT} · ${names} · ${getLessonSubjectLabel(l.subject)}`;
        });
        await sendMessage(chatId, `📅 <b>Уроки сьогодні:</b>\n\n${lines.join('\n')}`);
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '/debts') {
      const students = await prisma.student.findMany({
        include: {
          lessons: {
            where: { lesson: { status: { in: ['COMPLETED', 'MISSED'] } }, paid: false },
            include: { lesson: true },
          },
        },
      });
      const debts = students
        .map((s) => ({
          name: s.name,
          debt: s.lessons.reduce((sum, ls) => sum + (ls.price || ls.lesson.pricePerStudent), 0),
        }))
        .filter((d) => d.debt > 0)
        .sort((a, b) => b.debt - a.debt);

      if (debts.length === 0) {
        await sendMessage(chatId, '✅ Боргів немає!');
      } else {
        const lines = debts.map((d) => `• ${d.name}: <b>${d.debt} грн</b>`);
        await sendMessage(chatId, `💸 <b>Борги учнів:</b>\n\n${lines.join('\n')}`);
      }
      return NextResponse.json({ ok: true });
    }

    // Conversation flow: notes → rating
    if (state?.step === 'awaiting_notes') {
      const notes = text === '–' || text === '-' ? null : text;
      await prisma.lesson.update({
        where: { id: state.lessonId },
        data: { notes },
      });
      await setConversationState({ step: 'awaiting_rating', lessonId: state.lessonId });
      await sendMessage(chatId, 'Оцініть урок: надішліть число від <b>1 до 5</b> (або <b>–</b> щоб пропустити):');
      return NextResponse.json({ ok: true });
    }

    if (state?.step === 'awaiting_rating') {
      const num = parseInt(text, 10);
      const rating = text === '–' || text === '-' ? null : (num >= 1 && num <= 5 ? num : null);
      await prisma.lesson.update({
        where: { id: state.lessonId },
        data: { rating },
      });
      await setConversationState(null);
      await sendMessage(chatId, '✓ Збережено!');
      return NextResponse.json({ ok: true });
    }
  }

  return NextResponse.json({ ok: true });
}
