# ADR: Auth սխեմա (P0 Security 2.1)

## Կարգավիճակ
Ընդունված

## Կոնտեքստ
Նախագիծը օգտագործում է **սեփական JWT-based auth** (ոչ Clerk/Auth.js). Այս փաստաթուղթը նկարագրում է, թե որտեղ և ինչպես է ստուգվում նստաշրջանը, ինչպես են աշխատում դերերը և ադմին մուտքը։

## Որոշում

### Պրովայդեր
- **Auth:** Սեփական իրականացում (JWT + Neon PostgreSQL).
- **Session:** JWT token (Bearer) — TTL `JWT_EXPIRES_IN` (default 24h). Token-ը client-ում պահվում է localStorage-ում; API-ն ստուգում է `Authorization: Bearer <token>`.

### Որտեղ է ստուգվում
- **API routes:** `lib/middleware/auth.ts` — `authenticateToken(request)` (ստուգում է JWT, blacklist, user in DB). Admin route-ներում լրացուցիչ `requireAdmin(user)`.
- **Client:** `lib/auth/AuthContext.tsx` — token/user localStorage-ից; protected pages (օր. `/admin`) redirect անում են `/login`, եթե token չկա։ **Սերվերում** ամեն admin API կրկին ստուգում է token + role.

### Դերեր
- **Աղբյուր:** PostgreSQL `users.roles` (string[]). Օր. `["customer"]`, `["admin"]`.
- **Admin:** `user.roles.includes("admin")` — ստուգվում է **միայն server-side** յուրաքանչյուր `/api/v1/admin/*` route-ում (`requireAdmin` կամ `requireAuthAdmin`).

### Ադմին մուտք
- Ադմին panel: `/admin` — client-ում redirect to `/login` եթե not logged in.
- Բոլոր admin API-ներ պահանջում են `Authorization: Bearer <token>` և `admin` role; հակառակ դեպքում 401/403.

### Logout
- `POST /api/v1/auth/logout` — token-ը ավելացվում է blacklist-ում (in-memory); client-ը ջնջում է localStorage: Նույն token-ով հաջորդ request-ը ստանում է 401.

## Հղումներ
- `apps/web/lib/middleware/auth.ts`
- `apps/web/lib/auth/AuthContext.tsx`
- `apps/web/lib/services/auth.service.ts`
- Security checklist: `Security/0 Security List.md` §2
