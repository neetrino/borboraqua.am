# Runbook: Գաղտնիքների ռոտացիա (P0 Security 5.2)

Կրիտիկական secret-ները պետք է պարբերաբար փոխել (և արտակարգ իրավիճակում). Ստորև — ուր գնալ և ինչ անել։

---

## 1. JWT_SECRET (Auth)

- **Որտեղ:** Vercel → Project → Settings → Environment Variables (`JWT_SECRET`).
- **Ինչ անել:** Նոր secret գեներացնել (օր. `openssl rand -base64 32`), արժեքը թարմացնել Production/Preview env-ում, Redeploy.
- **Կարևոր:** Ռոտացիայից հետո բոլոր հին JWT token-ները invalid կդառնան — բոլոր user-ները պետք է նորից login անեն.

---

## 2. DATABASE_URL (Neon)

- **Որտեղ:** Neon Dashboard → Project → Connection string; Vercel env `DATABASE_URL`.
- **Ինչ անել:** Neon-ում password reset (Settings կամ SQL `ALTER ROLE ... PASSWORD '...'`), նոր connection string պատճենել Vercel env-ում, Redeploy.
- **Նշում:** Միգրացիաներն ավելի լավ է թողնել direct (non-pooler) URL-ով, եթե օգտագործում եք.

---

## 3. R2 / Cloudflare (Նկարներ)

- **Որտեղ:** Cloudflare R2 → Manage R2 API Tokens; Vercel env `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
- **Ինչ անել:** Նոր API token ստեղծել R2-ում, հինը ջնջել, նոր արժեքները դնել Vercel-ում, Redeploy.

---

## 4. Վճարումներ (Ameriabank, Idram, Telcell, FastShift)

- **Որտեղ:** Յուրաքանչյուր պրովայդերի dashboard (test/live credentials); Vercel env `AMERIA_*`, `IDRAM_*`, `TELCELL_*`, `FASTSHIFT_*`.
- **Ինչ անել:** Պրովայդերի կողմից նոր client/secret/key ստանալ, env-ում թարմացնել, Redeploy. Հին բանալիներն անջատել/ջնջել provider-ի կողմից։

---

## 5. Resend (Email)

- **Որտեղ:** Resend Dashboard → API Keys; Vercel env `RESEND_API_KEY`.
- **Ինչ անել:** Նոր API key ստեղծել, հինը revoke, env թարմացնել, Redeploy.

---

## Ընդհանուր

- **Redeploy:** Vercel-ում Deployments → … → Redeploy (կամ push to main), որպեսզի նոր env արժեքները կիրառվեն.
- **Փաստաթղթավորում:** Ռոտացիա արելուց հետո կարճ նշել (ամսաթիվ, ով) docs-ում կամ internal log-ում.
