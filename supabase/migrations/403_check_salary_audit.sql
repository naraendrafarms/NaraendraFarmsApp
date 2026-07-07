SELECT 'sentinel' AS marker, 1 AS n;

-- Who/when inserted salary_monthly rows around the June 2026 bulk-generate timestamp
SELECT table_name, action, user_id, user_email, changed_at, summary
FROM audit_log
WHERE table_name = 'salary_monthly'
  AND changed_at BETWEEN '2026-07-06 14:10:00+00' AND '2026-07-06 14:20:00+00'
ORDER BY changed_at
LIMIT 20;

-- Distinct users/times who inserted ANY salary_monthly row in last 3 days (covers July generation too)
SELECT user_email, action, date_trunc('minute', changed_at) AS minute, count(*) AS rows_affected
FROM audit_log
WHERE table_name = 'salary_monthly'
  AND changed_at > now() - interval '3 days'
GROUP BY user_email, action, date_trunc('minute', changed_at)
ORDER BY minute DESC
LIMIT 30;
