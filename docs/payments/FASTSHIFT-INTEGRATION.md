# FastShift — ինտեգրացիայի ձեռնարկ

> Այս փաստաթուղթը նախատեսված է **FastShift** (e-wallet / vPOS) միացման համար։ Register order → redirect_url → callback/webhook։
>
> **Աղբյուր.** `docs/06-PAYMENT-INTEGRATION-PLAN.md` §9; PayByFastShift (vers25.02.25), Api and more fastshift.

---

## 1. Ընդհանուր

- **Պրոտոկոլ.** Վճարումը սկսվում է **POST register** order FastShift API-ում (Bearer token), պատասխանից `redirect_url` — օգտատիրոջ redirect։ Callback — **callback_url** (user redirect, GET) և/կամ **webhook_url** (server POST).
- **Կապ.** FastShift-ից ստանում եք Bearer **Token** (test և live); IP whitelist — server-ի исходящий IP (Vercel-ում կարող է փոխվել).
- **Արտարժույթ.** AMD (ըստ պլանի).

### 1.1 API

| Էնդպոյնտ | URL |
|----------|-----|
| **Register order** | `https://merchants.fastshift.am/api/en/vpos/order/register` |

Test/live — նույն host; տարբերությունը **token**-ի արժեքն է (FASTSHIFT_TOKEN / FASTSHIFT_LIVE_TOKEN).

---

## 2. Environment variables

```env
# --- FastShift ---
FASTSHIFT_TEST_MODE=true
FASTSHIFT_TOKEN=
FASTSHIFT_LIVE_TOKEN=
APP_URL=https://yoursite.com
```

- **Test.** `FASTSHIFT_TEST_MODE=true` → FASTSHIFT_TOKEN.
- **Live.** FASTSHIFT_LIVE_TOKEN.

---

## 3. Callback URL

FastShift-ում (register request-ում) փոխանցվում են.

| Պարամետր | URL |
|----------|-----|
| **callback_url** | `https://yoursite.com/wc-api/fastshift_response` |
| **webhook_url** (optional) | `https://yoursite.com/wc-api/fastshift_response` |

Իրականացումում երկուսն էլ ուղարկվում են նույն URL-ին (GET — user redirect, POST — webhook).

---

## 4. Ինտեգրացիայի հոսք

1. Order + Payment (provider: `fastshift`, status: `pending`), currency = AMD.
2. **Register order** — POST `/api/en/vpos/order/register`, header `Authorization: Bearer {Token}`, body: `order_number`, `amount`, `description`, `callback_url`, `webhook_url`, `external_order_id`.
3. Պատասխան → `data.redirect_url` (կամ `redirect_url`) — redirect օգտատիրոջ։
4. **callback_url** — FastShift redirects user GET with `status`, `order_number`. Handler թարմացնում է order/payment, redirect → `/checkout/success?order=...` (success) կամ `/checkout?order=...` (fail).
5. **webhook_url** — FastShift POST (JSON/form) with `status`, `order_number`. Նույն handler, պատասխան 200.

---

## 5. Register request (POST)

**Headers.** `Authorization: Bearer {Token}`, `Content-Type: application/json`.

**Body (JSON).**

| Դաշտ | Նկարագրություն |
|------|------------------|
| order_number | Պատվերի համար (order.number) |
| amount | Գումար (ամբողջ թիվ, Math.round(total)) |
| description | Օր. "Order 260218-12345" |
| callback_url | Full URL — user redirect after payment |
| webhook_url | Full URL — server-to-server (optional) |
| external_order_id | Order id (optional) |

**Response.** `{ data: { redirect_url: "https://..." } }` կամ `{ redirect_url: "https://..." }`.

---

## 6. Callback / Webhook params

**Պարամետրներ.** `status`, `order_number` (մեր order.number). Հնարավոր են լրացուցիչ դաշտեր (transaction_id, payment_id և այլն).

**Success status.** Իրականացումում հաջող է համարվում `status`-ը, եթե այն հավասար է one of: `success`, `completed`, `paid`, `SUCCESS`, `COMPLETED`, `PAID`. Այլ արժեք → failed.

- **GET (user redirect).** Query params. Handler թարմացնում է order → success → redirect `/checkout/success?order={order_number}`; fail → redirect `/checkout?order={order_number}`.
- **POST (webhook).** JSON or application/x-www-form-urlencoded. Պատասխան 200.

---

## 7. Init API (ձեր նախագիծ)

POST `/api/v1/payments/fastshift/init` body `{ orderNumber }` → response `{ redirectUrl }`. Frontend `window.location.href = redirectUrl`.

---

## 8. Checklist

- [ ] Env: FASTSHIFT_TEST_MODE, FASTSHIFT_TOKEN (test), FASTSHIFT_LIVE_TOKEN (live).
- [ ] Register request: callback_url, webhook_url = `{APP_URL}/wc-api/fastshift_response`.
- [ ] Callback: order_number → find order by number; status success/fail → update order/payment; cart clear on success.
- [ ] GET callback → redirect user to success or checkout; POST → 200.
- [ ] Checkout-ում FastShift ընտրելիս redirect to FastShift (ոչ card modal).

---

**Փաստաթղթի տարբերակ.** 1.0  
**Ամսաթիվ.** 2026-02-18
