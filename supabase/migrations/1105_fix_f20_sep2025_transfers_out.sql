-- Migration 1105: Flock 20 Sep-2025 shed moves were recorded as receipts at the
-- SOURCE shed instead of transfers out, so closings roughly doubled instead of
-- falling to zero. Bodjanampet-1's receiving side is already correct and is not
-- touched: 35,102 F / 4,127 M out of Kethireddypally == 35,102 F / 4,127 M in.
--
-- Values below are your Flock_20.xlsx (F-20 sheet) closings, not computed here.
-- Excel shed labels map to app sheds as: B1=10 B2=11 B3=12 B4=5 B5=6,
-- G2=2 G4=4 G5=7 G6=8 G7=9, G1/G3=1/3 (identical, interchangeable).
--
-- received_female is cleared on these rows: it recorded a movement that went
-- OUT, not in. Nothing reads it for any figure -- fn_chain_daily_opening
-- computes closing as opening - mortality - cull - transfer, and the only other
-- references in the app are the Bulk Daily Entry write path and the VHL form
-- input, neither of which is a report.
--
-- Triggers are disabled so the written closings are exactly the Excel figures
-- rather than trigger-recomputed. The cascade is scoped WHERE flock_id =
-- NEW.flock_id AND shed_id = NEW.shed_id, so only Flock 20 was ever in scope.

ALTER TABLE public.daily_records DISABLE TRIGGER trg_chain_cascade;

ALTER TABLE public.daily_records DISABLE TRIGGER trg_chain_daily_opening;

UPDATE public.daily_records d
SET transfer_female = v.trf, received_female = 0, closing_female = v.clo
FROM (VALUES
  ('1','2025-09-24',4576,   0),
  ('3','2025-09-24',4576,   0),
  ('4','2025-09-24',2048,2528),
  ('4','2025-09-25',2528,   0),
  ('7','2025-09-25',8016,   0),
  ('8','2025-09-25', 656,7360),
  ('8','2025-09-27',7360,   0),
  ('9','2025-09-27',1482,5028),
  ('9','2025-09-28',3742,1283),
  ('2','2025-09-27', 118,   0)
) AS v(shed_no, dt, trf, clo)
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND d.record_date = v.dt::date
  AND d.shed_id = (SELECT s.id FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
                   WHERE fm.name = 'Kethireddypally' AND s.shed_no = v.shed_no);

UPDATE public.daily_records d
SET transfer_male = 4127, received_male = 0, closing_male = 129
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND d.record_date = '2025-09-28'
  AND d.shed_id = (SELECT s.id FROM public.sheds s JOIN public.farms fm ON fm.id = s.farm_id
                   WHERE fm.name = 'Kethireddypally' AND s.shed_no = '2');

ALTER TABLE public.daily_records ENABLE TRIGGER trg_chain_cascade;

ALTER TABLE public.daily_records ENABLE TRIGGER trg_chain_daily_opening;
