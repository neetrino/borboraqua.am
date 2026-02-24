# Telcell — աշխատող vs չաշխատող URL (տարբերություններ)

## 1. Աշխատող (LIVE)
```
https://telcellmoney.am/invoices?issuer=ssupport@neetrino.com&currency=֏&action=PostInvoice&lang=am&price=130&product=bmVldHJpbm8=&issuer_id=ODE1NjI2MjU5NjIx&valid_days=1&security_code=20d83bf2796aa89df1e9bbab5b84bc6a
```

## 2. Չաշխատող (TEST — մեր request)
```
https://telcellmoney.am/proto_test2/invoices?action=PostInvoice&issuer=ssupport%40neetrino.com&currency=֏&price=120&product=T3JkZXIgUDExOQ%3D%3D&issuer_id=Y21tMHR2OWV6MDAwM24zZHVycW4wYjF0dQ%3D%3D&valid_days=1&lang=en&security_code=90ac9a0fcc086c80869d3543a3d19705
```

## Տարբերություններ

| Պարամետր | աշխատող (LIVE) | չաշխատող (TEST) |
|----------|-----------------|-------------------|
| **URL** | `telcellmoney.am/invoices` | `telcellmoney.am/proto_test2/invoices` |
| **product** (decode) | `neetrino` | `Order P119` |
| **issuer_id** (decode) | `815626259621` (թվային) | `cmt0v9ez0003n3durqn0b1tu` (CUID) |
| **lang** | `am` | `en` |
| **price** | 130 | 120 |

## Հնարավոր պատճառներ

1. **Test vs Live** — աշխատողը **live** endpoint է, չաշխատողը **test** (`proto_test2`): test environment-ը կարող է այլ validation ունենալ կամ merchant-ի test ռեժիմը չլինի ակտիվ։
2. **issuer_id ֆորմատ** — աշխատող օրինակում `issuer_id`-ն decode արված **թվային** string է (`815626259621`), մեր request-ում — **CUID** (`cmt0v9ez...`): եթե Telcell test-ը ակնկալում է միայն թվեր, մեր արժեքը կարող է մերժվել։
3. **product** — աշխատողում կարճ տեքստ (`neetrino`), մերում `Order P119`; հազիվ թե դա պատճառ է, բայց հնարավոր է test-ում սահմանափակում լինի։

## Խորհուրդ

- **Կարճաժամկետ.** Օգտագործել **live** (ոչ test): `.env`-ում `TELCELL_TEST_MODE=false` և live credentials (`TELCELL_LIVE_SHOP_ID`, `TELCELL_LIVE_SHOP_KEY`), որ redirect-ը գնա `telcellmoney.am/invoices`։
- **Support.** Հարցնել. (1) Test (`proto_test2`) environment-ում ինչու request-ը չի անցնում; (2) `issuer_id`-ի համար ակնկալվում է՞ միայն թվային արժեք, թե CUID/string-ը ընդունելի է։
