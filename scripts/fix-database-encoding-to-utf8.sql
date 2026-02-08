-- Fix Database Encoding to UTF-8
-- This script helps convert database from WIN1251 to UTF-8 encoding
-- 
-- WARNING: This requires recreating the database. Make sure to backup your data first!
--
-- Usage:
-- psql -U postgres -f scripts/fix-database-encoding-to-utf8.sql

-- Step 1: Check current database encoding
SELECT 
  datname,
  pg_encoding_to_char(encoding) as encoding
FROM pg_database 
WHERE datname = current_database();

-- Step 2: If database encoding is not UTF8, you need to:
-- 
-- 1. Create a backup of your current database:
--    pg_dump -U postgres -F c -f backup.dump your_database_name
--
-- 2. Create a new database with UTF-8 encoding:
--    CREATE DATABASE your_database_name_utf8 
--    WITH ENCODING 'UTF8' 
--    LC_COLLATE='en_US.UTF-8' 
--    LC_CTYPE='en_US.UTF-8'
--    TEMPLATE template0;
--
-- 3. Restore data to the new database:
--    pg_restore -U postgres -d your_database_name_utf8 backup.dump
--
-- 4. Update your DATABASE_URL to point to the new database
--
-- OR use pg_dump with encoding conversion:
--    pg_dump -U postgres -E UTF8 -F c -f backup.dump your_database_name
--    pg_restore -U postgres -d your_database_name_utf8 backup.dump

-- Step 3: For Neon or managed PostgreSQL services:
-- You may need to create a new database through the dashboard
-- and then migrate the data using the steps above.






















