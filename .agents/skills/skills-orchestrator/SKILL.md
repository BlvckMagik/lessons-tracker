---
name: skills-orchestrator
description: Orchestrates project skills: inventories available skills and applies Vercel React best practices. Use when the user asks to list skills in the project, to find/install a skill, or to review/refactor React/Next.js components for performance and re-render optimizations.
---

# Skills Orchestrator

## Коли використовувати

- Користувач просить: "дай перелік скілів", "які є скіли в проекті", "що вміє агент".
- Користувач просить: "знайди скіл", "чи є скіл для X", "встанови скіл".
- Користувач просить: "перевір/відрефактори React компонент", "оптимізуй ререндери", "застосуй vercel-react-best-practices".

## Інвентаризація скілів проєкту (перелік)

1. Знайди всі `SKILL.md` у `/.agents/skills/**/SKILL.md`.
2. Для кожного скіла виведи:
   - назву (з frontmatter `name`, якщо є; інакше — назва папки)
   - короткий опис (frontmatter `description`, якщо є)
   - шлях до `SKILL.md`
3. Якщо користувач просить “тільки перелік” — дай лише список без зайвих пояснень.

## Пошук / інсталяція скілів (делегування на `find-skills`)

Якщо запит про “знайти скіл для X” або “встановити скіл”:

1. Відкрий і застосуй інструкції зі скіла `find-skills`:
   - `/.agents/skills/find-skills/SKILL.md`
2. Дотримуйся його рекомендацій щодо якості (інстали, репутація джерела, перевірка).
3. Якщо потрібна інсталяція — використовуй `npx skills ...` (без надмірної автоматизації; виконувати тільки на явний запит користувача).

## Рев’ю / рефактор React (делегування на `vercel-react-best-practices`)

Якщо користувач просить переглянути файл або компонент:

1. Прочитай файл(и), які користувач назвав, і виділи “гарячі точки”:
   - великі компоненти з міксом логіки/стилів/рендеру
   - дорогі derived обчислення в рендері
   - повторні `.find()` / O(n) lookup
   - об’єкти/функції, які створюються на кожен рендер і передаються вниз
   - ефекти з широкими залежностями
2. Відкрий `/.agents/skills/vercel-react-best-practices/AGENTS.md` і застосуй релевантні правила:
   - Re-render Optimization: derived state, dependencies, extract memoized components
   - JavaScript Performance: index maps, combine iterations
   - Bundle Optimization: barrel imports / dynamic imports (якщо доречно)
3. Видай рекомендації у форматі:
   - 🔴 критично (впливає на баги/ремоунти/великі зайві ререндери)
   - 🟡 помітне покращення (читабельність/продуктивність)
   - 🟢 косметичне (локальна чистка)
4. Кожну пораду прив’язуй до конкретних рядків/фрагментів коду (цитатою) і пояснюй “чому” коротко.

## Важливо для цього репозиторію

- Мова UI: українська.
- Не додавати коментарі в коді.
- Узгоджувати імпорти з Feature-Sliced Design (shared/entities/features/widgets/app).
