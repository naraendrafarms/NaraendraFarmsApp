-- Electricity bills seed (part 1 of 1, 374 records)

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-01-01'::date, NULL, 124209.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-01-01'::date, NULL, 48528.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-01-01'::date, NULL, 56198.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-01-01'::date, NULL, 138964.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-01-01'::date, NULL, 14816.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-01-01'::date, NULL, 257999.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-02-01'::date, NULL, 191621.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-02-01'::date, NULL, 47027.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-02-01'::date, NULL, 19899.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-02-01'::date, NULL, 168533.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-02-01'::date, NULL, 49313.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-02-01'::date, NULL, 237899.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-03-01'::date, NULL, 299485.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-03-01'::date, NULL, 77711.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-03-01'::date, NULL, 13119.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-03-01'::date, NULL, 354806.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-03-01'::date, NULL, 48678.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-03-01'::date, NULL, 225056.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-04-01'::date, NULL, 450841.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-04-01'::date, NULL, 192088.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-04-01'::date, NULL, 32603.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-04-01'::date, NULL, 257658.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-04-01'::date, NULL, 66229.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-04-01'::date, NULL, 305795.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-05-01'::date, NULL, 456718.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-05-01'::date, NULL, 285396.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-05-01'::date, NULL, 63001.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-05-01'::date, NULL, 212284.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-05-01'::date, NULL, 57290.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-05-01'::date, NULL, 238445.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-06-01'::date, NULL, 392000.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-06-01'::date, NULL, 276436.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-06-01'::date, NULL, 23860.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-06-01'::date, NULL, 179103.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-06-01'::date, NULL, 44027.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-06-01'::date, NULL, 59084.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-07-01'::date, NULL, 333912.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-07-01'::date, NULL, 223380.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-07-01'::date, NULL, 27052.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-07-01'::date, NULL, 117953.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-07-01'::date, NULL, 29929.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-07-01'::date, NULL, 81499.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-08-01'::date, NULL, 370737.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-08-01'::date, NULL, 164762.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-08-01'::date, NULL, 20412.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-08-01'::date, NULL, 116771.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-08-01'::date, NULL, 32886.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-08-01'::date, NULL, 214636.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-09-01'::date, NULL, 380676.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-09-01'::date, NULL, 121717.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-09-01'::date, NULL, 29661.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-09-01'::date, NULL, 103530.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-09-01'::date, NULL, 29437.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-09-01'::date, NULL, 212618.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-10-01'::date, NULL, 354322.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-10-01'::date, NULL, 198114.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-10-01'::date, NULL, 17744.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-10-01'::date, NULL, 114729.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-10-01'::date, NULL, 29422.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-10-01'::date, NULL, 176814.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-11-01'::date, NULL, 303801.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-11-01'::date, NULL, 92318.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-11-01'::date, NULL, 29373.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-11-01'::date, NULL, 114006.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-11-01'::date, NULL, 32164.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-11-01'::date, NULL, 265631.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-12-01'::date, NULL, 84564.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-12-01'::date, NULL, 111007.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-12-01'::date, NULL, 21889.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-12-01'::date, NULL, 123640.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-12-01'::date, NULL, 38232.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2022-12-01'::date, NULL, 301294.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-01-01'::date, NULL, 76626.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-01-01'::date, NULL, 88892.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-01-01'::date, NULL, 22989.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-01-01'::date, NULL, 125903.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-01-01'::date, NULL, 28017.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-01-01'::date, NULL, 288715.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-02-01'::date, 335890, 136049.00, NULL, 215130.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-02-01'::date, 286267, 124501.00, NULL, 165507.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-02-01'::date, 71566, 33180.00, NULL, 41376.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-02-01'::date, 49622, 153940.00, NULL, 49622.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-02-01'::date, NULL, 33382.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-02-01'::date, NULL, 103050.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-03-01'::date, NULL, 295312.00, 239213.00, 50000.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-03-01'::date, NULL, 65891.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-03-01'::date, NULL, 27042.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-03-01'::date, 120274, 276223.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-03-01'::date, NULL, 33700.00, 60640.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-03-01'::date, NULL, 58849.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-04-01'::date, 4310, 523799.00, 189213.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-04-01'::date, 21832, 36883.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-04-01'::date, 5825, 29802.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-04-01'::date, 15924, 856082.00, 120274.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-04-01'::date, NULL, 38164.00, 60640.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-04-01'::date, 22274, 37605.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-05-01'::date, NULL, 549802.00, 322317.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-05-01'::date, NULL, 61813.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-05-01'::date, NULL, 55197.00, 0, 0
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-05-01'::date, NULL, 1000243.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-05-01'::date, NULL, 68996.00, 28710.00, 681001.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-05-01'::date, NULL, 62203.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-06-01'::date, 50578, 466769.00, 322317.00, 143799.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-06-01'::date, 9127, 110606.00, 0.00, 476654.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-06-01'::date, 4356, 35628.00, NULL, 126760.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-06-01'::date, 79821, 685550.00, 0.00, 346496.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-06-01'::date, 4505, 41728.00, 28710.00, 78210.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-06-01'::date, 3267, 59911.00, 0.00, 493545.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-07-01'::date, NULL, 275774.00, 0.00, 50578.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-07-01'::date, 5122, 74547.00, 0.00, 476654.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-07-01'::date, NULL, 20695.00, NULL, 126760.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-07-01'::date, 7772, 94023.00, 0.00, 79821.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-07-01'::date, 3288, 32284.00, 0.00, 78210.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-07-01'::date, 3586, 62506.00, 0.00, 493545.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-08-01'::date, 35881, 340222.00, 0.00, 143799.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-08-01'::date, 13574, 148816.00, 0.00, 476654.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-08-01'::date, NULL, 21238.00, NULL, 126760.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-08-01'::date, 8489, 104579.00, 0.00, 346496.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-08-01'::date, 4143, 38918.00, 0.00, 78210.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-08-01'::date, 3551, 62219.00, 0.00, 493545.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-09-01'::date, 31933, 309533.00, 0.00, 35881.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-09-01'::date, 17083, 177626.00, 0.00, 13574.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-09-01'::date, NULL, 12816.00, 0.00, 126760.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-09-01'::date, 8137, 120274.00, 0.00, 346496.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-09-01'::date, 3426, 33355.00, 0.00, 78210.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-09-01'::date, 1830, 59105.00, 0.00, 493545.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-10-01'::date, NULL, 373485.00, 0.00, 31933.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-10-01'::date, 26530, 324610.00, 0.00, 17083.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-10-01'::date, 1651, 16386.00, 0.00, 126760.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-10-01'::date, 15569, 138713.00, 0.00, 346496.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-10-01'::date, 4107, 38639.00, 0.00, 78210.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-10-01'::date, 3555, 62252.00, 0.00, 493545.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-10-01'::date, 348, 4452.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-10-01'::date, 106, 2989.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-11-01'::date, NULL, 297062.00, 0.00, 143799.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-11-01'::date, 15792, 162214.00, 0.00, 26530.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-11-01'::date, NULL, 27389.00, 0.00, 126760.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-11-01'::date, 7855, 94705.00, 0.00, 15569.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-11-01'::date, 4418, 41052.00, 0.00, 78210.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-11-01'::date, 2847, 59675.00, 0.00, 493545.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-11-01'::date, 764, 11421.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-11-01'::date, 1515, 18546.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-12-01'::date, 6620, 95110.00, 0.00, 143799.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-12-01'::date, 13310, 141770.00, 0.00, 15792.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-12-01'::date, 1772, 17242.00, 0.00, 126760.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-12-01'::date, 7694, 93383.00, 0.00, 346496.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-12-01'::date, 3785, 36140.00, 0.00, 78210.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-12-01'::date, 1900, 59145.00, 0.00, 493545.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-12-01'::date, 455, 9006.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2023-12-01'::date, 2235, 24112.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-01-01'::date, NULL, 99166.00, 0.00, 143799.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-01-01'::date, 13820, 145957.00, 0.00, 13310.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-01-01'::date, NULL, 26820.00, 0.00, 126760.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-01-01'::date, 7377, 90781.00, 0.00, 346496.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-01-01'::date, 3206, 31647.00, 0.00, 78210.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-01-01'::date, 1045, 58666.00, 0.00, 493545.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-01-01'::date, 402, 8595.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-01-01'::date, 2849, 28877.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-02-01'::date, NULL, 102574.00, 0.00, 143799.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-02-01'::date, 20580, 201457.00, 0.00, 13820.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-02-01'::date, NULL, 21062.00, 0.00, 126760.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-02-01'::date, 3961, 62735.00, 0.00, 346496.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-02-01'::date, 2567, 26689.00, 0.00, 78210.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-02-01'::date, 2692, 59588.00, 0.00, 493545.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-02-01'::date, 375, 8385.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-02-01'::date, 13925, 154396.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-03-01'::date, 6513, 94232.00, 0.00, 143799.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-03-01'::date, 27138, 260851.00, 0.00, 20580.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-03-01'::date, 2961, 25638.00, 0.00, 126760.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-03-01'::date, 21199, 282591.00, 0.00, 346496.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-03-01'::date, 3066, 30561.00, 0.00, 78210.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-03-01'::date, 2186, 59305.00, 0.00, 493545.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-03-01'::date, 12980, 188654.00, 0.00, NULL
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-03-01'::date, 25077, 250419.00, 0.00, 13925.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-04-01'::date, 32245, 294513.00, 0.00, 143799.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-04-01'::date, 36920, 320960.00, 0.00, 27138.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-04-01'::date, 10636, 72595.00, 0.00, 126760.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-04-01'::date, 28438, 333872.00, 0.00, 21199.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-04-01'::date, 3848, 31779.00, 0.00, 78210.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-04-01'::date, 4783, 45682.00, 0.00, 493545.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-04-01'::date, 38599, 434057.00, 0.00, 12980.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-04-01'::date, 38494, 361593.00, 0.00, 25077.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-05-01'::date, 51932, 479773.00, 0.00, 32245.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-05-01'::date, 21318, 260818.00, 0.00, 36920.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-05-01'::date, 10955, 82418.00, 0.00, 10636.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-05-01'::date, 28037, 364073.00, 0.00, 28438.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-05-01'::date, 3557, 34371.00, 0.00, 31779.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-05-01'::date, 4526, 70223.00, 0.00, 45682.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-05-01'::date, 33260, 385552.00, 0.00, 38599.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-05-01'::date, 27001, 270016.00, 0.00, 38494.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-06-01'::date, NULL, 495483.00, 0.00, 51932.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-06-01'::date, 3946, 64946.00, 0.00, 21318.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-06-01'::date, NULL, 19938.00, 0.00, 10955.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-06-01'::date, 19619, 202608.00, 91964.00, 28037.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-06-01'::date, 3047, 30413.00, 0.00, 34371.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-06-01'::date, 4647, 71225.00, 0.00, 70223.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-06-01'::date, 22670, 280993.00, 0.00, 33260.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-06-01'::date, 633, 45523.00, 38146.00, 27001.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-07-01'::date, NULL, 428161.00, NULL, 495483.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-07-01'::date, 4715, 71213.00, 0.00, 64946.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-07-01'::date, NULL, 21219.00, NULL, 19938.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-07-01'::date, 12123, 131239.00, 91964.00, 19619.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-07-01'::date, 3139, 31127.00, 0.00, 30413.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-07-01'::date, 0, 47208.00, 0.00, 71225.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-07-01'::date, 30298, 349038.00, NULL, 22670.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-07-01'::date, 1535, 49028.00, 38146.00, 45523.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-08-01'::date, NULL, 460183.00, 0.00, 428161.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-08-01'::date, 5241, 75525.00, 0.00, 71213.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-08-01'::date, 3371, 28329.00, 0.00, 21219.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-08-01'::date, 12927, 143308.00, 91964.00, 12123.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-08-01'::date, NULL, 35613.00, NULL, 31127.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-08-01'::date, 0, 58319.00, 0.00, 47208.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-08-01'::date, 31805, 357644.00, 0.00, 30298.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-08-01'::date, 3060, 62512.00, 38146.00, 49028.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-09-01'::date, 43904, 414759.00, 0.00, 460183.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-09-01'::date, 11074, 123405.00, 0.00, 75525.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-09-01'::date, 3594, 30047.00, 0.00, 28329.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-09-01'::date, 7861, 96141.00, 91964.00, 12927.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-09-01'::date, 3018, 30188.00, 0.00, 35613.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-09-01'::date, 3270, 69200.00, 0.00, 58319.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-09-01'::date, 9126, 113475.00, 0.00, 31805.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-09-01'::date, 5971, 85523.00, 38146.00, 62512.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-10-01'::date, NULL, 452236.00, 0.00, 43904.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-10-01'::date, 29291, 273434.00, 0.00, 11074.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-10-01'::date, NULL, 19219.00, 0.00, 30047.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-10-01'::date, 7282, 91782.00, 91964.00, 96141.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-10-01'::date, 1670, 20267.00, 0.00, 30188.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-10-01'::date, NULL, 58698.00, 0.00, 69200.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-10-01'::date, 12988, 144494.00, 0.00, 113475.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-10-01'::date, 11263, 133291.00, 38146.00, 85523.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-11-01'::date, 39158, 385827.00, 0.00, 452236.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-11-01'::date, 20476, 202208.00, 0.00, 29291.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-11-01'::date, 2397, 21656.00, 0.00, 19219.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-11-01'::date, 7136, 91666.00, 91964.00, 91782.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-11-01'::date, 1706, 21864.00, 0.00, 20267.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-11-01'::date, NULL, 59716.00, 0.00, 58698.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-11-01'::date, 13494, 135586.00, 0.00, 12988.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-11-01'::date, 3105, 66343.00, 38146.00, 11263.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-12-01'::date, 32300, 308744.00, 0.00, 39158.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-12-01'::date, 14697, 154771.00, 0.00, 20476.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-12-01'::date, 1517, 15292.00, 0.00, 21656.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-12-01'::date, 6213, 84096.00, 91964.00, 91666.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-12-01'::date, 3533, 36041.00, 0.00, 21864.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-12-01'::date, NULL, 0.00, 0.00, 59716.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-12-01'::date, 10138, 108033.00, 0.00, 13494.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2024-12-01'::date, 2581, 54576.00, 0.00, 66343.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-01-01'::date, 36992, 355683.00, 0.00, 32300.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-01-01'::date, 15191, 158969.00, 0.00, 14697.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-01-01'::date, 1885, 18101.00, 0.00, 15292.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-01-01'::date, 7616, 95750.00, 91964.00, 84096.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-01-01'::date, 4084, 40467.00, 0.00, 36041.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-01-01'::date, NULL, 0.00, 0.00, 493545.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-01-01'::date, 13873, 138856.00, 0.00, 10138.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-01-01'::date, 4498, 70119.00, 0.00, 54576.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-02-01'::date, 39366, 384003.00, 0.00, 36992.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-02-01'::date, 21873, 213677.00, 0.00, 15191.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-02-01'::date, 4671, 37620.00, 0.00, 18101.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-02-01'::date, 11557, 151071.00, 91964.00, 95750.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-02-01'::date, 3675, 37143.00, 0.00, 40467.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-02-01'::date, NULL, 0.00, 0.00, 493545.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-02-01'::date, 31736, 355342.00, 0.00, 13873.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-02-01'::date, 11675, 129613.00, 0.00, 70119.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-03-01'::date, 55371, 522982.00, 0.00, 39366.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-03-01'::date, 31270, 295927.00, 0.00, 21873.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-03-01'::date, NULL, 81115.00, 0.00, 37620.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-03-01'::date, 17650, 199707.00, 0.00, 11557.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-03-01'::date, 4801, 45881.00, 0.00, 37143.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-03-01'::date, NULL, 0.00, 0.00, 66918.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-03-01'::date, 44329, 441778.00, 0.00, 31736.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-03-01'::date, 17810, 182920.00, 0.00, 11675.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-04-01'::date, 58535, 627882.00, 0.00, 55371.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-04-01'::date, 40612, 365291.00, 0.00, 31270.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-04-01'::date, 12877, 89250.00, 0.00, 81115.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-04-01'::date, 5677, 82366.00, 0.00, 17650.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-04-01'::date, 2957, 27371.00, 0.00, 45881.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-04-01'::date, NULL, 0.00, 0.00, 66918.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-04-01'::date, 14990, 190978.00, 0.00, 44329.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-04-01'::date, 21376, 170467.00, 0.00, 17810.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-05-01'::date, 30799, 386680.00, 116716.00, 58535.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-05-01'::date, 36149, 353573.00, 0.00, 40612.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-05-01'::date, NULL, 71140.00, 0.00, 12877.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-05-01'::date, 5280, 97282.00, 0.00, 82366.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-05-01'::date, 3640, 36871.00, 0.00, 27371.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-05-01'::date, NULL, 0.00, 0.00, 66918.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-05-01'::date, 4110, 76724.00, 278964.00, 14990.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-05-01'::date, 13213, 146029.00, 110056.00, 21376.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-06-01'::date, 15620, 171107.00, 58357.00, 30799.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-06-01'::date, 28609, 272957.00, 0.00, 36149.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-06-01'::date, 4022, 33140.00, 0.00, 71140.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-06-01'::date, 5200, 96884.00, 0.00, 97282.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-06-01'::date, 8138, 71923.00, 0.00, 36871.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-06-01'::date, NULL, 0.00, 0.00, 66918.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-06-01'::date, 4110, 75293.00, 139482.00, 76724.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-06-01'::date, 3594, 61207.00, 55028.00, 13213.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-07-01'::date, 34784, 334139.00, 22400.00, 15620.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-07-01'::date, 20121, 199294.00, 0.00, 28609.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-07-01'::date, 2732, 23963.00, 0.00, 33140.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-07-01'::date, 5726, 101810.00, 0.00, 96884.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-07-01'::date, 5820, 53788.00, 0.00, 71923.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-07-01'::date, NULL, 0.00, 0.00, 66918.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-07-01'::date, 6495, 97471.00, 0.00, 75293.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-07-01'::date, 2970, 55265.00, 0.00, 61207.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-08-01'::date, 40845, 396728.00, 22400.00, 34784.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-08-01'::date, 3244, 60732.00, 0.00, 20121.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-08-01'::date, NULL, 25803.00, 0.00, 23963.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-08-01'::date, 8074, 121088.00, 0.00, 101810.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-08-01'::date, 3148, 33057.00, 0.00, 53788.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-08-01'::date, NULL, 0, 0, 66918.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-08-01'::date, 25045, 248720.00, 0.00, 97471.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-08-01'::date, 2970, 54902.00, 0.00, 55265.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-09-01'::date, 24021, 245091.00, 22400.00, 40845.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-09-01'::date, 4904, 74362.00, 0.00, 60732.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-09-01'::date, NULL, 26105.00, 0.00, 25803.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-09-01'::date, 8474, 124372.00, 0.00, 121088.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-09-01'::date, 4323, 42173.00, 0.00, 33057.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-09-01'::date, NULL, 0, 0, 66918.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-09-01'::date, 34079, 326889.00, 0.00, 25045.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-09-01'::date, 2970, 54613.00, 0.00, 54902.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-10-01'::date, 63522, 571215.00, 22400.00, 24021.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-10-01'::date, 22259, 216847.00, 0.00, 74362.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-10-01'::date, 2598, 22956.00, 0.00, 26105.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-10-01'::date, 8664, 125931.00, 0.00, 124372.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-10-01'::date, 3947, 39257.00, 0.00, 42173.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-10-01'::date, NULL, 0, 0, 66918.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-10-01'::date, 31183, 306464.00, 0.00, 34079.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-10-01'::date, 2970, 55131.00, 0.00, 54613.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-11-01'::date, 28917, 287070.00, 22400.00, 63522.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-11-01'::date, 20428, 201814.00, 0.00, 22259.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-11-01'::date, NULL, 21693.00, 0.00, 22956.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-11-01'::date, NULL, 97908.00, 0.00, 125931.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-11-01'::date, 3953, 39302.00, 0.00, 39257.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-11-01'::date, NULL, 0, 0, 66918.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-11-01'::date, 24636, 251463.00, 0.00, 34079.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-11-01'::date, 2970, 55493.00, 0.00, 55131.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-12-01'::date, 36745, 345499.00, 22400.00, 28917.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-12-01'::date, 28589, 268967.00, 0.00, 20428.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-12-01'::date, NULL, 23788.00, 0.00, 21693.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-12-01'::date, 18368, 205600.00, 0.00, 97908.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-12-01'::date, 5555, 51885.00, 0.00, 39302.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-12-01'::date, NULL, 0, 0, 66918.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-12-01'::date, 27177, 266375.00, 0.00, 24636.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2025-12-01'::date, 2970, 56220.00, 0.00, 55493.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-01-01'::date, 29050, 281300.00, 22400.00, 36745.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-01-01'::date, 21906, 213948.00, 0.00, 28589.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-01-01'::date, 2130, 19832.00, 0.00, 23788.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-01-01'::date, 11234, 147031.00, 0.00, 18368.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-01-01'::date, 4664, 44821.00, 0.00, 51885.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-01-01'::date, NULL, 0, 0, 66918.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-01-01'::date, 26923, 264138.00, 0.00, 27177.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-01-01'::date, 2970, 56000.00, 0.00, 56220.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-02-01'::date, 29880, 299952.00, 0.00, 29050.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-02-01'::date, 24911, 238620.00, 0.00, 21906.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-02-01'::date, NULL, 17880.00, 0.00, 19832.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-02-01'::date, 14612, 177115.00, 0.00, 11234.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-02-01'::date, 3490, 35709.00, 0.00, 44821.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-02-01'::date, NULL, 0, 0, 66918.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-02-01'::date, 32291, 312011.00, 0.00, 26923.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-02-01'::date, 9405, 116316.00, 0.00, 56000.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-03-01'::date, 35966, 343497.00, 0.00, 29880.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-03-01'::date, 29124, 273208.00, 0.00, 24911.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-03-01'::date, NULL, 14744.00, 0.00, 17880.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-03-01'::date, 19361, 213754.00, 0.00, 14612.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-03-01'::date, 3990, 39590.00, 0.00, 35709.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-03-01'::date, NULL, 0, 0, 66918.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-03-01'::date, 39971, 378613.00, 0.00, 32291.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-03-01'::date, 18017, 198195.00, 0.00, 116316.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-04-01'::date, 388753, 414107.00, 25354.00, 43839.00
FROM public.electricity_meters em WHERE em.usc_no = '103770715'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-04-01'::date, 301665, 323651.00, 21986.00, 35268.00
FROM public.electricity_meters em WHERE em.usc_no = '103770716'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-04-01'::date, 12199, 18045.00, 5846.00, 14744.00
FROM public.electricity_meters em WHERE em.usc_no = '103770721'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-04-01'::date, 245636, 267636.00, 22000.00, 25924.00
FROM public.electricity_meters em WHERE em.usc_no = '108508370'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-04-01'::date, 28687, 33196.00, 4509.00, 39590.00
FROM public.electricity_meters em WHERE em.usc_no = '112870608'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-04-01'::date, NULL, 0, 0, 66918.00
FROM public.electricity_meters em WHERE em.usc_no = '112871659'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-04-01'::date, 400451, 413339.00, 12888.00, 44286.00
FROM public.electricity_meters em WHERE em.usc_no = '114422322'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;

INSERT INTO public.electricity_bills (meter_id, bill_month, units_consumed, amount, acd_dc_due, deposit_amount)
SELECT em.id, '2026-04-01'::date, 291988, 299632.00, 7644.00, 25475.00
FROM public.electricity_meters em WHERE em.usc_no = '114422323'
ON CONFLICT (meter_id, bill_month) DO UPDATE SET
  units_consumed = EXCLUDED.units_consumed,
  amount = EXCLUDED.amount,
  acd_dc_due = EXCLUDED.acd_dc_due,
  deposit_amount = EXCLUDED.deposit_amount;
