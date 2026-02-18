# Պլան. Վճարային մեթոդների ինտեգրացիա

> **Կարևոր.** Հին WordPress կայքում արդեն գրանցված callback/redirect URL-ները **պետք է մնան նույնը**։ Նոր կայքը պետք է սպասարկի այդ path-երը (`/wc-api/...`), որպեսզի բանկերը/համակարգերը չստիպվեն վերագրանցել URL-ներ։

**Փաստաթղթեր.** `payment integration/| Official doc for the API integrationm/`  
**Callback URL-ներ.** `payment integration/| Official doc for the API integrationm/call back.md`  
**Ameriabank — մանրամասն ինտեգրացիա (API նյուանսներ, checklist).** `docs/payments/AMERIABANK-INTEGRATION.md`  
**Idram — ինտեգրացիա (form, RESULT_URL precheck/confirm, checksum).** `docs/payments/IDRAM-INTEGRATION.md`

---

## 1. Ընդհանուր սկզբունքներ

| Սկզբունք | Նկարագրություն |
|-----------|------------------|
| **URL-ների անփոփոխություն** | Success/Fail/Result/Redirect URL-ները = `https://borboraqua.am/wc-api/...` — նույնը, ինչ WordPress-ում |
| **Պատասխանի ձևաչափ** | Callback endpoint-երը պատասխանում են այն ձևաչափով, որ բանկ/համակարգը սպասում է (օր. Idram → `OK`, FastShift → ըստ API) |
| **Ստուգում API-ով** | Չհիմնվել միայն redirect query params-ի վրա — Ameriabank-ում պարտադիր `GetPaymentDetails` |
| **Test / Live** | `.env`-ում առանձին արժեքներ test և production-ի համար |

---

## 2. Payment Status (PAYMENT STATUS) — ցուցադրում

- **Պարտադիր** ամենուր, որտեղ ցուցադրվում է պատվերը, ճիշտ ցուցադրել **Payment Status** (վճարման կարգավիճակ).
- **Վայրեր.**  
  - **Ադմին.** պատվերների ցանկ և պատվերի մանրամասն — PAYMENT STATUS դաշտ։  
  - **Օգտատիրոջ պրոֆիլ.** «Իմ պատվերները» — յուրաքանչյուր պատվերում PAYMENT STATUS։  
  - **Ադմինիստրատոր.** նույնը, ինչ ադմինում — ճիշտ status-ի ցուցադրում։
- **Status-ների ցանկ** (ներառյալ Ameriabank-ի refund/cancel):
  - `pending` — վճարում սկսված / սպասվում է
  - `success` / `paid` — հաջող վճարում
  - `failed` — վճարում ձախողվել է
  - **`cancelled`** — վճարում չեղարկված (Ameriabank CancelPayment)
  - **`refunded`** — մասնակի/լրիվ ետ refund (Ameriabank RefundPayment)

Այս արժեքները պետք է միասնական լինեն order/payment մոդելում և ճիշտ արտացոլվեն UI-ում (ադմին + պրոֆիլ)։

---

## 3. Զամբյուղի (cart) մաքրում — միայն հաջող վճարումից հետո

- **Կանոն.** Զամբյուղը **մաքրվում է միայն այն դեպքում, երբ պատվերի վճարման կարգավիճակը դառնում է հաջող (success/paid)**։
- **Հոսք.**
  1. Օգտատերը checkout-ում սեղմում է «Վճարել» → ստեղծվում է պատվեր (status՝ pending / awaiting_payment) → redirect դեպի բանկ/վճարային համակարգ։
  2. Այդ պահին **զամբյուղը չի մաքրվում** — ապրանքները մնում են cart-ում։
  3. Բանկից վերադարձից հետո callback-ում թարմացնում ենք պատվերի payment status։
  4. **Եթե վճարումը հաջող է** → order status = success/paid → **այդ պահին** մաքրել զամբյուղ (clear cart).
  5. **Եթե վճարումը ձախողվել է** → զամբյուղը **չի** մաքրվում — օգտատերը կարող է կրկին փորձել կամ փոխել վճարային մեթոդ առանց ապրանքները նորից ավելացնելու։
- **Իրականացում.** Cart clear կանչել միայն success/redirect էջում, երբ order-ի payment status = paid/success (կամ order status-ը արդեն «վճարված»), օր. success page-ում `GET /api/v1/orders/[number]` → եթե `paymentStatus === 'paid'` → `DELETE /api/v1/cart/items` / clear cart in state.

Ավելի լավ տարբերակ չկա — այս տրամաբանությունը ստանդարտ է (cart clear միայն after successful payment).

---

## 4. Callback URL-ներ (պարտադիր path-եր)

Նոր կայքում **պետք է** լինեն հետևյալ route-երը (Next.js `app/` under `wc-api`):

| Համակարգ | Պարամետր | URL (path) |
|-----------|----------|------------|
| **Ameriabank** | Success | `https://borboraqua.am/wc-api/ameriabank_successful` |
| **Ameriabank** | Failed | `https://borboraqua.am/wc-api/ameriabank_failed` |
| **FastShift** | Callback | `https://borboraqua.am/wc-api/fastshift_response` |
| **Idram** | SUCCESS_URL | `https://borboraqua.am/wc-api/idram_complete` |
| **Idram** | FAIL_URL | `https://borboraqua.am/wc-api/idram_fail` |
| **Idram** | RESULT_URL | `https://borboraqua.am/wc-api/idram_result` |
| **Telcell** | RESULT_URL | `https://borboraqua.am/wc-api/telcell_result` |
| **Telcell** | REDIRECT_URL | `https://borboraqua.am/wc-api/telcell_redirect` |

**Իրականացում.** `apps/web/app/wc-api/<handler>/route.ts` — յուրաքանչյուր handler-ի համար GET/POST ըստ փաստաթղթի (օր. Ameriabank → GET with query; Idram RESULT_URL → POST form).

---

## 5. Ինտեգրացիայի հերթականություն

1. **Ameriabank** — առաջին (vPOS, ամենալի document-ը, առանց server-to-server callback)
2. **Idram** — երկրորդ (POST form, 2 callback-ներ RESULT_URL-ում, checksum)
3. **Telcell** — երրորդ (shop_id, shop_key, RESULT + REDIRECT)
4. **FastShift** — չորրորդ (Bearer token, register order + callback_url/webhook_url)

---

## 6. Փուլ 1 — Ameriabank (vPOS 3.1)

### 6.1 Աղբյուր

- `payment integration/| Official doc for the API integrationm/AmeriaBank/vPOS - Ameriabank.md`

### 6.2 Հոսք

1. **InitPayment** (POST) → `ClientID`, `Username`, `Password`, `OrderID`, `Amount`, `Currency`, `BackURL`, `Description`, `lang`, `Opaque`.
2. Պատասխան → `ResponseCode` (1 = success), `PaymentID`.
3. Redirect օգտատիրոջ → `https://servicestest.ameriabank.am/VPOS/Payments/Pay?id={PaymentID}&lang={lang}` (test) կամ `https://services.ameriabank.am/...` (prod).
4. Բանկը օգտատիրոջ վերադարձնում է **BackURL**-ով GET params: `orderID`, `paymentID`, `resposneCode`, `currency`, `opaque` (typo in doc: `resposneCode`).
5. **Պարտադիր** — GetPaymentDetails (POST) `paymentID`, `Username`, `Password` → ստուգել `ResponseCode === '00'` և `PaymentState === 'Successful'`.
6. Ըստ արդյունքի թարմացնել order (payment status), redirect օգտատիրոջ success/fail էջ։

**Refund / Cancel (վերադարձ, չեղարկում).** vPOS API-ում կան `RefundPayment` (մասնակի/լրիվ ետ վճարում) և `CancelPayment` (չեղարկում, 72 ժամի ընթացքում)։ Order-ի payment status-ում պետք է աջակցել **`cancelled`** և **`refunded`** — ադմինում/պրոֆիլում ճիշտ ցուցադրել, ադմինից կարող է սկսվել refund/cancel (API կանչեր դեպի Ameriabank)։

**Կարևոր.** Փաստաթղթում **մեկ** BackURL է։ WordPress-ում Success/Failed երկու URL են — հավանաբար BackURL-ը մեկն է, իսկ handler-ը ներքին redirect է անում success/fail path-երին; կամ բանկի merchant panel-ում երկու URL է գրանցված։ Իրականացնել երկու route-ն էլ (`ameriabank_successful`, `ameriabank_failed`) — երկուսն էլ GET, query-ով, նույն վալիդացիան (GetPaymentDetails), տարբեր վերջնական redirect/ճակատ։

### 6.3 Env (տես ներքևի աղյուսակ)

- Test: `AMERIA_*_TEST_*` + base URL `servicestest.ameriabank.am`
- Prod: `AMERIA_*_LIVE_*` + base URL `services.ameriabank.am`

### 6.4 Կառուցվածք (առաջարկ)

- `apps/web/app/api/v1/payments/ameriabank/init/route.ts` — InitPayment, վերադարձնի `redirectUrl`.
- `apps/web/app/wc-api/ameriabank_successful/route.ts` — GET, query → GetPaymentDetails → success redirect.
- `apps/web/app/wc-api/ameriabank_failed/route.ts` — GET, query → GetPaymentDetails / resposneCode → failed redirect.
- Shared: `apps/web/lib/payments/ameriabank/client.ts`, `getPaymentDetails.ts`, constants (URLs, response codes).

---

## 7. Փուլ 2 — Idram

### 7.1 Աղբյուր

- `payment integration/| Official doc for the API integrationm/IDram/Idram Merchant API New.md`

### 7.2 Հոսք

1. **Վճարի սկիզբ** — HTML form POST → `https://banking.idram.am/Payment/GetPayment` (EDP_LANGUAGE, EDP_REC_ACCOUNT, EDP_DESCRIPTION, EDP_AMOUNT, EDP_BILL_NO, EDP_EMAIL…).
2. **RESULT_URL** — Idram-ը ուղարկում է **2 POST** (x-www-form-urlencoded):  
   (a) EDP_PRECHECK=YES — պատասխան `OK` եթե order/sum ճիշտ;  
   (b) EDP_BILL_NO, EDP_REC_ACCOUNT, EDP_PAYER_ACCOUNT, EDP_AMOUNT, EDP_TRANS_ID, EDP_TRANS_DATE, **EDP_CHECKSUM** — checksum = MD5(EDP_REC_ACCOUNT:EDP_AMOUNT:SECRET_KEY:EDP_BILL_NO:EDP_PAYER_ACCOUNT:EDP_TRANS_ID:EDP_TRANS_DATE), գումարը ստուգել **ԲԴ-ից**, ոչ request-ից.
3. SUCCESS_URL / FAIL_URL — redirect օգտատիրոջ։

### 7.3 Env

- EDP_REC_ACCOUNT (test/live), SECRET_KEY (test/live) — տես §10.

### 7.4 Route-եր

- `wc-api/idram_result` — POST (precheck + payment confirmation).
- `wc-api/idram_complete` — GET (redirect success).
- `wc-api/idram_fail` — GET (redirect fail).

### 7.5 Փուլ 2 ավարտված

Իրականացված. Մանրամասն ձեռնարկ՝ `docs/payments/IDRAM-INTEGRATION.md`.

---

## 8. Փուլ 3 — Telcell

### 8.1 Աղբյուր

- `payment integration/| Official doc for the API integrationm/TelCell/Api and more Telcell.md.md` (սահմանափակ), Archive-ի նյութեր։

### 8.2 Ըստ փաստաթղթի

- `shop_id`, `shop_key` (test արժեքներ փաստաթղթում).
- **RESULT_URL** — callback վճարման կարգավիճակի համար.
- **REDIRECT_URL** — redirect գնորդի success էջ.

### 8.3 Route-եր

- `wc-api/telcell_result` — callback (POST/GET ըստ API).
- `wc-api/telcell_redirect` — redirect.

---

## 9. Փուլ 4 — FastShift

### 9.1 Աղբյուր

- `payment integration/| Official doc for the API integrationm/FastShift/PayByFastShift (vers25.02.25).md`, `Api and more fastshift.md`

### 9.2 Հոսք

1. **Register order** — POST `https://merchants.fastshift.am/api/en/vpos/order/register`, header `Authorization: Bearer {Token}`, body JSON: `order_number`, `amount`, `description`, `callback_url`, `webhook_url`, `external_order_id`…
2. Պատասխան → `data.redirect_url` — օգտատիրոջ redirect.
3. **callback_url** — FastShift redirects user with `status`, `order_number`.
4. **webhook_url** (optional) — server POST with `status`, `order_number`.

Callback URL-ը borboraqua.am-ի համար (ըստ call back.md) — `https://borboraqua.am/wc-api/fastshift_response`.

### 9.3 Env

- `FASTSHIFT_TOKEN` (test/live). IP for whitelist — server-ի исходящий IP (Vercel-ում կարող է փոխվել, հստակեցնել FastShift-ի հետ):

---

## 10. Env փոփոխականներ — ամփոփ

Ստորև բոլոր պոլյաները, որոնք պետք է լինեն `.env`-ում (նախ test արժեքներ/placeholder, ապա production արժեքներ).

| Համակարգ | Փոփոխական | Նկարագրություն |
|----------|------------|-----------------|
| **Ameriabank** | `AMERIA_TEST_MODE` | `true` / `false` |
| | `AMERIA_CLIENT_ID` | Test ClientID (vPOS) |
| | `AMERIA_USERNAME` | Test Username |
| | `AMERIA_PASSWORD` | Test Password |
| | `AMERIA_LIVE_CLIENT_ID` | Production ClientID |
| | `AMERIA_LIVE_USERNAME` | Production Username |
| | `AMERIA_LIVE_PASSWORD` | Production Password |
| **Idram** | `IDRAM_TEST_MODE` | `true` / `false` |
| | `IDRAM_REC_ACCOUNT` | Test EDP_REC_ACCOUNT (IdramID) |
| | `IDRAM_SECRET_KEY` | Test SECRET_KEY |
| | `IDRAM_LIVE_REC_ACCOUNT` | Production EDP_REC_ACCOUNT |
| | `IDRAM_LIVE_SECRET_KEY` | Production SECRET_KEY |
| **Telcell** | `TELCELL_TEST_MODE` | `true` / `false` |
| | `TELCELL_SHOP_ID` | Test shop_id |
| | `TELCELL_SHOP_KEY` | Test shop_key |
| | `TELCELL_LIVE_SHOP_ID` | Production shop_id |
| | `TELCELL_LIVE_SHOP_KEY` | Production shop_key |
| **FastShift** | `FASTSHIFT_TEST_MODE` | `true` / `false` |
| | `FASTSHIFT_TOKEN` | Test Bearer token |
| | `FASTSHIFT_LIVE_TOKEN` | Production Bearer token |

Բազային URL-ը (օր. `https://borboraqua.am`) կարող է գալ `APP_URL` / `NEXT_PUBLIC_APP_URL`-ից։

---

## 11. Առաջին քայլ — Ameriabank

1. **Env** — ավելացնել Ameriabank-ի բոլոր դաշտերը (տես §10), test placeholder-ներով։
2. **Shared layer** — `lib/payments/ameriabank/`: config (read env), HTTP client (InitPayment, GetPaymentDetails), types (response codes, PaymentState).
3. **API init** — `POST /api/v1/payments/ameriabank/init` — body: orderId, amount, currency, description; response: `{ redirectUrl }` կամ error.
4. **wc-api routes** — `wc-api/ameriabank_successful`, `wc-api/ameriabank_failed` — GET, parse query → GetPaymentDetails → update order → redirect to site success/fail page.
5. **Checkout** — frontend-ում Ameriabank ընտրելիս կանչել init, ապա `window.location = redirectUrl`.
6. **Թեստ** — test credentials-ով InitPayment → Pay → return to BackURL → ստուգել GetPaymentDetails և order status։
7. **Payment Status ցուցադրում** — ադմին + օգտատիրոջ պրոֆիլ (§2), status-ներ՝ pending, success/paid, failed, cancelled, refunded.
8. **Cart clear** — միայն success-ից հետո (§3).

Այս փուլն ավարտելուց հետո անցնել Idram, Telcell, FastShift-ին։
