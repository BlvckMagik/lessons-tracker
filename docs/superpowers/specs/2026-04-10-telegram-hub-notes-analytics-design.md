# Design: Telegram Hub, Lesson Notes & Analytics

**Date:** 2026-04-10  
**Status:** Approved

## Overview

Three interconnected features for the lessons-tracker app used by a private tutor to manage lessons, students, and payments. Telegram bot acts as the central interaction hub, enabling quick status updates and reminders without opening the web app. Lesson notes and analytics build on top of the existing data model.

---

## 1. Architecture

```
Vercel Cron (*/15 min) → /api/telegram/cron
                               ↓
                       Telegram Bot API ← /api/telegram/webhook
                               ↕
                       Tutor (Telegram)
                               ↓
              Actions: lesson status, notes, /today, /debts
```

### New Components

| Component | Purpose |
|---|---|
| Telegram Bot | Sends reminders, receives inline button actions and text replies |
| Vercel Cron | Checks for upcoming/past lessons every 15 minutes |
| `POST /api/telegram/webhook` | Handles all incoming Telegram updates |
| `GET /api/telegram/cron` | Sends reminders and status prompts |
| `GET /api/analytics` | Aggregated data for the analytics dashboard |
| `/analytics` page | New page in sidebar |

### New Environment Variables

```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
```

### New `vercel.json`

```json
{
  "crons": [
    { "path": "/api/telegram/cron", "schedule": "*/15 * * * *" }
  ]
}
```

---

## 2. Database Changes

```prisma
model Lesson {
  // existing fields ...
  notes             String?
  rating            Int?       // 1–5, nullable
  reminderSentAt    DateTime?  // set when upcoming reminder is sent; prevents duplicates
}

model Settings {
  // existing fields ...
  telegramChatId String?
}
```

No new tables required. `TELEGRAM_BOT_TOKEN` stored in env, `telegramChatId` stored in Settings (already has a singleton row).

---

## 3. Lesson Notes

### Data
- `Lesson.notes` — free text, nullable
- `Lesson.rating` — integer 1–5, nullable

### UI: Post-lesson flow (existing `features/lessonStatus`)
After marking a lesson as COMPLETED, the confirmation dialog adds a second step:

```
Урок завершено ✅
──────────────────────────────
Нотатки (необов'язково):
[ textarea ]

Рейтинг уроку:
★ ★ ★ ★ ☆

[ Пропустити ]  [ Зберегти ]
```

### UI: Edit dialog (`features/editLesson`)
For COMPLETED lessons, notes and rating fields are shown and editable.

### UI: Reports table (`widgets/reportTable`)
- New 📝 icon column — hover shows note preview
- Expanded student row shows each lesson with notes and star rating

### Telegram flow (after tapping ✅)
```
Bot:  "Урок з Аней завершено! Додайте нотатки:"
User: "Пройшли Present Perfect, домашнє — стор. 45"
Bot:  "Оцініть урок (1–5):"
User: "4"
Bot:  "Збережено ✓"
```

If user sends "–" or /skip at any step, that field is left null.

---

## 4. Telegram Bot

### Setup (one-time)
1. Create bot via @BotFather → get `BOT_TOKEN`
2. In app Settings page — new field "Telegram Chat ID"
3. Webhook auto-registers on first cron run if not already set

### Cron Logic (`/api/telegram/cron`, runs every 15 min)

| Trigger | Action |
|---|---|
| Lesson starts in 25–35 min and no reminder sent | Send upcoming lesson reminder |
| Lesson ended 10–20 min ago and status is still PLANNED | Send status prompt with inline buttons |

`Lesson.reminderSentAt` is set when a reminder is sent. The cron skips lessons where this field is already populated, making it idempotent across multiple runs.

### Inline Button Message
```
📅 Урок з Аней через 30 хвилин (14:00–14:45)
Предмет: Англійська

[✅ Проведено] [❌ Пропущено] [🚫 Скасовано]
```

Callback data format: `status:{lessonId}:{STATUS}`

### Bot Commands
| Command | Response |
|---|---|
| `/today` | List of today's lessons with times and student names |
| `/debts` | Table of students with unpaid amounts, sorted descending |

### Webhook Handler (`/api/telegram/webhook`)

Handles three event types:
1. **Callback query** (inline button tap) — update lesson status via Prisma, then if COMPLETED start notes flow
2. **Text message** — if user is in notes flow (tracked in-memory or via a lightweight Redis/Upstash KV), save notes then ask for rating
3. **Command** (`/today`, `/debts`) — query DB and reply

Webhook verified via `TELEGRAM_WEBHOOK_SECRET` header check.

### Conversation State
Notes collection is a 2-step flow (notes text → rating). State tracked in a simple in-memory Map (sufficient for single-user bot). If Vercel cold-starts reset it, the bot gracefully asks again.

---

## 5. Analytics Dashboard (`/analytics`)

### Navigation
New entry in sidebar between Reports and Settings.

### Layout (top to bottom)

**Row 1 — Summary cards**
```
[ Дохід цього місяця ]  [ Борги загалом ]  [ Уроків цього місяця ]
      4 200 грн               800 грн              23
```

**Row 2 — Income by month**  
Bar chart, last 6 months. X: month, Y: UAH earned (sum of `pricePerStudent` for COMPLETED lessons).

**Row 3 — Student debts**  
Table: student name | unpaid lessons count | total debt (UAH). Sorted by debt descending.

**Row 4 — Per-student stats**  
Dropdown to select student. Shows:
- Lessons per month (bar chart)
- Average rating (after notes feature ships)
- COMPLETED vs MISSED ratio

**Row 5 — Missed lessons**  
Top students by missed lesson count in the current month.

### Data Source
New `GET /api/analytics` endpoint. Accepts optional `?from=` and `?to=` date params. Aggregates from existing `Lesson` and `LessonStudent` tables — no schema changes needed beyond notes/rating.

### Charts Library
`recharts` — lightweight, MIT license, React 19 compatible. No MUI X Pro license required.

---

## 6. Scope Boundaries

**In scope:**
- Lesson notes (free text + rating) in web UI and Telegram
- Telegram bot: reminders, status buttons, notes collection, `/today`, `/debts`
- Analytics dashboard with the 5 blocks above
- Settings UI: Telegram Chat ID field

**Out of scope:**
- Multiple tutors / multi-user auth
- Student-facing portal
- File/image attachments to lessons
- Push notifications (PWA) — Telegram covers this
- Homework tracking (separate feature if needed later)

---

## 7. Implementation Order

1. **DB migration** — add `notes`, `rating` to Lesson; `telegramChatId` to Settings
2. **Lesson notes UI** — post-lesson dialog step + edit dialog + reports table
3. **Analytics page** — `/analytics` route, `recharts`, `/api/analytics` endpoint
4. **Telegram bot** — bot setup, cron, webhook, inline buttons, notes flow, commands
5. **Settings UI** — Telegram Chat ID field
