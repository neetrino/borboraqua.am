# Idram — ինտեգրացիայի ձեռնարկ

> **Պաշտոնական API.** `payment integration/| Official doc for the API integrationm/IDram/Idram Merchant API New.md`

---

## 1. Ընդհանուր

- **Վճարում.** POST form → `https://banking.idram.am/Payment/GetPayment` (UTF-8).
- **Կարգավորում.** Idram-ից ստանում եք: SUCCESS_URL, FAIL_URL, RESULT_URL, SECRET_KEY, EMAIL.
- **Արտարժույթ.** Միայն **AMD** (Idram wallet).

---

## 2. Environment variables

```env
IDRAM_TEST_MODE=true
IDRAM_REC_ACCOUNT=          # Test EDP_REC_ACCOUNT (IdramID)
IDRAM_SECRET_KEY=           # Test SECRET_KEY
IDRAM_LIVE_REC_ACCOUNT=     # Production
IDRAM_LIVE_SECRET_KEY=      # Production
APP_URL=https://yoursite.com
```

---

## 3. Callback URL-ներ

| Պարամետր | URL |
|----------|-----|
| SUCCESS_URL | `https://yoursite.com/wc-api/idram_complete` |
| FAIL_URL | `https://yoursite.com/wc-api/idram_fail` |
| RESULT_URL | `https://yoursite.com/wc-api/idram_result` |

---

## 4. Վճարման սկիզբ (form)

Form fields (hidden):

| Field | Պարտադիր | Նկարագրություն |
|-------|----------|-----------------|
| EDP_LANGUAGE | Yes | EN, AM, RU |
| EDP_REC_ACCOUNT | Yes | Merchant IdramID |
| EDP_DESCRIPTION | Yes | Նկարագրություն |
| EDP_AMOUNT | Yes | Գումար, dot (.) տասնորդական |
| EDP_BILL_NO | Yes | Պատվերի/հաշվի ID (order.number) |
| EDP_EMAIL | No | Էլ. փոստ |
| (custom) | No | EDP_ չպրեֆիքսով դաշտերը Idram-ը վերադարձնում է redirect-ում |

Form `method="POST"`, `action="https://banking.idram.am/Payment/GetPayment"`.

---

## 5. RESULT_URL — երկու POST

Content-Type: `application/x-www-form-urlencoded`. Պատասխան — **plain text** (առանց HTML).

### (a) Precheck — EDP_PRECHECK=YES

Պարամետրներ: `EDP_PRECHECK`, `EDP_BILL_NO`, `EDP_REC_ACCOUNT`, `EDP_AMOUNT`.

- Ստուգել `EDP_REC_ACCOUNT` = ձեր REC_ACCOUNT.
- Գտնել order `EDP_BILL_NO`-ով (order.number), ստուգել գումարը **ԲԴ-ից** (ոչ request-ից).
- Եթե ամեն ինչ ճիշտ է → պատասխան **«OK»** (ճիշտ այդ տեքստը).
- Հակառակ դեպքում → ցանկացած այլ տեքստ → Idram-ը օգտատիրոջ կուղարկի FAIL_URL։

### (b) Payment confirmation

Պարամետրներ: `EDP_BILL_NO`, `EDP_REC_ACCOUNT`, `EDP_PAYER_ACCOUNT`, `EDP_AMOUNT`, `EDP_TRANS_ID`, `EDP_TRANS_DATE`, `EDP_CHECKSUM`.

**Checksum:**  
`MD5(EDP_REC_ACCOUNT:EDP_AMOUNT:SECRET_KEY:EDP_BILL_NO:EDP_PAYER_ACCOUNT:EDP_TRANS_ID:EDP_TRANS_DATE)`  
— դաշտերը concatenate `:`-ով, արդյունքը MD5 hex (case-insensitive համեմատություն).

- Ստուգել checksum.
- Գումարը կրկին ստուգել ԲԴ-ից (order.total).
- Թարմացնել order (paymentStatus = paid), payment (completed), cart clear.
- Պատասխան **«OK»**.

Checksum սխալ → պատասխան `EDP_CHECKSUM not correct`.

---

## 6. SUCCESS_URL / FAIL_URL

GET redirect օգտատիրոջ։ Idram-ը կարող է ավելացնել query params (օր. custom դաշտեր) — օգտագործել `order_number`/`order` success/error էջին redirect-ի համար։

---

## 7. Checklist

- [ ] Env: IDRAM_TEST_MODE, REC_ACCOUNT, SECRET_KEY (test/live).
- [ ] Form POST to `https://banking.idram.am/Payment/GetPayment`, UTF-8.
- [ ] EDP_BILL_NO = order.number (կամ stable order id).
- [ ] RESULT_URL: (a) precheck → "OK"; (b) confirm → checksum, then "OK".
- [ ] Պատասխան plain text, առանց HTML.
- [ ] Միայն AMD orders.
- [ ] Cart clear միայն (b) success-ից հետո։

---

**Փաստաթղթի տարբերակ.** 1.0 | **Ամսաթիվ.** 2026-02-18
