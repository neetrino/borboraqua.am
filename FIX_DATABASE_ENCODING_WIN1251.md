# Ինչպես լուծել WIN1251 կոդավորման խնդիրը

## Խնդիր

Երբ փորձում եք պահպանել հայերեն տեքստ, ստանում եք սխալ:
```
character with byte sequence 0xd4 0xb2 in encoding "UTF8" has no equivalent in encoding "WIN1251"
```

**Պատճառ:** Ձեր PostgreSQL բազան ստեղծված է WIN1251 կոդավորմամբ, որը չի աջակցում հայերեն նիշերին:

## Լուծում

Պետք է ստեղծել նոր բազա UTF-8 կոդավորմամբ և տեղափոխել տվյալները:

### Քայլ 1: Ստեղծել բազայի backup

```bash
pg_dump -U postgres -F c -f backup.dump your_database_name
```

Կամ եթե օգտագործում եք Neon կամ այլ managed service:
- Գնացեք dashboard-ում
- Export/Backup բաժին
- Ստեղծեք backup

### Քայլ 2: Ստեղծել նոր բազա UTF-8-ով

#### Տեղական PostgreSQL-ի համար:

```sql
CREATE DATABASE your_database_name_utf8 
WITH ENCODING 'UTF8' 
LC_COLLATE='en_US.UTF-8' 
LC_CTYPE='en_US.UTF-8'
TEMPLATE template0;
```

#### Neon-ի համար:

1. Գնացեք Neon Dashboard
2. Ստեղծեք նոր database
3. Database-ը ավտոմատ կստեղծվի UTF-8-ով

### Քայլ 3: Restore տվյալները նոր բազայում

```bash
pg_restore -U postgres -d your_database_name_utf8 backup.dump
```

Կամ Neon-ի համար:
- Օգտագործեք Neon Dashboard-ի import գործառույթը
- Կամ `pg_restore` հրամանը

### Քայլ 4: Update DATABASE_URL

Ձեր `.env` ֆայլում կամ environment variables-ում:

```env
DATABASE_URL="postgresql://user:password@host:5432/your_database_name_utf8?client_encoding=UTF8"
```

**Կարևոր:** Ավելացրեք `&client_encoding=UTF8` պարամետրը:

### Քայլ 5: Ստուգել

```bash
npm run check:db-encoding
```

Պետք է տեսնեք:
```
Database Encoding: UTF8 ✅
Client Encoding: UTF8 ✅
```

### Քայլ 6: Test հայերեն տեքստով

Փորձեք ստեղծել ակնարկ հայերեն տեքստով - պետք է աշխատի առանց սխալների:

## Այլընտրանքային լուծում (անհրաժեշտության դեպքում)

Եթե չեք կարող ստեղծել նոր բազա, կարող եք փորձել օգտագործել base64 encoding-ը, բայց դա **չի խորհուրդվում**, քանի որ:
- Ավելի բարդ է
- Ավելի շատ տեղ է զբաղեցնում
- Դժվար է query-ներ գրել

## Հարցեր և պատասխաններ

**Q: Կարո՞ղ եմ փոխել գոյություն ունեցող բազայի կոդավորումը:**
A: Ոչ, PostgreSQL-ում չի կարելի փոխել բազայի կոդավորումը: Պետք է ստեղծել նոր բազա:

**Q: Կկորցնե՞մ տվյալները:**
A: Ոչ, եթե ճիշտ backup եք արել և restore եք արել:

**Q: Որքա՞ն ժամանակ կպահանջվի:**
A: Կախված է բազայի չափից: Փոքր բազաների համար մի քանի րոպե:

## Աջակցություն

Եթե խնդիրներ ունեք, ստուգեք:
1. `npm run check:db-encoding` - ստուգել կոդավորումը
2. `npm run migrate:db-to-utf8` - ստանալ migration հրահանգներ











