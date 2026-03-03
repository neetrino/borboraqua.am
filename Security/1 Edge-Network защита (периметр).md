# 1. Edge / Network защита (периметр)

> [!info] Условные обозначения
> **🤖 В коде** — задаёшь AI: что реализовать в репозитории.  
> **👤 Вручную** — заходишь в панель и настраиваешь сам.

> **[x] 🤖 1.5** — реализовано в `apps/web/next.config.js` (headers).  
> **[x] 🤖 1.4** — реализовано в `apps/web/middleware.ts` + `lib/rate-limit.ts`.  
> **[ ] 👤 1.1, 1.2, 1.3** — вручную в Cloudflare/Vercel (см. ниже).

---

## 🤖 1.5 Security headers (X-Content-Type-Options, X-Frame-Options, CSP)

**Что сделать в коде (AI):**
- В Next.js: в `next.config.js` (или `next.config.mjs`) добавить секцию `headers()` и вернуть:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` или `SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` — минимум `default-src 'self'`, без `'unsafe-inline'`/`'unsafe-eval'` где возможно.
- На Vercel эти заголовки можно задать там же в `next.config` или в Vercel Project → Settings → Headers (тогда 👤).

**Реализовано:** `apps/web/next.config.js` — `securityHeaders` + `async headers()`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy` (default-src 'self', script/style/img/font/connect, frame-ancestors 'self').

**Проверка:** `curl -I https://your-domain.com` — в ответе есть перечисленные заголовки.

---

## 🤖 / 👤 1.4 Rate limiting

**Вариант А — в коде (🤖, если нет Cloudflare):**
- В Next.js: middleware или отдельный route handler, который считает запросы по IP (или по ключу) и возвращает `429` после порога (например 50 req/min на `/api/auth/*`, 100 на остальные).
- Можно использовать Upstash Redis для счётчика (rate limit by IP).

**Вариант Б — вручную (👤):**
- **Cloudflare:** Зайти в **Security → WAF → Rate limiting rules** (или **Rules → Rate rules**). Создать правило: путь `/api/auth/*` и/или `/api/*`, порог запросов в минуту, действие — Block. Аналогично для форм (contact, webhook receiver).
- **Vercel:** через Edge Config или свой middleware в коде (см. Вариант А).

**Реализовано (Вариант А):** `apps/web/middleware.ts` — matcher `/api/:path*`; `lib/rate-limit.ts` — in-memory по IP. Лимиты: `/api/v1/auth/*` 50/мин, `/api/v1/contact` 20/мин, остальные `/api/*` 100/мин. Ответ 429 + `Retry-After`.

**Проверка:** 20–50 запросов за минуту на защищённый путь → ответ `429 Too Many Requests`.

---

## 👤 1.1 HTTPS only + HSTS

**Куда зайти → что сделать:**
- **Cloudflare:** **SSL/TLS → Edge Certificates.** Включить **Always Use HTTPS**. В **HTTP Strict Transport Security (HSTS)** включить и задать max-age (например 31536000).
- **Vercel:** HTTPS по умолчанию. Проверить в **Project → Settings → Domains**, что домен привязан и используется HTTPS.

**Проверка:** `curl -I http://your-domain.com` — редирект на `https`. В ответе `https://` есть заголовок `Strict-Transport-Security`.

---

## 👤 1.2 WAF managed rules

**Куда зайти → что сделать:**
- **Cloudflare:** **Security → WAF.** Включить **Managed rules** (например OWASP Core Ruleset или встроенный Managed Ruleset). Оставить включёнными базовые правила, отключить только если что-то ломается и ты понимаешь зачем.

**Проверка:** В **Security → Events** видны события (в т.ч. блокировки). На prod домене WAF в статусе ON.

---

## 👤 1.3 DDoS protection

**Куда зайти → что сделать:**
- **Cloudflare:** **Security → DDoS.** Убедиться, что защита от DDoS включена (часто включена по умолчанию на планах Pro и выше). При атаке можно временно включить **Under Attack Mode** в **Security → Settings**.

**Проверка:** В панели статус защиты включён, в логах при необходимости видны срабатывания.
