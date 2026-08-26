SELECT count(*)::int AS n FROM public.audit_log WHERE table_name = 'flock_sheds';

SELECT action::text, user_email, changed_at::text, summary
FROM public.audit_log
WHERE table_name = 'flock_sheds'
  AND changed_at BETWEEN '2026-08-25 05:00:00' AND '2026-08-25 06:30:00'
ORDER BY changed_at;
