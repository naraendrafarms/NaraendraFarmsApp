SELECT substring(pg_get_functiondef(p.oid) FROM position('closing_female' IN pg_get_functiondef(p.oid)) - 50 FOR 400) AS rows
FROM pg_proc p
WHERE p.proname = 'fn_chain_daily_opening';
