# Զարգացման առաջընթաց — borboraqua.am

**Նախագիծ.** borboraqua.am  
**Փուլ.** Օчистка и старт (clean start)  
**Ընդհանուր առաջընթաց.** 15%

**Վերջին թարմացում.** 2026-02-19

---

## 📊 ԱՄԲՈՂՋԱԿ

| Փուլ                                 | Ստատուս          | Առաջընթաց |
| ------------------------------------ | ---------------- | --------- |
| 0. Օчистка / Clean start             | ✅ Ավարտված      | 100%      |
| 1. Նախաձեռնում (կանոններ, docs)      | ✅ Ավարտված      | 100%      |
| 2. MVP (կատալոգ, զամբյուղ, checkout) | 🔄 Աշխատանքի մեջ | 70%       |
| 3. Թեստավորում, դեպլոյ               | ⏳ Սպասվում է    | 0%        |

---

## ✅ ԿԱՏԱՐՎԱԾ

### Փուլ 0. Օчистка (2026-02-13)

- [x] .env\* հեռացվել Git ինդեքսից, .env.example ավելացվել
- [x] Արմատից SQL/PS1 տեղափոխվել docs/archive, scripts/archive
- [x] Scripts դասակարգվել — ակտիվ vs archive, scripts/README.md
- [x] LICENSE, .editorconfig, .github (issue/PR templates), .gitignore (template)
- [x] docs/BRIEF.md, docs/TECH_CARD.md, docs/PROGRESS.md, docs/CLEANUP_PLAN.md
- [x] Միակ միգրացիաներ — packages/db/prisma/migrations

### Փուլ 1. Կանոններ և փաստաթղթեր

- [x] .cursor/rules (Rules-Template)
- [x] reference/, docs/ шаблоны
- [x] remote template для оновлення правил

### Փուլ 2. MVP (ընթացիկ)

- [x] Next.js 16, Prisma, Neon, monorepo
- [x] Կատալոգ, ապրանք, ատրիբուտներ
- [x] Auth (JWT), զամբյուղ
- [x] Instant search (Prisma) որոնում
- [x] Checkout, վճարումներ (Ameriabank, Idram, Telcell, FastShift)
- [x] EHDM (ֆիսկալ կտրոն) — ինտեգրացիա ecrm.taxservice.am, ցուցադրում ադմին/կլիենտ
- [x] Admin product labels — ավելացվել է label image upload և card-ի վրա առանձին image position
- [ ] Ադմին-պանել (ապրանքներ/պատվերներ)
- [ ] i18n/SEO ամրապնդում

---

## 📋 ՀԱՋՈՐԴ ԱՌԱՋԱԴՐԱՆՔՆԵՐ

1. [ ] Ավարտել checkout, վճարումների ինտեգրացիա
2. [ ] Ադմին-ֆունկցիաներ
3. [ ] Lint/format ամբողջ նախագծում, CI (optional)
4. [ ] .env.example ամբողջական, production դեպլոյ ստուգում

---

Պլան մաքրության — docs/CLEANUP_PLAN.md. Տեխզադրանք — docs/BRIEF.md. Տեխ. քարտ — docs/TECH_CARD.md.
