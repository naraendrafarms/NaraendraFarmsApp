-- INSERT only, guarded by title. Nothing existing is changed or deleted.
INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   'Role-aware dashboards, and wire up the seven new roles',
   'DEFERRED BY YOU on 22/09/2026 - roles were seeded first, deliberately, so nobody working today was disturbed. WHAT IS DONE: migration 1348 added doctor, hatchery_manager, feed_mill_manager, store_keeper, purchase_officer, hr_officer and auditor to both CHECK constraints and seeded 17 permission rows each (119 total, verified in the job log, Errors: 0). No existing profile or permission was touched. WHAT IS NOT DONE, and nothing works until it is: (1) the Role type in src/lib/auth.ts still lists only the seven OLD roles, so the Admin Centre dropdown cannot offer the new ones and NO USER CAN BE ASSIGNED ONE YET - the seeded rows sit unused; (2) the can.* helpers in the same file need the new roles - in particular purchase_officer must get editPurchase but NOT viewBankLedger and NOT approvePayment, which is the entire reason for separating them from the accounts role; (3) THE DASHBOARD. src/pages/dashboard/Dashboard.tsx is 350 lines and the word "role" does not appear in it. Every role sees the same six things including Total HE Revenue and the electricity bills, so a shed supervisor sees company revenue on login. THE FIX AGREED: one dashboard that assembles itself from widgets, each tagged with the module it needs, rendered only if the signed-in role holds that module - so it reuses role_permissions rather than inventing a second set of rules, and a new role gets a sensible dashboard with no new code. Widgets must also respect useFarmScope so a site in-charge sees THEIR site, not the company. TWO KNOWN COMPROMISES IN THE SEEDED MATRIX, both fixable by splitting a module the way line_master was split out of masters: store_keeper holds purchase=full because GRN lives in that module, so they can see PO prices (they cannot approve a payment or open the bank ledger); and doctor holds masters=read_only, so the vet can see the vaccination schedule but not maintain it - ask the owner whether the vet owns that schedule. ALSO WORTH KNOWING: shed_supervisor carries only 2 permission rows against 17 for every other role. That is by design - it fails closed on everything else - but the Admin Centre grid will show blanks for it. EVERY CELL IS EDITABLE from Admin Centre without a deploy; the seed is a starting point, not a commitment.',
   'Housekeeping', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT left(title, 55) AS title, status, team FROM public.tasks
 WHERE task_type = 'development' AND title LIKE 'Role-aware dashboards%';
