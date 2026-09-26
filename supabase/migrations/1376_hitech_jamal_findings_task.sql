-- INSERT only, guarded by title. Nothing changed or deleted.
INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   'Hitech and Jamal: nothing is unlinked - Rs 26.82 cr of receipts were never entered',
   'WAITING ON YOU - measured 26/09/2026 (1373, 1374, 1375, read only). The owner asked to LINK Hitech and Jamal receipts to their Flock 19/20 sales. THERE IS NOTHING TO LINK: unlinked bank credits = 0 and unlinked cash receipts = 0 for both buyers. Every rupee of their money already in the app - 59 bank credits totalling Rs 14.50 cr, all Hitech - is ALREADY attached to a voucher. THE REAL POSITION on Flocks 19 and 20: Hitech F19 110 invoices Rs 17.57 cr still due; Hitech F20 107 invoices Rs 8.94 cr still due; Jamal F19 7 invoices Rs 32.1 L still due; Jamal has NO receipts recorded at all, not one. 144 invoices carry no receipt whatsoever, dated 18/08/2025 to 29/03/2026, Rs 26.82 cr in total. So the gap is receipts NEVER ENTERED, not receipts attached to the wrong invoice - a different job with a different fix. TDS IS ALREADY HANDLED THE RIGHT WAY, so no change is needed there: of the 79 invoices that carry TDS and have a receipt, amount_received equals amount MINUS TDS in all 79 and equals the gross in none. The app therefore expects the NET figure that actually reached the bank, with the TDS held separately on the invoice. WHAT IS NEEDED FROM YOU: say whether the Rs 26.82 cr is genuinely still owed, or whether it was received and never keyed in. If received, the bank statement or payment advice - date, net amount credited, UTR - is enough for me to enter them against the right invoices, oldest first. Nothing has been written or linked.',
   'Accounts', 'high'),
  (
   'A stray duplicate buyer exists: "Hitech Hatch Fresh Private Limited Advance"',
   'OPEN - small, and NOT touched because merging or deleting a party is exactly the kind of write that needs your yes first. Found 26/09/2026 while answering the Hitech linking question. Four parties match the name search: Hitech Hatch Fresh Private Limited; Hitech Hatch Fresh Private Limited ADVANCE; Jamal Agro Industries Private Limited; and Venkateswara B. V. Biocorp Pvt Ltd - Hitech Div, which is a different company that merely contains the word. MEASURED: the "... Advance" record holds ZERO advance balance, ZERO dispatches and ZERO bank credits - it is doing nothing at all. It was presumably created to hold advances before Buyer Advances existed. WHY IT MATTERS: a near-duplicate name is how money gets recorded against the wrong buyer, and it makes every by-party report ambiguous to read. Tell me to merge it into the real Hitech record or to delete it and I will, with the rows copied to a backup table first.',
   'Accounts', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT 'seeded=' || COUNT(*) AS findings
  FROM public.tasks WHERE task_type='development'
   AND (title LIKE 'Hitech and Jamal: nothing is unlinked%' OR title LIKE 'A stray duplicate buyer exists%');

SELECT 'openDevTotal=' || COUNT(*) AS remaining
  FROM public.tasks WHERE task_type = 'development' AND status <> 'done';
