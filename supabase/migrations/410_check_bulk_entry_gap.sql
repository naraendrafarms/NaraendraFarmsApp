SELECT 'sentinel' AS marker, 1 AS n;

-- All daily_records across ALL flocks (any status) around 1 July, to see if
-- entries exist under a shifted date or for flocks outside rearing/laying.
SELECT f.flock_no, f.status, f.is_vhl_contract, dr.record_date, dr.shed_id, dr.he_eggs_a, dr.feed_kg
FROM daily_records dr
JOIN flocks f ON f.id = dr.flock_id
WHERE dr.record_date BETWEEN '2026-06-28' AND '2026-07-03'
ORDER BY dr.record_date, f.flock_no;

-- Flock 21 (VHL) — is it excluded from bulk entry due to is_vhl_contract flag?
SELECT flock_no, status, is_vhl_contract FROM flocks WHERE flock_no IN ('19','20','21','22');
