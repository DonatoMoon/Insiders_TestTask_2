# To-Do App — Discovery Log (brainstorming Q&A)

Дата: 2026-08-12
Джерело: сесія `superpowers:brainstorming` (без GSD) по `ТЗ.txt`
Призначення: сирий лог питань/відповідей, з яких зібрано `2026-08-12-todo-app-design.md`. Зберігається окремо як trace рішень — навіщо саме такий вибір, а не інший.

## 1. Ролі та власник списку

**Q:** У ТЗ є ролі Admin і Viewer для співучасників списку. А який статус має сам творець списку (owner)? Хто типово стане Admin?
**A:** Окрема роль Owner + Admin/Viewer (не "creator = Admin автоматично", і не мінімалізм "лише creator бачить список").

**Q:** Owner/Admin/Viewer обрано. Хто може додавати нових співучасників (за email) до списку?
**A:** Тільки Owner (не Owner+Admin).

**Q:** Що відбувається, якщо Owner додає email людини, яка ще не зареєстрована в системі?
**A:** Помилка "користувача не знайдено" (не pending-запрошення).

## 2. Часові рамки та деліверабли

**Q:** Це тестове завдання часом обмежене (як інший проєкт цього ж клієнта — 8 годин, звіт по етапах, Loom-запис)? Це впливає на глибину архітектури і обсяг polish.
**A:** Ні, часових обмежень немає.

**Q:** Які деліверабли очікуються на виході?
**A:** + деплой на хостинг (Vercel), окрім самого репозиторію.

## 3. Firebase

**Q:** Firebase-проєкт вже є створений (є API-ключі/config для Auth+Firestore)?
**A:** Ні, створимо разом у процесі розробки.

## 4. Синхронізація даних і state

**Q:** Як синхронізувати дані з Firestore (списки/завдання)? Це визначає архітектуру state layer.
**A:** Realtime `onSnapshot` лістенери (не React Query + ручний refetch).

**Q:** Глобальний client state (авторизований користувач, UI-стани) — яким інструментом?
**A:** Zustand для global state (лише auth/UI, не серверні дані).

## 5. Форми та структура екранів

**Q:** Форми (реєстрація/логін, список/завдання, додавання співучасника) — яким інструментом валідувати?
**A:** react-hook-form + zod.

**Q:** Структура екранів: користувач бачить свої списки (власні + ті, де він Admin/Viewer). Як це показати?
**A:** Dashboard зі списком списків → окрема сторінка конкретного списку (не single-page sidebar-layout).

## 6. Тести

**Q:** Тести (unit/e2e) — чи потрібні в цьому проєкті? ТЗ їх не вимагає, але впливає на архітектуру (тестовані hooks/utils).
**A:** Без тестів, фокус на фічі (свідоме рішення, не default).

## 7. Візуальний напрям

**Q:** Який візуальний настрій/характер хочете для цього To-Do додатку? (не стандартний фіолетовий/градієнтний SaaS-вигляд, а щось впізнаване)
**A:** Теплий/лагідний, з характером.

**Q:** Світла чи темна базова тема для "теплого/лагідного з характером"?
**A:** Світла, ближче до білого (не глибокий крем/paper-тон).

**Q:** (пізніше, окремим фідбеком після прев'ю v1) Мова інтерфейсу?
**A:** Виключно англійська — знято обмеження на кирилицю у виборі шрифтів, але вже обраний Unbounded+Golos Text+Caveat лишився (працює і в латиниці, уникає кліше "крем+serif+теракота").

## 8. Ухвалена архітектура даних (підсумок з розмови)

Модель Firestore — **map-based members**, обрана над альтернативою (окрема колекція `memberships`):

```
users/{uid}                    — { email, name, createdAt }
lists/{listId}                 — { title, ownerId, members: { [uid]: 'owner'|'admin'|'viewer' }, createdAt }
lists/{listId}/tasks/{taskId}  — { title, description, completed, createdAt, updatedAt }
```

- Email-lookup через публічну колекцію `users` (клієнт не має доступу до Admin SDK для пошуку чужого uid за email).
- "Мої списки" — `where('members.' + myUid, '!=', null)` (dot-path запит, без окремого індексу).
- Задачі — subcollection, не масив у документі списку (точкові realtime-updates, без ліміту розміру документа).
- Альтернатива `memberships` collection відхилена як over-engineering для обсягу задачі.

Токени авторизації — нативна персистентність Firebase Auth SDK (`browserLocalPersistence`), без ручного localStorage-менеджменту.

Права доступу — Firestore Security Rules як source of truth, не лише UI:
- `lists`: read/write — member; edit title / delete / member-management — лише owner.
- `tasks`: read — будь-який member; create/update/delete — owner+admin; viewer — лише point-update поля `completed` (`affectedKeys().hasOnly(['completed'])`).

### Матриця прав

| Дія | Owner | Admin | Viewer |
|---|---|---|---|
| Редагувати назву / видалити список | ✅ | ❌ | ❌ |
| Додати / прибрати співучасника | ✅ | ❌ | ❌ |
| CRUD завдання (назва/опис) | ✅ | ✅ | ❌ |
| Toggle completed | ✅ | ✅ | ✅ |

Owner також може прибирати учасника зі списку — логічне продовження права "додає" з ТЗ, не було явною вимогою, узгоджено з користувачем як припущення.

### Структура проєкту (App Router)

```
src/app/(auth)/login|register/page.tsx
src/app/(app)/layout.tsx              — auth-guard (onAuthStateChanged + redirect)
src/app/(app)/lists/page.tsx          — dashboard
src/app/(app)/lists/[listId]/page.tsx — задачі конкретного списку
src/components/{auth,lists,tasks,ui}/
src/hooks/ useAuth, useLists, useListDetail, useTasks
src/lib/firebase/  lib/firestore/  lib/validation/(zod)  lib/types/
src/store/authStore.ts (Zustand)
```

## 9. Статус на кінець сесії

Design-doc (`2026-08-12-todo-app-design.md`) і дизайн-прев'ю v2 (Artifact) затверджено користувачем ("норм. зберігай поки цей варіант"). Наступний крок за процесом — `superpowers:writing-plans` для implementation-плану, коли користувач буде готовий рухатись далі.
