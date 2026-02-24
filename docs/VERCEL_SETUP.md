# Настройки для Vercel (borboraqua.am)

**Один проект:** фронт и бэкенд — Next.js (App Router + API Routes). Деплой только на **Vercel**, свой сервер не используем.

Monorepo (Turborepo): в репозитории есть `apps/web` и пакеты (`packages/db`, `packages/ui` и т.д.), но на Vercel собирается и крутится только **apps/web**.

---

## 1. Что уже в репозитории

### vercel.json (в корне)

| Параметр | Значение | Назначение |
|----------|----------|------------|
| `framework` | nextjs | Пресет Next.js |
| `buildCommand` | npm run build | Сборка из корня (turbo собирает apps/web) |
| `outputDirectory` | apps/web/.next | Путь к .next при сборке из корня |
| `installCommand` | npm install | Установка из корня (workspaces) |
| `devCommand` | npm run dev | Для локального dev |
| `env.NODE_ENV` | production | На продакшене |
| `functions` | maxDuration: 30 | Для двух «тяжёлых» API (products, upload-images) |
| `rewrites` | /api/:path* → /api/:path* | Оставляет API-маршруты у приложения |

### Next.js (apps/web)

- **next.config.js:** `output: 'standalone'` — для деплоя на Vercel подходит.
- **Build:** перед `next build` запускается `check-db-and-migrate.js` (миграции, если есть `DATABASE_URL`).

---

## 2. Настройки в Vercel Dashboard

### Root Directory

- Оставь **Root Directory** пустым (корень репозитория **`.`**), чтобы работали `installCommand` и `buildCommand` из корня и путь `apps/web/.next` был верным.

### Environment Variables (Production / Preview)

Задай в **Project → Settings → Environment Variables** (значения не коммитить):

| Переменная | Обязательно | Описание |
|------------|-------------|----------|
| `DATABASE_URL` | да | PostgreSQL (Neon) — connection string |
| `DIRECT_URL` | по желанию | Прямой URL для миграций (Neon) |
| `JWT_SECRET` | да | Секрет для JWT |
| `JWT_EXPIRES_IN` | нет | Например `7d` |
| `APP_URL` | да | URL сайта, например `https://borboraqua.am` |
| `NEXT_PUBLIC_API_URL` | по желанию | Публичный URL API (если нужен с клиента) |
| `NODE_ENV` | нет | Vercel ставит `production` сам |

Остальные переменные — по необходимости (Redis, файловое хранилище и т.д.).

---

## 3. Что не относится к Vercel

- **scripts/archive/server-setup.sh** — скрипт для деплоя на **свой** Linux-сервер (VPS, /var/www). У нас деплой только на Vercel, скрипт в архиве, не используется.
- **.env** — только локально; на Vercel переменные задаются в Dashboard.

---

## 4. Чеклист перед первым деплоем

1. В Vercel: Root Directory = **.** (корень).
2. Добавлены все нужные Environment Variables (как минимум `DATABASE_URL`, `JWT_SECRET`, `APP_URL`).
3. В Neon (или другой БД) выполнены миграции (на первом деплое они могут запуститься при сборке, если задан `DATABASE_URL`).
4. Домен (если свой) привязан в Vercel → Settings → Domains.

Подробнее по платформе: **reference/platforms/01-VERCEL.md**.
