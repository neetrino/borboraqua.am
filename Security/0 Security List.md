# Minimal P0 Must-have checklist
(Next.js + (Next API или NestJS) + Neon + Upstash опционально)

> [!info] Кто что делает
> **🤖 В коде** — реализует AI / разработчик в репозитории. Сначала закрывай эти пункты (отдаёшь задачу AI).  
> **👤 Вручную** — настройки в панелях (Vercel, Cloudflare, Neon, Clerk и т.д.). Делаешь ты после того, как код готов.

---

## 1. Edge / Network — [[1 Edge-Network защита (периметр)]]
*Сначала 🤖, в конце 👤*

* [x] 🤖 **1.5** Security headers: X-Content-Type-Options, X-Frame-Options, CSP baseline (Code/Vercel)
* [x] 🤖 **1.4** Rate limit auth/API/webhooks/forms в коде (если не через Cloudflare)
* [ ] 👤 **1.1** HTTPS + HSTS (Cloudflare/Vercel)
* [ ] 👤 **1.2** WAF managed rules ON (Cloudflare)
* [ ] 👤 **1.3** DDoS protection ON (Cloudflare)

---

## 2. Auth + Sessions — [[2 Auth + Sessions (самая любимая точка атаки)]]
*Сначала 🤖, в конце 👤*

* [x] 🤖 **2.2** Secure cookies + session TTL/rotation (Clerk/Auth.js)
* [x] 🤖 **2.3** CSRF protection (Code)
* [x] 🤖 **2.4** RBAC server-side (Code)
* [x] 🤖 **2.7** Logout invalidates session/token (Code/Clerk/Auth.js)
* [ ] 👤 **2.1** ADR: схема auth (Clerk/Auth.js) (Docs)
* [ ] 👤 **2.5** Admin MFA mandatory (Clerk/Policy)
* [ ] 👤 **2.6** Password policy if not OAuth-only (Docs/Policy)

---

## 3. API безопасность — [[3 API безопасность (Next API - Nest)]]
*Всё в коде 🤖*

* [x] 🤖 **3.1** Input validation (Code)
* [x] 🤖 **3.1a** XSS: sanitize user content, no unsafe HTML render (Code)
* [x] 🤖 **3.2** No stack traces in prod (Code/Vercel)
* [x] 🤖 **3.2a** No sensitive data in error responses (Code)
* [x] 🤖 **3.3** Strict CORS (Code)
* [x] 🤖 **3.4** Idempotency for critical POST (Code/Neon)
* [x] 🤖 **3.5** Webhook signature + replay protection (Code)
* [x] 🤖 **3.6** Parameterized queries, no raw SQL with user input (Code)

---

## 4. Data / DB (Neon) — [[4 Data-DB (Neon Postgres)]]
*Сначала 🤖, в конце 👤*

* [x] 🤖 **4.2** DB pooling + connection limits (Neon/Code)
* [ ] 👤 **4.1** DB TLS required (Neon/Vercel env)
* [ ] 👤 **4.3** DB least privilege (Neon SQL)
* [ ] 👤 **4.4** Backups + restore test (Neon)

---

## 5. Secrets & Config — [[5 Secrets & Config hygiene]]
*Сначала 🤖, в конце 👤*

* [x] 🤖 **5.3** .env in .gitignore, no secrets in repo/code (CI/Repo)
* [ ] 👤 **5.1** Secrets only in env, separated by envs (Vercel/CI)
* [ ] 👤 **5.2** Rotation runbook exists (Docs)

---

## 6. Observability — [[6 Observability (иначе ты слепой)]]
*Сначала 🤖, в конце 👤*

* [x] 🤖 **6.1** Logs + request-id (Code/Vercel)
* [x] 🤖 **6.3** No tokens/PII in logs (Code/Rule)
* [ ] 👤 **6.2** Alerts for 5xx/latency/webhooks/db (Obs tool)

---

## 7. Redis (Upstash) — [[7 Upstash Redis (если используется)]]
*Опционально: в проекте Redis пока не используется (in-memory rate limit/blacklist/idempotency). При подключении Upstash — сделать 7.2, 7.3, 👤 7.1.*

* [ ] 🤖 **7.2** Redis TTL + namespaces (Code) — при использовании Redis
* [ ] 🤖 **7.3** No PII/secrets in Redis (Rule) — при использовании Redis
* [ ] 👤 **7.1** Redis TLS (Upstash) — при использовании Redis

---

## 8. Dependencies — [[8 Dependency scanning]]
*🤖 в CI и/или 👤 в GitHub*

* [x] 🤖👤 **8.1** Dependency scanning in CI (npm audit / check:secrets в .github/workflows/ci.yml; опционально: Dependabot/Renovate в GitHub)

---

## 👤 Մնացած ձեռքով քայլեր (ամփոփ)

| # | Ինչ | Որտեղ |
|---|-----|-------|
| 1.1 | HTTPS + HSTS | Cloudflare SSL/TLS, Vercel Domains |
| 1.2 | WAF managed rules ON | Cloudflare Security → WAF |
| 1.3 | DDoS protection ON | Cloudflare Security → DDoS |
| 2.1 | ADR auth (docs) | ✅ `docs/adr-auth.md` |
| 2.5 | Admin MFA mandatory | Policy / 2FA for admin |
| 2.6 | Password policy | Docs/Policy |
| 4.1 | DB TLS required | Neon + Vercel env (sslmode=require) |
| 4.3 | DB least privilege | Neon SQL (role with minimal rights) |
| 4.4 | Backups + restore test | Neon Backups |
| 5.1 | Secrets only in env | Vercel/CI env vars |
| 5.2 | Rotation runbook | ✅ `docs/runbook-secret-rotation.md` |
| 6.2 | Alerts 5xx/latency | Vercel / Sentry / monitoring |

---
> **Уровень 2:** расширенный контроль — раздел B (Безопасность) и C (Секреты) в «Проектный Quality Checklist».
