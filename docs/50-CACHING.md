# Cache-ի տեսակները և կապը SSR / API-ի հետ

## Համառոտ

- **Server-side rendering (SSR)** — *որտեղ* էջը հաշվարկվում է (սերվերում). cache-ի տեսակ չէ.
- **Next.js Data Cache (unstable_cache)** — cache է *տվյալի* համար (ֆունկցիայի արդյունք). Սահմանափակում: **≤ 2MB** մեկ entry.
- **API caching** — եթե տվյալը գալիս է API route-ից (օրինակ `/api/v1/products`), cache-ը կարող է լինել HTTP headers (Cache-Control) կամ արտաքին (Redis, Vercel KV). **unstable_cache-ից այլ մեխանիզմ է.**

Դրանք **կապված են** նրանով, որ բոլորը նվազեցնում են բեռը/արագացնում պատասխանը, բայց **տարբեր շերտեր** են.

---

## 1. Server-side rendering (SSR)

- Next.js Server Component-ը սերվերում կանչում է `productsService.findAll()` (կամ այլ ֆունկցիա).
- Ամեն request-ում, **եթե cache չկա**, DB query է կատարվում.
- SSR = «էջը հաշվարկվում է սերվերում», ոչ թե cache-ի անուն.

---

## 2. Next.js Data Cache — `unstable_cache`

- **Ինչ է.** Cache-ում է *ֆունկցիայի արդյունքը* (օրինակ `getFeatured()`). Նույն cache key-ով հաջորդ request-ը ստանում է պահված արժեքը, **DB չի կանչվում**.
- **Սահման.** Մեկ entry-ի չափը **≤ 2MB**. Ավելի մեծ արժեք → «items over 2MB can not be cached» սխալ.
- **Օրինակ (home page).**  
  - Featured/kids ապրանքները `productsService.findAll(..., { listOnly: true })` — **listOnly** վերադարձնում է միայն անհրաժեշտ դաշտեր (id, slug, title, price, image, inStock, brand …), payload-ը մնում է 2MB-ից ցածր → **unstable_cache** կարող է օգտագործվել.
  - Առանց listOnly ամբողջ օբյեկտները (labels, colors, categories …) մեծ payload են տալիս → cache-ը չի աշխատի.
- **Կապ SSR-ի հետ.** SSR-ը որոշում է, որ էջը սերվերում է render լինում. `unstable_cache` որոշում է, արդյոք *տվյալը* cache-ից է գալիս, թե թարմ DB query-ից.

---

## 3. API caching (API route-ի cache)

- Եթե client-ը (կամ այլ սերվիս) տվյալը **API-ից** է վերցնում (օրինակ `GET /api/v1/products`), ապա.
  - **Next.js Data Cache** — API route-ի *ներսում* կարող ես օգտագործել `unstable_cache` (նույն 2MB սահմանով).
  - **HTTP cache** — API-ի response-ում `Cache-Control` headers (browser/CDN cache).
  - **Արտաքին cache** — Redis, Vercel KV և այլն (API route-ը նախ ստուգում է cache, ապա DB).
- **Կապ.** API caching-ը **unstable_cache-ից տարբեր** մեխանիզմ է (տարբեր շերտ), բայց նույն նպատակով — պակաս DB/load, արագ պատասխան.

---

## Ամփոփ աղյուսակ

| Ինչ | Շերտ | Կապ |
|-----|------|-----|
| SSR | Որտեղ render է (սերվեր) | Cache չէ; տվյալը կարող է գալ cache-ից կամ DB-ից |
| unstable_cache | Next.js data cache (ֆունկցիայի արդյունք) | ≤ 2MB; օգտագործվում է Server Component-ում (կամ API route-ում) |
| API cache | HTTP headers / Redis / KV | API route-ի response-ի cache; առանձին unstable_cache-ից |

---

**Նախագծում.** Home page-ի featured/kids ապրանքները `listOnly: true` + `unstable_cache` — payload-ը փոքր, cache-ը աշխատում է. Ամբողջ ապրանքի (product page) տվյալը cache չենք դնում Next.js data cache-ում (մեծ payload).
