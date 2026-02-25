# Telcell — PostInvoice URL (test և live)

## Telcell-ի պահանջ

**Test և live ռեժիմներն երկուսն էլ պետք է ուղարկեն request նույն endpoint-ին:**

- **Ճիշտ:** `https://telcellmoney.am/invoices?...`
- **Սխալ:** `https://telcellmoney.am/proto_test2/invoices?...` — `proto_test2` path-ը **ոչ** պետք է օգտագործվի։

Telcell support-ը հաստատել է, որ միայն `telcellmoney.am/invoices` է օգտագործվում (և test, և live).

## Կոդում

- `apps/web/lib/payments/telcell/constants.ts` — `TELCELL_API_BASE_URL = "https://telcellmoney.am/invoices"`; test/live credentials-ը տարբեր են (env), բայց URL-ը միշտ նույնն է։

## Պատմական նշում (նախկին խնդիր)

Նախկինում կոդում test ռեժիմի համար օգտագործվում էր `proto_test2/invoices`, ինչը Telcell-ի կողմից **չի** ակնկալվում։ Դա ուղղված է — այժմ երկու ռեժիմներն էլ օգտագործում են `https://telcellmoney.am/invoices`։
