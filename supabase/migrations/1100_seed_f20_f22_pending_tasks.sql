-- Migration 1100: log everything left open after the 2026-08-26 Flock 20
-- phantom-row fix (migration 1098). Nothing here is done yet.
INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT * FROM (VALUES
  ('Flock 20: record the 9 missing shed transfers in flock_transfers',
   'WAITING ON YOU (shed mapping). Flock 20 has ZERO rows in flock_transfers, which is the root cause of the 25/08/2026 phantom-row incident: with no transfer recorded, a vacated shed keeps its last closing forever and stays in Bulk Daily Entry. Extracted 9 balanced transfer events from Flock_20.xlsx (F-20 sheet, "Received /Transfer" col; value is OUT at source, IN at destination): 30/07/2025 G7>G2 20F; 06/09/2025 G7>G2 90F; 24/09/2025 G1,G3,G4>Bpet Sh1,Sh2 11200F; 25/09/2025 G4,G5,G6>Bpet Sh2-4 11200F; 27/09/2025 G2,G6,G7>Bpet Sh4-7 8960F; 28/09/2025 G7>Bpet Sh1-7+G2 3742F/8254M; 11/11/2025 Bpet Sh1-7>G2 104F/67M; 12/11/2025 G2>Bpet Sh1-7 207F/27M; 26/12/2025 Kpally-G2>Bpet Sh1-7 355F/56M. BLOCKER: Excel shed labels (B1-B5, G1-G7, Kpally-G2, 1-7) do not map 1:1 to app shed numbers. Confirmed by value-match: app Kethireddypally Sh10 = Excel B1 (10701 on 21/07/2025), Sh11 = B2 (9040). Need the rest of the mapping, especially which app shed is Excel G1-G7 and Kpally-G2. Also unexplained: on 26/12/2025 Excel shows 355F leaving Kpally-G2 but the app row for Kethireddypally Sh2 that date has opening_female=1029, transfer_female=0, closing 1029/34.',
   'development', 'Flocks', 'high', 'pending'),
  ('Flock 20: bird/cull sales short by about Rs 1.6 lakh vs Excel',
   'WAITING ON YOU (flock attribution). App has 172 bird-sale rows totalling Rs 58,504 for Flock 20, first sale 09/11/2025, last 24/08/2026, all typed as sale_type=bird_sale. Flock_20.xlsx "NHE Sales" sheet has 159 bird lines totalling Rs 2,20,957 running 01/08/2025 to 14/06/2026 - so the app has NOTHING before 09/11/2025 and is roughly Rs 1,62,000 short. The app also never uses bird_lame / bird_sex_error / bird_cull / bird_weak even though the Excel distinguishes "Lame Birds" from "Sex Error Birds". BLOCKER: that Excel sheet is a mixed DC register covering more than one flock (it contains an F-17 egg line) and non-bird items (gas cylinders), so the 159 lines cannot be attributed to Flock 20 without a rule. Need to know how to tell which flock each DC line belongs to before importing anything, otherwise this would invent revenue.',
   'development', 'Accounts', 'high', 'pending'),
  ('Guard: stop vacated sheds reappearing in Bulk Daily Entry',
   'OPEN (mine to do). Migration 985 added a flock_sheds link for Flock 20 / Kethireddypally Shed 2 to make old data visible; that put the shed back into the Bulk Daily Entry grid for EVERY date, and saving the grid on 25/08/2026 wrote a row into 5 sheds the flock had left in 2025 (fixed by migration 1098). Two gaps remain: (1) flock_sheds has NO audit trail at all - confirmed zero rows in audit_log for that table ever, because it has a composite PK and the audit trigger keys on a single record_id, so there is no record of who linked/unlinked a shed; (2) nothing stops this recurring - BulkDailyEntry.tsx builds its shed list from flock_sheds UNION shed_allocations UNION flock_transfers.to_shed_id with no date filter, so once the transfers above are recorded the vacated sheds will reappear via to_shed_id. Needs either a date-bounded shed list or an occupancy check before the grid writes a row.',
   'development', 'Flocks', 'high', 'pending'),
  ('Feed: L1 feed type has no active formula so it costs Rs 0/kg',
   'OPEN (mine to do, deferred). Checked during the 25/08/2026 feed-type work: feed_types L1 has 0 active rows in feed_formulas, while L2 has 2 and L3 has 3. useFeedRates.ts prices a feed type as the weighted average of its ACTIVE formulas, so every kg of L1 is currently costed at Rs 0. Flock 20 consumed 2,239 kg of L1 across 3 dates between 06/06/2026 and 09/08/2026, so that feed is free in every P&L and feed-cost figure. Needs an active L1 formula (or a decision that L1 is retired and those 3 rows should be a different code).',
   'development', 'Feed', 'normal', 'pending'),
  ('Flock 19: user reported a problem that was never described',
   'WAITING ON YOU (detail). On 26/08/2026 you said a Flock 19 problem had been created and that you had not asked for it. I asked twice which page/report and what looks wrong and we moved on to Flock 20 before you answered, so it is still unlogged. The only Flock 19 change I made in that session was migration 1067, which normalised feed_type_m from "Male" to "MALE" on 1197 rows to match every other flock - that was agreed at the time. Earlier sessions did much more to Flock 19 (see commits e6c2ab9, 0c10f36, a1583c0, 842). Need to know the symptom before anything is investigated or reverted.',
   'development', 'Flocks', 'high', 'pending')
) AS v(title, description, task_type, team, priority, status)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT 'f20_f22_tasks_seeded' AS chk, count(*)::int AS rows
FROM public.tasks WHERE task_type='development' AND status='pending';
