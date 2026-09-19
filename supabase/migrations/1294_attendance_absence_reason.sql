-- Leave REGISTER, not a ledger. The farm has no written leave policy - the
-- owner confirmed it on 19/09/2026 - so there is no entitlement to keep a
-- balance against, and inventing one would be inventing the company's rules.
-- What can be recorded without inventing anything is what actually happened:
-- why someone was away, and whether that day was treated as paid.
--
-- attendance_daily holds only P / A / H / WO / OT (migration 057). There is no
-- leave status, so today a man on approved leave is marked either A and goes
-- unpaid, or P and is paid as present. These two columns let the day be
-- recorded as what it was without adding a sixth status that every existing
-- report would have to learn.
--
-- absence_paid DEFAULTS TO FALSE, which is exactly how an A behaves today -
-- unpaid. So no existing row changes meaning, and NO SALARY CHANGES. Whether a
-- paid-leave day should count as a PAID day in the salary calculation is the
-- owner's decision and is NOT wired in here; the marker only records.

ALTER TABLE public.attendance_daily
  ADD COLUMN IF NOT EXISTS absence_reason TEXT;

ALTER TABLE public.attendance_daily
  ADD COLUMN IF NOT EXISTS absence_paid BOOLEAN NOT NULL DEFAULT FALSE;

SELECT
  (SELECT count(*)::int FROM information_schema.columns
    WHERE table_schema='public' AND table_name='attendance_daily'
      AND column_name='absence_reason')                       AS reason_column_exists,
  (SELECT count(*)::int FROM information_schema.columns
    WHERE table_schema='public' AND table_name='attendance_daily'
      AND column_name='absence_paid')                         AS paid_column_exists,
  (SELECT count(*)::int FROM public.attendance_daily)         AS attendance_rows_unchanged,
  (SELECT count(*)::int FROM public.attendance_daily WHERE absence_paid) AS marked_paid_so_far,
  (SELECT count(*)::int FROM public.attendance_daily WHERE status = 'A') AS absent_days_on_record;
