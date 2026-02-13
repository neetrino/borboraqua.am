# Архив документов и разовых SQL

- **legacy-app/** — бывшая папка `app/` из корня (обёртка api+web; apps/api в проекте нет).

Разовые SQL-скрипты, которые ранее лежали в корне проекта. Оставлены для истории. Схему БД меняем только через Prisma-миграции в `packages/db/prisma/migrations/`.

- `ADD_COLORS_COLUMNS.sql`
- `MIGRATE_ATTRIBUTE_VALUES_COLORS.sql`
- `QUICK_FIX_COLORS.sql`
- `QUICK_FIX_MIGRATION.sql`
- `run-migration.sql`
