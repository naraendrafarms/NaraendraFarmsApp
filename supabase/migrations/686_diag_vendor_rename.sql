-- Diagnostic only. A party was renamed from
--   "Venkateshwara B.V.Biocorp Pvt Ltd. Bio-Tech Division"  (GST 27SLHYD21/761)
-- to
--   "Ventri Biologicals Division of Venkateshwara Hatcheries Private Limited"
-- and Pending Payments picked it up while Party Ledger and other places did not.
--
-- The likely cause is that only SOME tables link to parties by id; others store
-- the vendor NAME as text, and a rename cannot reach those. Rather than guess
-- which, every text-ish column in the schema whose name suggests it holds a
-- party name is searched for the old wording, and the counts reported.
--
-- Read-only: this only counts. Nothing is renamed here.
SELECT COALESCE(string_agg(hit, ' | ' ORDER BY hit), 'NO OLD-NAME TEXT ANYWHERE') AS old_name_locations
FROM (
  SELECT c.table_name || '.' || c.column_name || ' = ' ||
         (xpath('/row/c/text()', query_to_xml(
            format('SELECT COUNT(*) AS c FROM public.%I WHERE %I ILIKE %L',
                   c.table_name, c.column_name, '%Biocorp%'),
            false, true, '')))[1]::text AS hit
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_schema = c.table_schema AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
  WHERE c.table_schema = 'public'
    AND c.data_type IN ('text','character varying')
    AND (c.column_name ILIKE '%name%' OR c.column_name ILIKE '%party%'
         OR c.column_name ILIKE '%vendor%' OR c.column_name ILIKE '%description%'
         OR c.column_name ILIKE '%remarks%' OR c.column_name ILIKE '%narration%')
) x
WHERE hit NOT LIKE '% = 0';

-- The same for the NEW name, so it is clear which places already moved.
SELECT COALESCE(string_agg(hit, ' | ' ORDER BY hit), 'NEW NAME NOWHERE') AS new_name_locations
FROM (
  SELECT c.table_name || '.' || c.column_name || ' = ' ||
         (xpath('/row/c/text()', query_to_xml(
            format('SELECT COUNT(*) AS c FROM public.%I WHERE %I ILIKE %L',
                   c.table_name, c.column_name, '%Ventri%'),
            false, true, '')))[1]::text AS hit
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_schema = c.table_schema AND t.table_name = c.table_name AND t.table_type = 'BASE TABLE'
  WHERE c.table_schema = 'public'
    AND c.data_type IN ('text','character varying')
    AND (c.column_name ILIKE '%name%' OR c.column_name ILIKE '%party%'
         OR c.column_name ILIKE '%vendor%' OR c.column_name ILIKE '%description%'
         OR c.column_name ILIKE '%remarks%' OR c.column_name ILIKE '%narration%')
) y
WHERE hit NOT LIKE '% = 0';

-- How many party rows carry either wording -- one renamed row, or two rows that
-- have both been in use, changes the fix entirely.
SELECT COALESCE(string_agg(id || ' = ' || name || ' [' || COALESCE(type,'?') || ']', ' | '), 'NO MATCH') AS party_rows
FROM public.parties
WHERE name ILIKE '%Biocorp%' OR name ILIKE '%Ventri%' OR name ILIKE '%Venkateshwara%' OR name ILIKE '%Venkateswara%';
