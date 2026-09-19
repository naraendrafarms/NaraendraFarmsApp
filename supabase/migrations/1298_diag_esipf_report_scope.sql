-- READ ONLY. The ESI / PF Report lists every salary row for the month. Its
-- query selects esi_applicable, pf_applicable and pt_applicable - so the
-- intent to filter on them was there - but no filter was ever applied, and
-- the on-screen table renders the raw rows. Measuring how many people that
-- puts on the page who have none of the three ticked.

SELECT to_char(s.month,'YYYY-MM') AS salary_month,
       count(*)::int                                                  AS rows_on_the_page,
       count(*) FILTER (WHERE COALESCE(s.gross_salary,0) > 0)::int     AS with_a_gross,
       count(*) FILTER (WHERE e.esi_applicable)::int                   AS esi_ticked,
       count(*) FILTER (WHERE e.pf_applicable)::int                    AS pf_ticked,
       count(*) FILTER (WHERE e.pt_applicable)::int                    AS pt_ticked,
       count(*) FILTER (WHERE NOT COALESCE(e.esi_applicable,false)
                          AND NOT COALESCE(e.pf_applicable,false)
                          AND NOT COALESCE(e.pt_applicable,false))::int AS none_of_the_three
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE s.month >= date '2026-06-01'
GROUP BY to_char(s.month,'YYYY-MM')
ORDER BY 1 DESC;

-- Does anyone NOT ticked actually carry a deduction? If so, filtering them off
-- the page would hide real money, and the fix has to account for it.
SELECT count(*)::int AS not_ticked_but_has_a_deduction,
       round(COALESCE(sum(COALESCE(s.esi_employee,0) + COALESCE(s.pf_employee,0) + COALESCE(s.pt,0)),0))::int AS amount
FROM public.salary_monthly s
JOIN public.employees e ON e.id = s.employee_id
WHERE NOT COALESCE(e.esi_applicable,false)
  AND NOT COALESCE(e.pf_applicable,false)
  AND NOT COALESCE(e.pt_applicable,false)
  AND (COALESCE(s.esi_employee,0) + COALESCE(s.pf_employee,0) + COALESCE(s.pt,0)) > 0;
