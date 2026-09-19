-- READ ONLY. What does the employees table ACTUALLY hold? The Employee List
-- shows 13 fields, the form captures more, and a grep of the migrations missed
-- several columns (dob, gender, mobile, esi_no, pf_no appear in the form but
-- not in any ADD COLUMN I could find). Before adding Voter ID and widening the
-- list, print the real column list rather than working from a guess.
-- Split in two so the job log, which truncates each statement, prints it all.

SELECT count(*)::int AS total_columns,
       string_agg(column_name, ', ' ORDER BY column_name)
         FILTER (WHERE column_name < 'i') AS columns_a_to_h
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'employees';

SELECT string_agg(column_name, ', ' ORDER BY column_name)
         FILTER (WHERE column_name >= 'i' AND column_name < 'r') AS columns_i_to_q
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'employees';

SELECT string_agg(column_name, ', ' ORDER BY column_name)
         FILTER (WHERE column_name >= 'r') AS columns_r_to_z
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'employees';

SELECT count(*)::int AS employees,
       count(*) FILTER (WHERE COALESCE(NULLIF(btrim(pan_no),''),NULL) IS NOT NULL)::int      AS have_pan,
       count(*) FILTER (WHERE COALESCE(NULLIF(btrim(aadhaar_no),''),NULL) IS NOT NULL)::int  AS have_aadhaar,
       count(*) FILTER (WHERE COALESCE(NULLIF(btrim(uan_no),''),NULL) IS NOT NULL)::int      AS have_uan,
       count(*) FILTER (WHERE COALESCE(NULLIF(btrim(account_no),''),NULL) IS NOT NULL)::int  AS have_account
FROM public.employees;
