# Telegram Hub, Lesson Notes & Analytics — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lesson notes (free text + star rating), an analytics dashboard, and a Telegram bot that acts as a central hub for reminders and lesson status management.

**Architecture:** Telegram bot uses Vercel Cron (every 15 min) to send proactive reminders; a webhook handler processes inline button taps and text replies. Notes and rating are stored on the `Lesson` model. Analytics are aggregated server-side in a new `/api/analytics` route rendered on a new `/analytics` page using recharts.

**Tech Stack:** Next.js 15 App Router, Prisma + PostgreSQL, Redux Toolkit / RTK Query, MUI v6, recharts, Telegram Bot API (no SDK — plain fetch), Vercel Cron.

---

## File Map

### New files
| File | Responsibility |
|---|---|
| `src/features/lessonNotes/ui/lessonNotesStep.tsx` | Inline notes + rating form rendered after COMPLETED status is set |
| `src/widgets/analyticsBoard/ui/analyticsBoard.tsx` | Full analytics dashboard widget |
| `src/app/analytics/page.tsx` | `/analytics` route page |
| `src/app/settings/page.tsx` | `/settings` route page |
| `src/widgets/settingsForm/ui/settingsForm.tsx` | Settings form (prices + Telegram Chat ID) |
| `src/app/api/analytics/route.ts` | Analytics aggregation endpoint |
| `src/app/api/telegram/webhook/route.ts` | Processes Telegram updates |
| `src/app/api/telegram/cron/route.ts` | Checks lessons and sends reminders |
| `src/shared/lib/telegram.ts` | sendMessage / answerCallbackQuery / registerWebhook helpers |
| `vercel.json` | Cron schedule definition |

### Modified files
| File | What changes |
|---|---|
| `prisma/schema.prisma` | Add `notes`, `rating`, `reminderSentAt` to Lesson; `telegramChatId`, `telegramConversationState` to Settings |
| `src/entities/lesson/model/types.ts` | Add `notes`, `rating` to `Lesson`; add `notes`, `rating` to `UpdateLessonDto` |
| `src/entities/settings/model/types.ts` | Add `telegramChatId`, `telegramConversationState` to `Settings` and `UpdateSettingsDto` |
| `src/entities/settings/api/settingsApi.ts` | Update `UpdateSettingsDto` to include new fields |
| `src/app/api/lessons/[id]/route.ts` | Accept `notes`, `rating` in PATCH body |
| `src/app/api/settings/route.ts` | Accept `telegramChatId`, `telegramConversationState` in PUT body |
| `src/features/lessonStatus/ui/lessonStatusButtons.tsx` | After COMPLETED: render `LessonNotesStep` |
| `src/features/editLesson/ui/editLessonDialog.tsx` | Add notes textarea + star rating for COMPLETED lessons |
| `src/widgets/reportTable/ui/reportTable.tsx` | Add notes/rating column to lesson details rows |
| `src/widgets/sidebar/ui/sidebar.tsx` | Add Analytics and Settings nav items |

---

## Task 1: DB Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update schema.prisma**

Replace the `Lesson` and `Settings` models with:

```prisma
model Lesson {
  id                Int           @id @default(autoincrement())
  type              String
  subject           String
  startTime         DateTime
  endTime           DateTime
  status            String        @default("PLANNED")
  pricePerStudent   Int           @default(0)
  recurringLessonId Int?
  notes             String?
  rating            Int?
  reminderSentAt    DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  students          LessonStudent[]
  recurringLesson   RecurringLesson? @relation(fields: [recurringLessonId], references: [id])
}

model Settings {
  id                        Int     @id @default(autoincrement())
  defaultIndividualPrice    Int     @default(200)
  defaultGroupPrice         Int     @default(50)
  telegramChatId            String?
  telegramConversationState String?
}
```

- [ ] **Step 2: Run migration**

```bash
pnpm db:push
```

Expected: Prisma applies the schema diff, no data loss. Verify with `pnpm db:studio` — Lesson table should have `notes`, `rating`, `reminderSentAt` columns; Settings should have `telegramChatId`, `telegramConversationState`.

- [ ] **Step 3: Regenerate Prisma client**

```bash
pnpm db:generate
```

Expected: `Generated Prisma Client` output with no errors.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add notes, rating, reminderSentAt to Lesson; telegram fields to Settings"
```

---

## Task 2: Update TypeScript Types

**Files:**
- Modify: `src/entities/lesson/model/types.ts`
- Modify: `src/entities/settings/model/types.ts`

- [ ] **Step 1: Update Lesson types**

In `src/entities/lesson/model/types.ts`, add `notes` and `rating` to `Lesson` and `UpdateLessonDto`:

```typescript
import type { Student } from '@/entities/student/model/types';

export type LessonType = 'INDIVIDUAL' | 'GROUP';
export type LessonSubject = 'ENGLISH' | 'GERMAN';
export type LessonStatus = 'PLANNED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

export interface LessonStudent {
  id: number;
  lessonId: number;
  studentId: number;
  paid: boolean;
  status: LessonStatus | null;
  price: number;
  student: Student;
}

export interface Lesson {
  id: number;
  type: LessonType;
  subject: LessonSubject;
  startTime: string;
  endTime: string;
  status: LessonStatus;
  pricePerStudent: number;
  recurringLessonId: number | null;
  notes: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  students: LessonStudent[];
}

export interface CreateLessonDto {
  type: LessonType;
  subject: LessonSubject;
  startTime: string;
  endTime: string;
  studentIds: number[];
}

export interface UpdateLessonDto {
  type?: LessonType;
  subject?: LessonSubject;
  startTime?: string;
  endTime?: string;
  studentIds?: number[];
  status?: LessonStatus;
  notes?: string | null;
  rating?: number | null;
}

export interface StudentReport {
  studentId: number;
  studentName: string;
  totalLessons: number;
  completed: number;
  missed: number;
  cancelled: number;
  totalCharged: number;
  totalPaid: number;
  totalOwed: number;
  lessons: LessonReportItem[];
}

export interface LessonReportItem {
  lessonId: number;
  lessonStudentId: number;
  type: LessonType;
  subject: LessonSubject;
  startTime: string;
  status: LessonStatus;
  studentStatus: LessonStatus | null;
  pricePerStudent: number;
  paid: boolean;
  charged: boolean;
  notes: string | null;
  rating: number | null;
}
```

- [ ] **Step 2: Update Settings types**

Replace `src/entities/settings/model/types.ts`:

```typescript
export interface Settings {
  id: number;
  defaultIndividualPrice: number;
  defaultGroupPrice: number;
  telegramChatId: string | null;
  telegramConversationState: string | null;
}

export interface UpdateSettingsDto {
  defaultIndividualPrice?: number;
  defaultGroupPrice?: number;
  telegramChatId?: string | null;
  telegramConversationState?: string | null;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | head -30
```

Expected: No type errors related to the new fields (there may be some TS errors in later tasks since we haven't updated all consumers yet — that's expected at this stage; only fail if the types themselves are invalid).

- [ ] **Step 4: Commit**

```bash
git add src/entities/lesson/model/types.ts src/entities/settings/model/types.ts
git commit -m "feat: add notes/rating to Lesson type, telegram fields to Settings type"
```

---

## Task 3: Update API Endpoints

**Files:**
- Modify: `src/app/api/lessons/[id]/route.ts`
- Modify: `src/app/api/settings/route.ts`
- Modify: `src/app/api/reports/route.ts`

- [ ] **Step 1: Update PATCH /api/lessons/[id] to persist notes and rating**

Read the existing file first, then in `src/app/api/lessons/[id]/route.ts`, find the PATCH handler and add `notes` and `rating` to the `prisma.lesson.update` data block. The update data section should become:

```typescript
// inside PATCH handler, update the data object passed to prisma.lesson.update:
data: {
  ...(body.type !== undefined && { type: body.type }),
  ...(body.subject !== undefined && { subject: body.subject }),
  ...(body.startTime !== undefined && { startTime: new Date(body.startTime) }),
  ...(body.endTime !== undefined && { endTime: new Date(body.endTime) }),
  ...(body.status !== undefined && { status: body.status }),
  ...(body.notes !== undefined && { notes: body.notes }),
  ...(body.rating !== undefined && { rating: body.rating }),
},
```

Also update the `include` in the GET and PATCH select to return `notes` and `rating` — Prisma returns all scalar fields by default so no include change is needed.

- [ ] **Step 2: Update PUT /api/settings/route.ts to persist Telegram fields**

Replace `src/app/api/settings/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

const SETTINGS_ID = 1;

async function getOrCreateSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: SETTINGS_ID, defaultIndividualPrice: 200, defaultGroupPrice: 50 },
    });
  }
  return settings;
}

export async function GET() {
  const settings = await getOrCreateSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  await getOrCreateSettings();
  const settings = await prisma.settings.update({
    where: { id: SETTINGS_ID },
    data: {
      ...(body.defaultIndividualPrice !== undefined && { defaultIndividualPrice: body.defaultIndividualPrice }),
      ...(body.defaultGroupPrice !== undefined && { defaultGroupPrice: body.defaultGroupPrice }),
      ...(body.telegramChatId !== undefined && { telegramChatId: body.telegramChatId }),
      ...(body.telegramConversationState !== undefined && { telegramConversationState: body.telegramConversationState }),
    },
  });
  return NextResponse.json(settings);
}
```

- [ ] **Step 3: Update /api/reports to return notes and rating on lesson items**

In `src/app/api/reports/route.ts`, update the lesson mapping inside `students.map` to include `notes` and `rating`:

```typescript
return {
  lessonId: ls.lessonId,
  lessonStudentId: ls.id,
  type: ls.lesson.type,
  subject: ls.lesson.subject,
  startTime: ls.lesson.startTime.toISOString(),
  status: effectiveStatus,
  studentStatus: ls.status,
  pricePerStudent: price,
  paid: ls.paid,
  charged,
  notes: ls.lesson.notes ?? null,
  rating: ls.lesson.rating ?? null,
};
```

- [ ] **Step 4: Test the endpoints**

```bash
# Start dev server in another terminal first, then:
curl -s http://localhost:3000/api/settings | jq .
# Expected: { id: 1, defaultIndividualPrice: 200, defaultGroupPrice: 50, telegramChatId: null, telegramConversationState: null }

curl -s -X PUT http://localhost:3000/api/settings \
  -H 'Content-Type: application/json' \
  -d '{"telegramChatId":"123456789"}' | jq .telegramChatId
# Expected: "123456789"
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/lessons/[id]/route.ts src/app/api/settings/route.ts src/app/api/reports/route.ts
git commit -m "feat: expose notes/rating in lesson PATCH and reports; add telegram fields to settings API"
```

---

## Task 4: Update Settings RTK Query API

**Files:**
- Modify: `src/entities/settings/api/settingsApi.ts`

- [ ] **Step 1: Read the current settingsApi.ts**

Read `src/entities/settings/api/settingsApi.ts` to see current structure.

- [ ] **Step 2: Update the mutation to use partial UpdateSettingsDto**

The `updateSettings` mutation should pass through the partial body. Replace the file content preserving existing structure but update the mutation body type to `UpdateSettingsDto` (which is now partial). Since RTK Query passes the body directly, the main change is ensuring the type is imported from the updated types file. Verify the file imports `UpdateSettingsDto` from `@/entities/settings/model/types` and passes it directly as the request body.

- [ ] **Step 3: Commit**

```bash
git add src/entities/settings/api/settingsApi.ts
git commit -m "feat: settings API mutation accepts partial UpdateSettingsDto with telegram fields"
```

---

## Task 5: Lesson Notes Step (Post-COMPLETED UI)

**Files:**
- Create: `src/features/lessonNotes/ui/lessonNotesStep.tsx`
- Modify: `src/features/lessonStatus/ui/lessonStatusButtons.tsx`

- [ ] **Step 1: Create LessonNotesStep component**

Create `src/features/lessonNotes/ui/lessonNotesStep.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Stack, TextField, Typography, Button, Box, alpha } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useUpdateLessonMutation } from '@/entities/lesson/api/lessonApi';

interface Props {
  lessonId: number;
  onDone: () => void;
}

export function LessonNotesStep({ lessonId, onDone }: Props) {
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [updateLesson, { isLoading }] = useUpdateLessonMutation();

  const handleSave = async () => {
    await updateLesson({
      id: lessonId,
      data: { notes: notes.trim() || null, rating },
    });
    onDone();
  };

  const displayRating = hovered ?? rating ?? 0;

  return (
    <Box
      sx={{
        mt: 1,
        p: 1.5,
        borderRadius: 2,
        backgroundColor: alpha('#6366f1', 0.06),
        border: `1px solid ${alpha('#6366f1', 0.15)}`,
      }}
    >
      <Typography fontSize="0.75rem" fontWeight={600} sx={{ mb: 1, color: 'rgba(255,255,255,0.6)' }}>
        Нотатки до уроку
      </Typography>
      <TextField
        multiline
        minRows={2}
        maxRows={5}
        fullWidth
        placeholder="Що пройшли, домашнє завдання..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        size="small"
        sx={{
          mb: 1,
          '& .MuiOutlinedInput-root': { fontSize: '0.8rem' },
        }}
      />
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
        <Typography fontSize="0.72rem" sx={{ color: 'rgba(255,255,255,0.4)', mr: 0.5 }}>
          Оцінка:
        </Typography>
        {[1, 2, 3, 4, 5].map((star) => (
          <Box
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setRating(star === rating ? null : star)}
            sx={{ cursor: 'pointer', color: star <= displayRating ? '#fbbf24' : 'rgba(255,255,255,0.2)', display: 'flex' }}
          >
            {star <= displayRating ? (
              <StarIcon sx={{ fontSize: 20 }} />
            ) : (
              <StarBorderIcon sx={{ fontSize: 20 }} />
            )}
          </Box>
        ))}
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant="text"
          onClick={onDone}
          sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}
        >
          Пропустити
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleSave}
          disabled={isLoading}
          sx={{ fontSize: '0.72rem', backgroundColor: '#6366f1', '&:hover': { backgroundColor: '#4f46e5' } }}
        >
          Зберегти
        </Button>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 2: Modify LessonStatusButtons to show notes step after COMPLETED**

In `src/features/lessonStatus/ui/lessonStatusButtons.tsx`:

1. Add import at the top:
```typescript
import { LessonNotesStep } from '@/features/lessonNotes/ui/lessonNotesStep';
```

2. Add state inside `LessonStatusButtons`:
```typescript
const [showNotes, setShowNotes] = useState(false);
```

3. In the individual lesson branch (the `StatusButtons` render at the bottom), wrap the `onSelect` callback to trigger notes after COMPLETED:
```typescript
// Replace the final return for individual PLANNED lesson:
return (
  <Stack spacing={1}>
    <StatusButtons
      onSelect={async (status) => {
        await updateStatus({ id: lesson.id, status });
        if (status === LESSON_STATUSES.COMPLETED) {
          setShowNotes(true);
        }
      }}
      isLoading={isLoading}
    />
    {showNotes && (
      <LessonNotesStep lessonId={lesson.id} onDone={() => setShowNotes(false)} />
    )}
  </Stack>
);
```

4. For the already-COMPLETED chip branch, add notes step too if `showNotes` is true (edge case — not needed since notes are shown right after marking).

- [ ] **Step 3: Verify in dev server**

```bash
pnpm dev
```

Open the calendar, click a lesson, mark it as COMPLETED — the notes/rating form should appear below the status buttons.

- [ ] **Step 4: Commit**

```bash
git add src/features/lessonNotes/ui/lessonNotesStep.tsx src/features/lessonStatus/ui/lessonStatusButtons.tsx
git commit -m "feat: add post-completion notes and rating step to lesson status buttons"
```

---

## Task 6: Notes and Rating in EditLessonDialog

**Files:**
- Modify: `src/features/editLesson/ui/editLessonDialog.tsx`

- [ ] **Step 1: Add notes and rating state**

In `src/features/editLesson/ui/editLessonDialog.tsx`, add to the existing state declarations:

```typescript
const [notes, setNotes] = useState<string>('');
const [rating, setRating] = useState<number | null>(null);
const [hoverRating, setHoverRating] = useState<number | null>(null);
```

- [ ] **Step 2: Populate state from lesson prop**

In the existing `useEffect` that populates form state from the `lesson` prop, add:

```typescript
setNotes(lesson.notes ?? '');
setRating(lesson.rating ?? null);
```

- [ ] **Step 3: Include notes/rating in the update call**

In the `handleSave` function (or however the form submits), add `notes` and `rating` to the `updateLesson` call's data:

```typescript
await updateLesson({
  id: lesson.id,
  data: {
    // existing fields...
    notes: notes.trim() || null,
    rating,
  },
});
```

- [ ] **Step 4: Add UI for notes and rating (only when lesson is COMPLETED)**

After the status select/toggle group in the dialog, add a conditional section:

```typescript
{status === 'COMPLETED' && (
  <>
    <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />
    <TextField
      label="Нотатки"
      multiline
      minRows={2}
      maxRows={5}
      fullWidth
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
      placeholder="Що пройшли, домашнє завдання..."
      size="small"
    />
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Typography fontSize="0.8rem" sx={{ color: 'rgba(255,255,255,0.5)', mr: 0.5 }}>
        Оцінка:
      </Typography>
      {[1, 2, 3, 4, 5].map((star) => (
        <Box
          key={star}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(null)}
          onClick={() => setRating(star === rating ? null : star)}
          sx={{
            cursor: 'pointer',
            color: star <= (hoverRating ?? rating ?? 0) ? '#fbbf24' : 'rgba(255,255,255,0.2)',
            display: 'flex',
          }}
        >
          {star <= (hoverRating ?? rating ?? 0) ? (
            <StarIcon sx={{ fontSize: 22 }} />
          ) : (
            <StarBorderIcon sx={{ fontSize: 22 }} />
          )}
        </Box>
      ))}
    </Stack>
  </>
)}
```

Add imports at the top:
```typescript
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
```

- [ ] **Step 5: Commit**

```bash
git add src/features/editLesson/ui/editLessonDialog.tsx
git commit -m "feat: add notes and rating fields to edit lesson dialog for completed lessons"
```

---

## Task 7: Notes Column in Report Table

**Files:**
- Modify: `src/widgets/reportTable/ui/reportTable.tsx`

- [ ] **Step 1: Add notes/rating display in LessonDetailsTable**

In `src/widgets/reportTable/ui/reportTable.tsx`, find `LessonDetailsTable` and its table rows for each lesson. After the status chip cell, add a notes cell:

```typescript
// Add to table head row (after status cell):
<TableCell sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', py: 0.75 }}>
  Нотатки
</TableCell>

// Add to each lesson data row (after status chip cell):
<TableCell sx={{ py: 0.75 }}>
  {lesson.rating !== null && (
    <Stack direction="row" spacing={0.25} sx={{ mb: lesson.notes ? 0.5 : 0 }}>
      {[1,2,3,4,5].map((s) => (
        <StarIcon
          key={s}
          sx={{ fontSize: 12, color: s <= (lesson.rating ?? 0) ? '#fbbf24' : 'rgba(255,255,255,0.1)' }}
        />
      ))}
    </Stack>
  )}
  {lesson.notes && (
    <Typography
      fontSize="0.7rem"
      sx={{ color: 'rgba(255,255,255,0.45)', maxWidth: 300, whiteSpace: 'pre-wrap' }}
    >
      {lesson.notes}
    </Typography>
  )}
  {!lesson.notes && lesson.rating === null && (
    <Typography fontSize="0.7rem" sx={{ color: 'rgba(255,255,255,0.15)' }}>—</Typography>
  )}
</TableCell>
```

Add import at top of file:
```typescript
import StarIcon from '@mui/icons-material/Star';
```

- [ ] **Step 2: Commit**

```bash
git add src/widgets/reportTable/ui/reportTable.tsx
git commit -m "feat: show lesson notes and rating in report table expanded rows"
```

---

## Task 8: Analytics API

**Files:**
- Create: `src/app/api/analytics/route.ts`

- [ ] **Step 1: Create the analytics aggregation endpoint**

Create `src/app/api/analytics/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const monthsBack = parseInt(searchParams.get('months') ?? '6', 10);

  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);
  const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // All completed/missed lessons in range (chargeable)
  const lessons = await prisma.lesson.findMany({
    where: {
      startTime: { gte: fromDate, lte: toDate },
      status: { in: ['COMPLETED', 'MISSED'] },
    },
    include: {
      students: { include: { student: true } },
    },
  });

  // Income by month: { month: 'YYYY-MM', income: number }[]
  const incomeByMonth: Record<string, number> = {};
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    incomeByMonth[key] = 0;
  }
  for (const lesson of lessons) {
    const key = `${lesson.startTime.getFullYear()}-${String(lesson.startTime.getMonth() + 1).padStart(2, '0')}`;
    if (key in incomeByMonth) {
      const paid = lesson.students.reduce((sum, ls) => sum + (ls.paid ? (ls.price || lesson.pricePerStudent) : 0), 0);
      incomeByMonth[key] += paid;
    }
  }

  // Lesson count by month
  const lessonCountByMonth: Record<string, number> = {};
  for (const key of Object.keys(incomeByMonth)) lessonCountByMonth[key] = 0;
  for (const lesson of lessons) {
    const key = `${lesson.startTime.getFullYear()}-${String(lesson.startTime.getMonth() + 1).padStart(2, '0')}`;
    if (key in lessonCountByMonth) lessonCountByMonth[key]++;
  }

  // Student debts: who owes money (all time, not just range)
  const allStudents = await prisma.student.findMany({
    include: {
      lessons: {
        where: {
          lesson: { status: { in: ['COMPLETED', 'MISSED'] } },
          paid: false,
        },
        include: { lesson: true },
      },
    },
  });
  const debts = allStudents
    .map((s) => ({
      studentId: s.id,
      studentName: s.name,
      unpaidLessons: s.lessons.length,
      totalDebt: s.lessons.reduce((sum, ls) => sum + (ls.price || ls.lesson.pricePerStudent), 0),
    }))
    .filter((d) => d.totalDebt > 0)
    .sort((a, b) => b.totalDebt - a.totalDebt);

  // Missed lessons this month per student
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const missedThisMonth = await prisma.lessonStudent.findMany({
    where: {
      lesson: { startTime: { gte: thisMonthStart }, status: 'MISSED' },
    },
    include: { student: true },
  });
  const missedByStudent: Record<number, { studentId: number; studentName: string; count: number }> = {};
  for (const ls of missedThisMonth) {
    if (!missedByStudent[ls.studentId]) {
      missedByStudent[ls.studentId] = { studentId: ls.studentId, studentName: ls.student.name, count: 0 };
    }
    missedByStudent[ls.studentId].count++;
  }

  // Summary cards
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const incomeThisMonth = incomeByMonth[thisMonthKey] ?? 0;
  const lessonsThisMonth = lessonCountByMonth[thisMonthKey] ?? 0;
  const totalDebt = debts.reduce((sum, d) => sum + d.totalDebt, 0);

  return NextResponse.json({
    summary: { incomeThisMonth, lessonsThisMonth, totalDebt },
    incomeByMonth: Object.entries(incomeByMonth)
      .map(([month, income]) => ({ month, income }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    lessonCountByMonth: Object.entries(lessonCountByMonth)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    debts,
    missedThisMonth: Object.values(missedByStudent).sort((a, b) => b.count - a.count),
  });
}
```

- [ ] **Step 2: Test the endpoint**

```bash
curl -s http://localhost:3000/api/analytics | jq '.summary'
# Expected: { incomeThisMonth: <number>, lessonsThisMonth: <number>, totalDebt: <number> }
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/analytics/route.ts
git commit -m "feat: add /api/analytics endpoint with income, debts, and missed lessons aggregation"
```

---

## Task 9: Analytics Dashboard Widget and Page

**Files:**
- Create: `src/widgets/analyticsBoard/ui/analyticsBoard.tsx`
- Create: `src/app/analytics/page.tsx`

- [ ] **Step 1: Install recharts**

```bash
pnpm add recharts
```

Expected: recharts added to package.json and pnpm-lock.yaml.

- [ ] **Step 2: Create AnalyticsBoard widget**

Create `src/widgets/analyticsBoard/ui/analyticsBoard.tsx`:

```typescript
'use client';

import { useState } from 'react';
import {
  Box, Grid, Paper, Typography, Stack, alpha, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem,
  FormControl, InputLabel,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useGetStudentsQuery } from '@/entities/student/api/studentApi';

interface AnalyticsData {
  summary: { incomeThisMonth: number; lessonsThisMonth: number; totalDebt: number };
  incomeByMonth: { month: string; income: number }[];
  lessonCountByMonth: { month: string; count: number }[];
  debts: { studentId: number; studentName: string; unpaidLessons: number; totalDebt: number }[];
  missedThisMonth: { studentId: number; studentName: string; count: number }[];
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 3,
        backgroundColor: alpha('#fff', 0.03),
        border: `1px solid ${alpha('#fff', 0.06)}`,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box sx={{ color: '#818cf8', display: 'flex' }}>{icon}</Box>
      <Box>
        <Typography fontSize="0.72rem" sx={{ color: 'rgba(255,255,255,0.4)' }}>{label}</Typography>
        <Typography fontSize="1.4rem" fontWeight={700}>{value}</Typography>
      </Box>
    </Paper>
  );
}

function formatMonth(ym: string) {
  const [y, m] = ym.split('-');
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleString('uk-UA', { month: 'short', year: '2-digit' });
}

export function AnalyticsBoard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: students = [] } = useGetStudentsQuery();

  // Fetch analytics on mount
  useState(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  if (!data) return null;

  const incomeChartData = data.incomeByMonth.map((d) => ({ ...d, month: formatMonth(d.month) }));
  const lessonChartData = data.lessonCountByMonth.map((d) => ({ ...d, month: formatMonth(d.month) }));

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Аналітика
      </Typography>

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <SummaryCard
            icon={<TrendingUpIcon />}
            label="Дохід цього місяця"
            value={`${data.summary.incomeThisMonth} грн`}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard
            icon={<SchoolIcon />}
            label="Уроків цього місяця"
            value={String(data.summary.lessonsThisMonth)}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard
            icon={<AccountBalanceWalletIcon />}
            label="Загальний борг"
            value={`${data.summary.totalDebt} грн`}
          />
        </Grid>
      </Grid>

      {/* Income chart */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, backgroundColor: alpha('#fff', 0.02), border: `1px solid ${alpha('#fff', 0.06)}` }}>
        <Typography fontWeight={600} sx={{ mb: 2 }}>Дохід по місяцях (грн)</Typography>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={incomeChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="income" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Lesson count chart */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, backgroundColor: alpha('#fff', 0.02), border: `1px solid ${alpha('#fff', 0.06)}` }}>
        <Typography fontWeight={600} sx={{ mb: 2 }}>Кількість уроків по місяцях</Typography>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={lessonChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Debts table */}
      {data.debts.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, backgroundColor: alpha('#fff', 0.02), border: `1px solid ${alpha('#fff', 0.06)}` }}>
          <Typography fontWeight={600} sx={{ mb: 2 }}>Борги учнів</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Учень</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Неоплачених уроків</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Борг</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.debts.map((d) => (
                <TableRow key={d.studentId}>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{d.studentName}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{d.unpaidLessons}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 600 }}>
                    {d.totalDebt} грн
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Missed this month */}
      {data.missedThisMonth.length > 0 && (
        <Paper sx={{ p: 3, borderRadius: 3, backgroundColor: alpha('#fff', 0.02), border: `1px solid ${alpha('#fff', 0.06)}` }}>
          <Typography fontWeight={600} sx={{ mb: 2 }}>Пропуски цього місяця</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Учень</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Пропусків</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.missedThisMonth.map((m) => (
                <TableRow key={m.studentId}>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{m.studentName}</TableCell>
                  <TableCell sx={{ fontSize: '0.85rem', color: '#f87171', fontWeight: 600 }}>{m.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
```

- [ ] **Step 3: Create analytics page**

Create `src/app/analytics/page.tsx`:

```typescript
import { AnalyticsBoard } from '@/widgets/analyticsBoard/ui/analyticsBoard';

export default function AnalyticsPage() {
  return <AnalyticsBoard />;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/widgets/analyticsBoard/ui/analyticsBoard.tsx src/app/analytics/page.tsx pnpm-lock.yaml package.json
git commit -m "feat: add analytics dashboard with income, lesson count, debts, and missed lessons charts"
```

---

## Task 10: Sidebar Update and Settings Page

**Files:**
- Modify: `src/widgets/sidebar/ui/sidebar.tsx`
- Create: `src/app/settings/page.tsx`
- Create: `src/widgets/settingsForm/ui/settingsForm.tsx`

- [ ] **Step 1: Add Analytics and Settings to sidebar nav items**

In `src/widgets/sidebar/ui/sidebar.tsx`, update the `navItems` array:

```typescript
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';

const navItems = [
  { label: 'Календар', href: '/', icon: <CalendarMonthIcon /> },
  { label: 'Учні', href: '/students', icon: <PeopleIcon /> },
  { label: 'Звіти', href: '/reports', icon: <AssessmentIcon /> },
  { label: 'Аналітика', href: '/analytics', icon: <BarChartIcon /> },
  { label: 'Налаштування', href: '/settings', icon: <SettingsIcon /> },
];
```

- [ ] **Step 2: Create SettingsForm widget**

Create `src/widgets/settingsForm/ui/settingsForm.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Stack, alpha, CircularProgress, Divider,
} from '@mui/material';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/entities/settings/api/settingsApi';

export function SettingsForm() {
  const { data: settings, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [individualPrice, setIndividualPrice] = useState('');
  const [groupPrice, setGroupPrice] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

  useEffect(() => {
    if (!settings) return;
    setIndividualPrice(String(settings.defaultIndividualPrice));
    setGroupPrice(String(settings.defaultGroupPrice));
    setTelegramChatId(settings.telegramChatId ?? '');
  }, [settings]);

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={32} sx={{ color: '#6366f1' }} /></Box>;
  }

  const handleSave = async () => {
    await updateSettings({
      defaultIndividualPrice: Number(individualPrice),
      defaultGroupPrice: Number(groupPrice),
      telegramChatId: telegramChatId.trim() || null,
    });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 500 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Налаштування</Typography>

      <Paper sx={{ p: 3, borderRadius: 3, backgroundColor: alpha('#fff', 0.02), border: `1px solid ${alpha('#fff', 0.06)}` }}>
        <Typography fontWeight={600} sx={{ mb: 2 }}>Ціни за замовчуванням</Typography>
        <Stack spacing={2}>
          <TextField
            label="Індивідуальний урок (грн)"
            type="number"
            value={individualPrice}
            onChange={(e) => setIndividualPrice(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Груповий урок (грн)"
            type="number"
            value={groupPrice}
            onChange={(e) => setGroupPrice(e.target.value)}
            size="small"
            fullWidth
          />
        </Stack>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.06)' }} />

        <Typography fontWeight={600} sx={{ mb: 1 }}>Telegram</Typography>
        <Typography fontSize="0.78rem" sx={{ color: 'rgba(255,255,255,0.4)', mb: 2 }}>
          Введіть ваш Telegram Chat ID для отримання нагадувань. Дізнатись ID можна через бота @userinfobot.
        </Typography>
        <TextField
          label="Telegram Chat ID"
          value={telegramChatId}
          onChange={(e) => setTelegramChatId(e.target.value)}
          size="small"
          fullWidth
          placeholder="напр. 123456789"
        />

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving}
          sx={{ mt: 3, backgroundColor: '#6366f1', '&:hover': { backgroundColor: '#4f46e5' } }}
        >
          {isSaving ? 'Зберігаємо...' : 'Зберегти'}
        </Button>
      </Paper>
    </Box>
  );
}
```

- [ ] **Step 3: Create settings page**

Create `src/app/settings/page.tsx`:

```typescript
import { SettingsForm } from '@/widgets/settingsForm/ui/settingsForm';

export default function SettingsPage() {
  return <SettingsForm />;
}
```

- [ ] **Step 4: Verify navigation**

```bash
pnpm dev
```

Open the app — sidebar should show Аналітика and Налаштування links. Both pages should render without errors.

- [ ] **Step 5: Commit**

```bash
git add src/widgets/sidebar/ui/sidebar.tsx src/widgets/settingsForm/ui/settingsForm.tsx src/app/settings/page.tsx
git commit -m "feat: add Analytics and Settings nav items to sidebar, create settings page with Telegram Chat ID field"
```

---

## Task 11: Telegram Helper Library and Vercel Cron Config

**Files:**
- Create: `src/shared/lib/telegram.ts`
- Create: `vercel.json`

- [ ] **Step 1: Create the Telegram API helper**

Create `src/shared/lib/telegram.ts`:

```typescript
const BASE = 'https://api.telegram.org';

function token() {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  return t;
}

export async function sendMessage(chatId: string, text: string, replyMarkup?: object) {
  const res = await fetch(`${BASE}/bot${token()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...(replyMarkup && { reply_markup: replyMarkup }),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[telegram] sendMessage error:', err);
  }
}

export async function editMessageReplyMarkup(chatId: string, messageId: number, replyMarkup: object) {
  await fetch(`${BASE}/bot${token()}/editMessageReplyMarkup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: replyMarkup }),
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`${BASE}/bot${token()}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, ...(text && { text }) }),
  });
}

export async function setWebhook(webhookUrl: string) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? '';
  const res = await fetch(`${BASE}/bot${token()}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl, secret_token: secret }),
  });
  return res.json();
}

export function verifyWebhookSecret(req: Request): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true; // skip in dev
  const header = req.headers.get('x-telegram-bot-api-secret-token');
  return header === secret;
}
```

- [ ] **Step 2: Add env variables to .env.local**

Add to `.env.local` (do NOT commit this file):

```
TELEGRAM_BOT_TOKEN=<token from BotFather>
TELEGRAM_WEBHOOK_SECRET=<random string, e.g. output of: openssl rand -hex 32>
```

- [ ] **Step 3: Create vercel.json**

Create `vercel.json` at project root:

```json
{
  "crons": [
    {
      "path": "/api/telegram/cron",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add src/shared/lib/telegram.ts vercel.json
git commit -m "feat: add Telegram API helper and Vercel cron config"
```

---

## Task 12: Telegram Cron Route

**Files:**
- Create: `src/app/api/telegram/cron/route.ts`

- [ ] **Step 1: Create the cron handler**

Create `src/app/api/telegram/cron/route.ts`:

```typescript
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
  // Vercel calls cron via GET; protect with a simple header in production
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getSettings();
  if (!settings?.telegramChatId) {
    return NextResponse.json({ skipped: 'no telegramChatId configured' });
  }

  const chatId = settings.telegramChatId;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Auto-register webhook once (check if already set by trying to register)
  if (appUrl) {
    const webhookUrl = `${appUrl}/api/telegram/webhook`;
    await setWebhook(webhookUrl);
  }

  const now = new Date();
  const reminderWindowStart = new Date(now.getTime() + 25 * 60 * 1000); // 25 min from now
  const reminderWindowEnd = new Date(now.getTime() + 40 * 60 * 1000);   // 40 min from now
  const statusWindowStart = new Date(now.getTime() - 25 * 60 * 1000);   // ended up to 25 min ago
  const statusWindowEnd = new Date(now.getTime() - 5 * 60 * 1000);      // ended at least 5 min ago

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
```

- [ ] **Step 2: Add CRON_SECRET and NEXT_PUBLIC_APP_URL to .env.local**

```
CRON_SECRET=<same random string as TELEGRAM_WEBHOOK_SECRET or a new one>
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

- [ ] **Step 3: Test manually**

```bash
curl -s http://localhost:3000/api/telegram/cron
# Expected: { "reminders": 0, "statusPrompts": 0 } (or counts if lessons exist in the windows)
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/telegram/cron/route.ts
git commit -m "feat: add Telegram cron handler for lesson reminders and status prompts"
```

---

## Task 13: Telegram Webhook Route

**Files:**
- Create: `src/app/api/telegram/webhook/route.ts`

- [ ] **Step 1: Create the webhook handler**

Create `src/app/api/telegram/webhook/route.ts`:

```typescript
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

      await prisma.lesson.update({ where: { id: lessonId }, data: { status } });

      // Also update all LessonStudents to the same status
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
          const start = l.startTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' });
          const end = l.endTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' });
          return `🕐 ${start}–${end} · ${names} · ${getLessonSubjectLabel(l.subject)}`;
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

    // Conversation flow: notes and rating
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
```

- [ ] **Step 2: Register the webhook**

After deploying to Vercel (or using ngrok locally for testing), register the webhook by calling the cron once:

```bash
curl https://your-app.vercel.app/api/telegram/cron \
  -H 'Authorization: Bearer <CRON_SECRET>'
```

Or register manually:
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://your-app.vercel.app/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

- [ ] **Step 3: Test the bot**

1. Send `/today` to your bot — should list today's lessons
2. Send `/debts` — should list student debts
3. Mark a lesson via the Telegram status prompt → tap ✅ → bot should ask for notes → send a note → bot asks for rating → send 4 → bot replies "✓ Збережено!"
4. Verify in the web app that the lesson now has notes and rating.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/telegram/webhook/route.ts
git commit -m "feat: add Telegram webhook handler for status updates, notes flow, /today and /debts commands"
```

---

## Self-Review Checklist

After writing this plan, checked against the spec:

| Spec requirement | Covered in |
|---|---|
| `notes`, `rating` on Lesson DB | Task 1 |
| `telegramChatId`, `reminderSentAt` on DB | Task 1 |
| TypeScript types updated | Task 2 |
| Lesson PATCH accepts notes/rating | Task 3 |
| Settings API accepts telegramChatId | Task 3 |
| Post-COMPLETED notes UI | Task 5 |
| Notes in EditLessonDialog | Task 6 |
| Notes column in Reports | Task 7 |
| `/api/analytics` with income, debts, missed, counts | Task 8 |
| Analytics page `/analytics` with recharts | Task 9 |
| Sidebar Analytics + Settings links | Task 10 |
| Settings page with Telegram Chat ID field | Task 10 |
| `shared/lib/telegram.ts` helper | Task 11 |
| `vercel.json` cron schedule | Task 11 |
| Cron: 30-min reminder, idempotent via `reminderSentAt` | Task 12 |
| Cron: post-lesson status prompt | Task 12 |
| Webhook: inline status buttons → DB update | Task 13 |
| Webhook: notes + rating conversation flow | Task 13 |
| Webhook: `/today` command | Task 13 |
| Webhook: `/debts` command | Task 13 |

All spec requirements covered. No TBDs or placeholders.
