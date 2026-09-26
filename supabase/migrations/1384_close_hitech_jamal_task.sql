-- The Hitech/Jamal question is answered and the money is applied, so the task
-- must say so. Rows copied to a backup table before the update.
CREATE TABLE IF NOT EXISTS public.tasks_backup_1384 AS
SELECT * FROM public.tasks
 WHERE task_type = 'development' AND title LIKE 'Hitech and Jamal: nothing is unlinked%';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks_backup_1384 TO anon, authenticated, service_role;

SELECT 'backedUp=' || COUNT(*) AS backup_rows FROM public.tasks_backup_1384;

UPDATE public.tasks
   SET status = 'done',
       description = description
         || ' --- RESOLVED 26/09/2026, and my first answer on it was WRONG. I reported'
         || ' "nothing is unlinked" from a query that JOINED bank_transactions to parties on'
         || ' party_id, so imported rows with a NULL party could never appear - and more to the'
         || ' point the app''s bank ledger began 02/04/2026 while every unpaid invoice was dated'
         || ' 18/08/2025 to 29/03/2026. The receipts were not missing; the YEAR was never'
         || ' imported. The owner supplied the Kotak FY25-26 statement, which went in as 957'
         || ' transactions (1380), and the credits were then applied to invoices (1382) using'
         || ' his own cut-offs - Jamal from 18/08/2025, Hitech from 01/09/2025 for Flock 19.'
         || ' RESULT, verified in 1383: all 217 Hitech invoices now Received with Rs 0 due,'
         || ' down from Rs 26.47 cr. Jamal 4 Received and 1 Partial with Rs 11,40,087 genuinely'
         || ' still owed - his Rs 20.72 L of receipts cannot cover Rs 32.12 L. The 31 Hitech'
         || ' credits before 01/09/2025, Rs 6.08 cr, are deliberately left unapplied: they'
         || ' pre-date Flock 19. overApplied=0 and anyNegativeDue=0, so nothing was counted'
         || ' twice.'
 WHERE task_type = 'development' AND status <> 'done'
   AND title LIKE 'Hitech and Jamal: nothing is unlinked%';

SELECT 'done=' || COUNT(*) FILTER (WHERE status='done')
    || ' open=' || COUNT(*) FILTER (WHERE status <> 'done') AS task_state
  FROM public.tasks
 WHERE task_type='development' AND title LIKE 'Hitech and Jamal: nothing is unlinked%';
