# Resend — ինտեգրացիա և հաջորդ քայլեր

## Ինչ արդեն արված է

- **Ճյուղ:** `resend` (ստեղծված `payment-integration`-ից)
- **Resend:** API key, դոմեն `dev.neetrino.com` — verified
- **.env:** `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` (ադմինի email — պատվերների նամակներ)

## test@dev.neetrino.com — պետք է ինչ-որ բան անե՞լ

**Ոչ։** Resend-ում դոմեն verify ես արել → ցանկացած հասցե `@dev.neetrino.com` (օր. `test@dev.neetrino.com`, `support@dev.neetrino.com`) կարող ես օգտագործել որպես sender.  
Թեստի համար `.env`-ում դիր.

```env
EMAIL_FROM="test@dev.neetrino.com"
```

Ուղղակի փոխել `EMAIL_FROM`-ը — լրացուցիչ կարգավորում Resend dashboard-ում **պետք չէ**։

---

## Կոդում ավելացվածը

| Ինչ | Նկարագրություն |
|-----|------------------|
| `apps/web` | `resend` package (npm install) |
| `apps/web/lib/resend.ts` | Resend client (RESEND_API_KEY) |
| `apps/web/lib/email.ts` | `sendEmail({ to, subject, html, text? })` |
| `apps/web/app/api/v1/email/test/route.ts` | POST թեստային նամակ ուղարկելու համար |
| `apps/web/lib/email-templates/order-admin-notification.ts` | Պատվերի մասին նամակ ադմինին (HTML շաբլոն + `sendOrderNotificationToAdmin`) |
| `orders.service.ts` (checkout) | Պատվեր ստեղծվելուց հետո ադմինին email ուղարկում |

### Թեստային նամակ ուղարկել

```bash
curl -X POST http://localhost:3000/api/v1/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"твой-email@gmail.com"}'
```

Եթե `RESEND_API_KEY` և `EMAIL_FROM` ճիշտ են — նամակը կգա `test@dev.neetrino.com`-ից (եթե .env-ում այդպես ես դրել)։

---

## Հաջորդ քայլեր (աբյեկնիտի)

1. **Թեստ անել**
   - `.env`-ում `EMAIL_FROM="test@dev.neetrino.com"` (եթե դեռ support@ է)
   - `npm run dev` → POST `/api/v1/email/test` with `{"to": "твой@email.com"}`

2. **Պատվեր → ադմին** (արդեն արված)
   - Checkout-ից հետո ադմինին գնում է նամակ `ADMIN_EMAIL`-ին՝ համար, կլիենտ, ապրանքներ, գումար, հասցե (HTML շաբլոն)։

3. **Contact form**
   - Հիմա contact-ը միայն DB-ում է պահում (`createContactMessage`).
   - Ուզում ես՝ ավելացնել ադմինին նամակ կամ օգտատիրոջը auto-reply.

4. **Պատվեր → հաճախորդ**
   - Order confirmation email հասցեատիրոջը (ըստ ցանկության)։

5. **Շաբլոններ (ընտրովի)**
   - React Email (`@react-email/components`) — HTML շաբլոններ order/contact-ի համար.
   - Տե՛ս `reference/platforms/11-EMAIL.md`.

6. **Production**
   - EMAIL_FROM production-ում — օր. `noreply@borboraqua.am` (երբ իր domain-ը verify կանես Resend-ում).
   - Ցանկության դեպքում՝ QStash (ոչ պարտադիր) — հուսալի queue.

---

## Checklist

- [x] Resend account, API key
- [x] Domain `dev.neetrino.com` verified
- [x] `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` in .env
- [x] Branch `resend`, `resend` package, `lib/resend.ts`, `lib/email.ts`
- [x] Test endpoint `POST /api/v1/email/test`
- [ ] Թեստ նամակ ուղարկել և ստուգել
- [ ] Contact form — email ադմինին / auto-reply (ըստ ցանկության)
- [x] Order notification to admin (ADMIN_EMAIL) on new order
- [ ] Order confirmation email to customer (ըստ ցանկության)
- [ ] Production domain և EMAIL_FROM (երբ պատրաստ լինի)
