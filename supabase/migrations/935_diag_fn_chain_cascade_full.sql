-- Migration 935 (READ ONLY): full fn_chain_cascade definition, chunked so the
-- complete function body is visible (previous attempt was truncated at 600 chars).
DO $$
BEGIN
  EXECUTE 'DROP TABLE IF EXISTS public._fndef';
  EXECUTE 'CREATE TABLE public._fndef (rn serial PRIMARY KEY, chunk text)';
  INSERT INTO public._fndef(chunk)
  SELECT substring(pg_get_functiondef('public.fn_chain_cascade'::regproc) FROM (n*400+1) FOR 400)
    FROM generate_series(0, (length(pg_get_functiondef('public.fn_chain_cascade'::regproc))/400)) AS n;
END $$;

SELECT 'chunk1' AS chk, chunk AS rows FROM public._fndef WHERE rn=1;
SELECT 'chunk2' AS chk, chunk AS rows FROM public._fndef WHERE rn=2;
SELECT 'chunk3' AS chk, chunk AS rows FROM public._fndef WHERE rn=3;
SELECT 'chunk4' AS chk, chunk AS rows FROM public._fndef WHERE rn=4;
