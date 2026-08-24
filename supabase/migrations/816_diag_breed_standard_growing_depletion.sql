-- Migration 816 (READ ONLY): schema first, before importing anything.
SELECT 'schema' AS chk,
       (SELECT string_agg(column_name, ',' ORDER BY ordinal_position)
          FROM information_schema.columns
         WHERE table_schema='public' AND table_name='breed_standard') AS columns;
