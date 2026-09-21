-- The party side of "paid by someone else" shipped in 1313. The partner side
-- did not, and should not be left in a chat message. INSERT only, guarded by
-- title. No live row is touched.

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   'A challan paid by a PARTNER still has no ledger to appear in',
   'OPEN - mine to build, but it needs a decision from you first. Migration 1313 made a statutory challan paid by another COMPANY appear in that company party ledger as a Statutory Challan credit, so the advance sent to them is used up as they spend it. A challan paid by a PARTNER cannot do the same, because the app has a Bank Ledger, an Imprest Ledger and a Party Ledger and NO PARTNER LEDGER at all. The Mark Remitted form offers partners in the same dropdown as companies, so a challan CAN be recorded against a partner today and would then sit in exactly the position the company ones were in before 1313 - stored, shown as "via name" on the Statutory page, and invisible everywhere else. MEASURED 21/09/2026: nothing is affected right now. All 4 challans recorded as paid by someone else are against a party (Hitech Hatch Fresh Private Limited Advance), none against a partner, and bank_transactions.partner_id - added by migration 590 for exactly this - has never been written to on any of the 517 bank rows. So this is a gap waiting to be walked into, not a live problem. DECISION NEEDED: whether partner money movements should get a proper Partner Ledger of their own (transfers out, challans paid, remuneration, drawings), or whether partners should simply stop being offered as challan payers so the question cannot arise. NOTHING BUILT EITHER WAY until you say which.',
   'Accounts', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT status, priority, left(title, 55) AS title
FROM public.tasks
WHERE task_type = 'development' AND title LIKE 'A challan paid by a PARTNER%';
