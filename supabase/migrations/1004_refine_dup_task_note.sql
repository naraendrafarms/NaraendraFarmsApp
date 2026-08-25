UPDATE public.tasks
SET description = description || E'\n\nREFINEMENT 2026-08-25: F22''s 11 flagged rows split further -- 6 were genuinely the double-subtraction bug and are now fixed; the remaining 5 (2026-05-15/16/17/18 and 2026-06-29) already had opening=0, mortality=0, closing=0 with only trcull/transfer holding a large matching value -- these are legitimate shed-closure log entries (all birds already moved out earlier; the row just records the final transfer-out figure for the books) and were correctly left untouched. Applying the opening-trcull-mortality formula there would have forced a negative closing, which is why the fix migration did not (and should not) touch them.'
WHERE task_type='development' AND title = 'Audit: same bird movement double-written into trcull/transfer/cull columns (87 rows)';

SELECT 'note_updated' AS chk, count(*)::int AS rows
FROM public.tasks WHERE task_type='development' AND title = 'Audit: same bird movement double-written into trcull/transfer/cull columns (87 rows)';
