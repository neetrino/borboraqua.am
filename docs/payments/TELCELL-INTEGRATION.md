# Telcell Money — ինտեգրացիայի ձեռնարկ

> Այս փաստաթուղթը նախատեսված է **Telcell Money** (Telcell Wallet) միացման համար։ Բոլոր նյուանսները (PostInvoice URL, security_code, RESULT checksum, issuer_id base64) ներառված են։
>
> **Աղբյուր.** `payment integration/| Official doc for the API integrationm/TelCell/Api and more Telcell.md.md` (թեստ տվյալներ), `Example only/HK Agency/payment-gateway-for-telcell` (PHP plugin).

---

## 1. Ընդհանուր

- **Պրոտոկոլ.** Վճարումը սկսվում է **GET redirect** Telcell invoices URL (PostInvoice params + security_code). Callback — RESULT_URL (GET/POST), REDIRECT_URL (GET).
- **Կապ.** Telcell-ից ստանում եք shop_id (User Name), shop_key (Password); test և live արժեքներ:
- **Արտարժույթ.** Միայն **AMD**.

### 1.1 API URL-ներ

| Միջավայր | URL |
|----------|-----|
| **Test** | `https://telcellmoney.am/proto_test2/invoices` |
| **Live** | `https://telcellmoney.am/invoices` |

---

## 2. Environment variables

```env
# --- Telcell ---
TELCELL_TEST_MODE=true
# Test
TELCELL_SHOP_ID=
TELCELL_SHOP_KEY=
# Live
TELCELL_LIVE_SHOP_ID=
TELCELL_LIVE_SHOP_KEY=
APP_URL=https://yoursite.com
```

- **Test.** `TELCELL_TEST_MODE=true` → TELCELL_SHOP_ID, TELCELL_SHOP_KEY, test invoices URL.
- **Live.** TELCELL_LIVE_* + live invoices URL.

---

## 3. Callback URL-ներ

Telcell-ում գրանցել.

| Պարամետր | URL |
|----------|-----|
| **RESULT_URL** | `https://yoursite.com/wc-api/telcell_result` |
| **REDIRECT_URL** | `https://yoursite.com/wc-api/telcell_redirect` |

---

## 4. Ինտեգրացիայի հոսք

1. Order + Payment (provider: `telcell`, status: `pending`), currency = AMD.
2. **PostInvoice redirect** — build URL: `{apiUrl}?action=PostInvoice&issuer=...&currency=֏&price=...&product=...&issuer_id=...&valid_days=1&lang=am&security_code=...`.
3. Օգտատերը redirect → Telcell, վճարում է:
4. **RESULT_URL** — Telcell-ը ուղարկում է վճարման արդյունքը (GET կամ POST): issuer_id, status, invoice, payment_id, currency, sum, time, **checksum**. Ստուգել checksum, status === "PAID" → order paid, payment completed, cart clear.
5. **REDIRECT_URL** — օգտատիրոջ redirect (query-ում կարող է լինել order կամ issuer_id). Redirect → /checkout/success?order=...

---

## 5. PostInvoice — redirect URL

**Method:** GET (բոլոր պարամետրերը query string-ում).

| Պարամետր | Նկարագրություն |
|----------|-----------------|
| action | `PostInvoice` |
| issuer | shop_id |
| currency | `֏` (AMD) |
| price | Գումար (ամբողջ թիվ, Math.round(order.total)) |
| product | base64(նկարագրություն), օր. base64("Order #123") |
| issuer_id | **base64(order.id)** — callback-ում order-ը գտնելու համար |
| valid_days | 1 (կամ ավելի) |
| lang | am / ru / en |
| security_code | MD5(shop_key + issuer + currency + price + product + issuer_id + valid_days) — բոլորը string concatenation |

**Security code.** Բոլոր արժեքները string, concatenate առանց separator, ապա MD5 hex.

---

## 6. RESULT_URL callback

**Method:** GET կամ POST (params query-ում կամ body-ում).

**Պարամետրներ.** issuer_id, status, invoice, payment_id, currency, sum, time, checksum.

**Checksum.**  
`MD5(shop_key + invoice + issuer_id + payment_id + currency + sum + time + status)` — concatenation, MD5 hex. Case-insensitive համեմատություն.

- **issuer_id** — նույն արժեքը, ինչ PostInvoice-ում ուղարկել եք (base64(order.id)). Decode base64 → order id, DB-ում գտնել order.
- **status** — `PAID` = հաջող, այլ = ձախողում:
- Ստուգել checksum → թարմացնել order/payment, պատասխան 200.

---

## 7. REDIRECT_URL

GET. Query-ում կարող է լինել `order` կամ `issuer_id`. issuer_id-ն decode (base64) → order id → order.number → redirect `/checkout/success?order={number}`.

---

## 8. Init API (ձեր նախագիծ)

POST /api/v1/payments/telcell/init body `{ orderNumber, lang? }` → response `{ redirectUrl }`. Redirect URL-ը build է լինում buildTelcellRedirectUrl(...); frontend-ը `window.location.href = redirectUrl`.

---

## 9. Checklist

- [ ] Env: TELCELL_TEST_MODE, TELCELL_SHOP_ID, TELCELL_SHOP_KEY (test/live).
- [ ] RESULT_URL, REDIRECT_URL գրանցել Telcell-ում.
- [ ] PostInvoice: issuer_id = base64(order.id), security_code = MD5(shop_key+issuer+currency+price+product+issuer_id+valid_days).
- [ ] RESULT: checksum = MD5(shop_key+invoice+issuer_id+payment_id+currency+sum+time+status); issuer_id base64 decode → order id.
- [ ] status === "PAID" → paid/completed; cart clear միայն success-ից հետո։
- [ ] Միայն AMD orders.
- [ ] Checkout-ում Telcell ընտրելիս redirect to Telcell (ոչ card modal).

---

## 9. Համեմատություն payment-gateway-for-telcell plugin-ի հետ

| Էլեմենտ | HK Agency plugin (PHP) | Մեր իրականացում | Նշում |
|--------|------------------------|------------------|--------|
| **PostInvoice URL** | `api_url . '?action=PostInvoice&issuer=' . $issuer . '&currency=' ...` | `buildTelcellRedirectUrl()` — նույն params | ✓ |
| **security_code** | `MD5(shop_key + issuer + currency + price + product + issuer_id + valid_days)` | `getTelcellSecurityCode()` — նույն բանաձև | ✓ |
| **product** | `base64_encode(get_bloginfo('url'))` (site URL) | `base64("Order " + order.number)` | Տարբերություն. մենք ցուցադրում ենք պատվերի նկարագրություն (ավելի պարզ օգտատիրոջ համար). |
| **issuer_id** | `base64_encode($order_id)` (WooCommerce integer id) | `base64(order.id)` (DB UUID) | Երկուսն էլ unique identifier; callback-ում decode → order lookup. ✓ |
| **RESULT checksum** | `MD5(shop_key + invoice + issuer_id + payment_id + currency + sum + time + status)` | `verifyTelcellResultChecksum()` — նույն բանաձև, issuer_id **raw** (ինչպես ստացվել է) | ✓ |
| **RESULT success** | `$status === 'PAID'` | `TELCELL_STATUS_PAID` ("PAID") | ✓ |
| **REDIRECT** | `wc_get_order($_REQUEST['order'])` → get_return_url | Decode issuer_id or order → `/checkout/success?order=...` | ✓ |

**Օրինակ URL (թեստ).**  
`https://telcellmoney.am/proto_test2/invoices?action=PostInvoice&issuer=...&currency=֏&price=2&product=T3JkZXIgMjYyMTgtMDE1MzU&issuer_id=...&valid_days=1&lang=en&security_code=...`  
- `product=T3JkZXIgMjYyMTgtMDE1MzU` = base64("Order 260218-01535") ✓  
- `issuer_id` = base64(order.id) ✓  
- `security_code` = MD5(shop_key+issuer+currency+price+product+issuer_id+valid_days) ✓  

Իրականացումը ճիշտ է և պատրաստ թեստի։

---

---

## 10. Թեստ — 404 (This page can't be found)

Եթե redirect-ից հետո Telcell-ի էջը ցույց է տալիս **404**:

1. **Query encoding** — Բոլոր պարամետրերը (ներառյալ `currency=֏`) percent-encoded են (`encodeURIComponent`), որպեսզի server-ը ճիշտ parse անի.
2. **Test URL** — Test միջավայրի URL-ը `https://telcellmoney.am/proto_test2/invoices`. Եթե Telcell-ը փոխել է test path-ը կամ անջատել է — 404 կլինի. **Պետք է հաստատել Telcell-ի հետ**, որ test endpoint-ը նույնն է, կամ ստանալ արդի test URL.
3. **Փորձել live** — Եթե ունեք live shop_id/shop_key, փորձել `TELCELL_TEST_MODE=false` և live URL (`https://telcellmoney.am/invoices`) — եթե live-ը բացվում է, ապա խնդիրը test environment-ի հետ է.

**Փաստաթղթի տարբերակ.** 1.1  
**Ամսաթիվ.** 2026-02-18
