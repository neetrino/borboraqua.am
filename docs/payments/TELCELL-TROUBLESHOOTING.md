# Telcell — եթե request-ը աշխատում է, ինչ ստուգել

Եթե support-ը հաստատել է, որ **redirect URL / PostInvoice request-ը ճիշտ է**, ապա խնդիրը հնարավոր է հետևյալից.

## 1. RESULT_URL (callback)

Telcell-ը **վճարումից հետո** մեր սերվերին GET/POST request է ուղարկում — status (PAID / failed).

- **Մեր endpoint:** `https://<ձեր-դոմեն>/wc-api/telcell_result`
- **Հարց support-ին.**  
  - Test (proto_test2) environment-ում RESULT_URL-ը գրանցված է՞ ձեր դոմենի վրա։  
  - Եթե աշխատում եք localhost-ով — Telcell-ը RESULT_URL չի կարող հասնել, order-ը միշտ կմնա pending։  
  - Պահանջել հաստատել, թե **ճիշտ ինչ URL** են նրանք օգտագործում RESULT_URL-ի համար (GET/POST, query vs body).

## 2. REDIRECT_URL

Վճարումից հետո օգտատերը redirect է արվում մեր կողմի URL-ի։

- **Մենք ակնկալում ենք** Telcell-ը redirect արած լինի այստեղ:  
  `https://<ձեր-դոմեն>/wc-api/telcell_redirect?issuer_id=...` (կամ `order=...`).
- Այդ route-ը օգտատիրոջը ուղարկում է `/checkout/success?order=...`.
- **Հարց support-ին.**  
  REDIRECT_URL-ը նրանց կողմից գրանցված է՞ ձեր դոմենի վրա (նույն URL-ը, ինչ մենք նշել ենք)։

## 3. Test vs Live

- Ձեր URL-ը **proto_test2** (test) է։  
- Test environment-ում Telcell-ը կարող է **չուղարկել** RESULT_URL կամ օգտագործել **այլ shop_id/shop_key**։
- **Հարց support-ին.**  
  Test mode-ում RESULT_URL և REDIRECT_URL call-երն իրականում կատարվում են՞, և եթե այո — որ URL-ներով (full URL)։

## 4. Ինչ է տեսնում օգտատերը

- **Telcell-ի էջում** error — խնդիրը Telcell-ի validation/UI.
- **Վճարել է, բայց order-ը մեր կողմում դեռ pending** — ամենից հաճախ RESULT_URL-ը մեզ չի հասնում կամ checksum-ը չի համընկնում (support-ից պարզել checksum formula-ն).
- **Վճարել է, redirect արել, բայց «success» էջը սխալ/դատարկ** — REDIRECT_URL կամ query params (issuer_id/order).

## Կարճ ամփոփ

| Խնդիր | Ուր նայել |
|--------|------------|
| Request-ը ճիշտ է (support ասաց) | ✅ URL/params — OK |
| Order-ը չի դառնում paid | RESULT_URL, checksum formula, test vs live |
| Օգտատերը չի վերադառնում կամ wrong page | REDIRECT_URL, APP_URL |
| Սխալ Telcell-ի էջում | Support + նրանց logs |
