-- Migration 206: read-only. Show the actual employee_deductions rows for the employees
-- whose total is doubled (Abhagi Das, Dipen Dolai) so we can see HOW they duplicated
-- (same nhe_sale_id? same amount/description? different created_at?) before deleting.

SELECT 'A_rows' AS chk, e.name, d.id, d.nhe_sale_id, d.amount, d.description,
       d.deduction_month, d.status, d.created_at
FROM public.employee_deductions d JOIN public.employees e ON e.id = d.employee_id
WHERE e.name IN ('Abhagi Das','Dipen Dolai')
ORDER BY e.name, d.created_at;

-- How many exact-duplicate groups exist overall (same emp+sale+amount+desc+month, count>1)
SELECT 'B_dup_groups' AS chk, COUNT(*) AS duplicate_groups, COALESCE(SUM(extra),0) AS rows_removable
FROM (
  SELECT employee_id, COALESCE(nhe_sale_id::text,'') AS s, amount, COALESCE(description,'') AS d,
         COALESCE(deduction_month::text,'') AS m, COUNT(*)-1 AS extra
  FROM public.employee_deductions
  GROUP BY employee_id, COALESCE(nhe_sale_id::text,''), amount, COALESCE(description,''), COALESCE(deduction_month::text,'')
  HAVING COUNT(*) > 1
) g;
