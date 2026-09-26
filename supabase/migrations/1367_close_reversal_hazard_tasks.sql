-- Both reversal hazards shipped today, so the list must say so. An untrue
-- pending list is worse than no list.
--
-- BACKUP FIRST, in this same migration, before any write. 2 rows change.
CREATE TABLE IF NOT EXISTS public.tasks_backup_1367 AS
SELECT * FROM public.tasks
 WHERE task_type = 'development'
   AND ( title LIKE 'Reversing a receipt to Pending%'
      OR title LIKE 'The single Receive Payment window wipes%' );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks_backup_1367 TO anon, authenticated, service_role;

-- Show what is about to change, and what it held.
SELECT 'backedUp=' || COUNT(*) AS backup_rows FROM public.tasks_backup_1367;

UPDATE public.tasks
   SET status = 'done',
       description = description
         || ' --- DONE 26/09/2026. Shipped as page code only, no migration, because every column'
         || ' involved already existed. The Amount box now clears and locks when Status is set to'
         || ' Pending, and the save nulls amount_received, received_date, utr_ref and'
         || ' bank_account_id together, so a reversal leaves nothing behind. An advance-mode'
         || ' reversal routes down the normal path so the advance is returned, not re-consumed.'
         || ' The instalment guard counts RECEIPTS not rows - distinct ledger dates - because a'
         || ' split receipt legitimately writes one cash row and one bank row on the same date,'
         || ' and 37 NHE sales plus 2 HE dispatches are that shape; a row count would have blocked'
         || ' all 39. A red warning names the instalments and the save refuses until acknowledged.'
 WHERE task_type = 'development'
   AND status <> 'done'
   AND ( title LIKE 'Reversing a receipt to Pending%'
      OR title LIKE 'The single Receive Payment window wipes%' );

-- Verify by name, so the answer cannot be truncated by the 5-row preview.
SELECT 'nowDone=' || COUNT(*) FILTER (WHERE status = 'done')
    || ' stillOpen=' || COUNT(*) FILTER (WHERE status <> 'done') AS closed_state
  FROM public.tasks
 WHERE task_type = 'development'
   AND ( title LIKE 'Reversing a receipt to Pending%'
      OR title LIKE 'The single Receive Payment window wipes%' );

SELECT 'openDevTotal=' || COUNT(*) AS remaining
  FROM public.tasks WHERE task_type = 'development' AND status <> 'done';
