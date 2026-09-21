-- What the 102 remaining unlinked bank rows are, recorded so it is not left in
-- a chat message. INSERT only, guarded by title. No live row is touched.

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   'About 28 bank entries carry a party but were never applied to an invoice',
   'WAITING ON YOU - bookkeeping, not a bug, and NOT safe to automate. Measured 21/09/2026 after the 7 HE Egg Sale receipts were linked, which is why the count is 102 now and not the 109 reported earlier. Of 518 bank rows, 102 carry no link of any kind. FIFTY-SEVEN OF THOSE ARE CORRECT AS THEY ARE: no party at all, worth Rs 2,46,29,742, being Bank Charges, Cash Withdrawal, Electricity, Salary, Salary Payment, Salary Return and an internal transfer - none of them has an invoice to point at and none ever will. THE OTHER 45 CARRY A PARTY and are the real question. Of those, 21 are Credits against a buyer who still has an OPEN HE DISPATCH, 7 are Credits against a buyer with an open NHE sale, and 4 are Debits against a supplier with an OPEN BILL - those look like money received or paid that was never applied to the invoice it belongs to. The rest have a party but nothing open against them, so they may be advances or invoices settled another way. BY VALUE the biggest groups are Vendor Payment 18 rows Rs 1,58,60,000 and Customer Receipt 25 rows Rs 88,30,000. WHY THIS IS NOT BEING AUTOMATED: the 7 that were repaired carried their DC number in the description, so each could be matched to exactly one dispatch and checked against its recorded receipt before writing. These do not. Guessing which invoice a receipt belongs to would silently mark the wrong one paid, and on Rs 1.58 crore of vendor payments that is not a risk worth taking to save clicks. THE RIGHT WAY IS THE APP: Accounts - Bank Ledger, open the entry, pick the party and tick the invoice or bill it settled. The invoice picker now has a search box for buyers with many open invoices. ALSO WORTH A LOOK, NOT A CLAIM: Sri Shiva Corporation and Radhakrishna Marketing each show 3 unlinked Debits totalling Rs 76,20,000 - the same count and the same figure. That may be coincidence of rounding, or the same payments recorded against two party names. It was not investigated and nothing was changed.',
   'Accounts', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT status, priority, left(title, 55) AS title
FROM public.tasks
WHERE task_type = 'development' AND title LIKE 'About 28 bank entries%';
