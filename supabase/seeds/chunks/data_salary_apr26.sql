-- Salary monthly records for April 2026
-- Source: NF April 26 Salaries Final.xlsx (Site Salaries sheet)
-- Includes HO staff (NF-HO-*) and SITE staff (NF-EMP-*)
-- New columns: basic_salary, hra, gross_salary, esi_employee, esi_employer,
--              pf_employee, pf_employer, pt (added in migration 013)
--
-- Column structure from Excel:
--   EE Code, NAME OF EMPLOYEE, Total Paid Days,
--   Basic, HRA, Other Allowance, Gross Earning, Extra Pay, Total Earning,
--   PF @12% (employee), ESI @0.75% (employee), ESI Employer @3.25%,
--   Employer EPF @3.67% + Employer EPS @8.33% = pf_employer,
--   P.Tax, TDS, Advance Adjusted, Net Payable
--
-- Notes:
--   - NF-HO-M-01 (Dendi Srinath Reddy) and NF-HO-M-02 (Dendi Lokeswari): PF not applicable (EPF wages > 15000, exempt); TDS deducted
--   - NF-HO-001 to 004: PF applicable; ESI not applicable (gross > ESI ceiling)
--   - NF-EMP-003/004/005/006/007/013/014/015/016/017: ESI applicable
--   - Employer PF = Employer EPS @8.33% + Employer EPF @3.67%

INSERT INTO public.salary_monthly
  (employee_id, month, days_worked,
   basic_salary, hra, gross_salary, earned_salary,
   esi_employee, esi_employer, pf_employee, pf_employer,
   pt, tds, advance, net_salary)
SELECT
  e.id,
  t.pay_month,
  t.days_worked,
  t.basic_salary,
  t.hra,
  t.gross_salary,
  t.earned_salary,
  t.esi_employee,
  t.esi_employer,
  t.pf_employee,
  t.pf_employer,
  t.pt,
  t.tds,
  t.advance,
  t.net_salary
FROM (VALUES
  -- HO Staff (Head Office)
  -- NF-HO-M-01: Dendi Srinath Reddy | Administration Head | 30 days | Basic=200000, HRA=120000, OtherAllow=80000 | PF=0, ESI=0, PT=200, TDS=104186
  ('NF-HO-M-01', '2026-04-01'::date, 30.0, 200000, 120000, 400000, 400000,     0,    0.00,    0,    0, 200, 104186,   0, 295614),
  -- NF-HO-M-02: Dendi Lokeswari | Operations Head | 30 days | Basic=125000, HRA=75000, OtherAllow=50000 | PF=0, ESI=0, PT=200, TDS=60840
  ('NF-HO-M-02', '2026-04-01'::date, 30.0, 125000,  75000, 250000, 250000,     0,    0.00,    0,    0, 200,  60840,   0, 188960),
  -- NF-HO-001: Paruchuri Dinesh | Manager Finance | 30 days | Basic=28000, HRA=16800, OtherAllow=11200 | PF_EE=1800, ESI=0, PT=200, TDS=0
  ('NF-HO-001',  '2026-04-01'::date, 30.0,  28000,  16800,  56000,  59733,     0,    0.00, 1800, 1800, 200,      0,   0,  57733),
  -- NF-HO-002: Bhimana Venkata Lakshmi Sivaji | Accountant | 30 days | Basic=14840, HRA=7530 | PF_EE=1781, ESI=0, PT=200
  ('NF-HO-002',  '2026-04-01'::date, 30.0,  14840,   7530,  25100,  26773,     0,    0.00, 1781, 1781, 200,      0,   0,  24792),
  -- NF-HO-003: Adapu Venkataiah | Attender | 29 days | Basic=13727, HRA=0 | PF_EE=1647, ESI=0, PT=0
  ('NF-HO-003',  '2026-04-01'::date, 29.0,  13727,      0,  13727,  13727,     0,    0.00, 1647, 1647,   0,      0,   0,  12080),
  -- NF-HO-004: Chityala Raju | Driver | 30 days | Basic=16000, HRA=7530 | PF=0 (EPF not applicable), PT=200, Advance=8500
  ('NF-HO-004',  '2026-04-01'::date, 30.0,  16000,   7530,  25100,  25100,     0,    0.00,    0,    0, 200,      0, 8500,  24900),

  -- SITE Staff
  -- NF-EMP-001: Arjun Kumar Mohanta | Administrative Manager | 30 days | SITE | Basic=24000, HRA=14400, OtherAllow=9600
  ('NF-EMP-001', '2026-04-01'::date, 30.0,  24000,  14400,  48000,  51200,     0,    0.00, 1800, 1800, 200,      0,   0,  49200),
  -- NF-EMP-002: Babulal Mohanta | Site Manager | 30 days | SITE | Basic=14840, HRA=7500
  ('NF-EMP-002', '2026-04-01'::date, 30.0,  14840,   7500,  25000,  26667,     0,    0.00, 1781, 1781, 200,      0,   0,  24686),
  -- NF-EMP-003: Pradip Patra | Store Keeper | 22 days | SITE | Basic=10883, HRA=2684 | ESI_EE=111, ESI_ER=481
  ('NF-EMP-003', '2026-04-01'::date, 22.0,  10883,   2684,  13567,  14800,   111,  481.00, 1306, 1306,   0,      0,   0,  13383),
  -- NF-EMP-004: Baidyanath Maity | Electrician | 22 days | SITE | Basic=10883, HRA=3051 | ESI_EE=115, ESI_ER=494.03, PT=150
  ('NF-EMP-004', '2026-04-01'::date, 22.0,  10883,   3051,  13934,  15201,   115,  494.03, 1306, 1306, 150,      0,   0,  13630),
  -- NF-EMP-005: Santanu Ganjan | Poultry Assistant | 30 days | SITE | Basic=14700, HRA=0 | ESI_EE=118, ESI_ER=509.60, PT=150
  ('NF-EMP-005', '2026-04-01'::date, 30.0,  14700,      0,  14700,  15680,   118,  509.60, 1764, 1764, 150,      0,   0,  13648),
  -- NF-EMP-006: Suresan Patra | Poultry Assistant | 30 days | SITE | Basic=14840, HRA=1310 | ESI_EE=130, ESI_ER=559.88, PT=150
  ('NF-EMP-006', '2026-04-01'::date, 30.0,  14840,   1310,  16150,  17227,   130,  559.88, 1781, 1781, 150,      0,   0,  15166),
  -- NF-EMP-007: Karunakar Munda | Poultry Assistant | 29 days | SITE | Basic=13533, HRA=0 | ESI_EE=109, ESI_ER=470.15, Advance=916
  ('NF-EMP-007', '2026-04-01'::date, 29.0,  13533,      0,  13533,  14466,   109,  470.15, 1624, 1624,   0,      0, 916,  12733),
  -- NF-EMP-008: Rajesh Karua | Poultry Assistant | 8 days | SITE | Basic=3907, HRA=0 | PF_EE=469, ESI=0 (gross<21000 but ESI not applicable?)
  ('NF-EMP-008', '2026-04-01'::date,  8.0,   3907,      0,   3907,   4395,     0,    0.00,  469,  469,   0,      0,   0,   3926),
  -- NF-EMP-009: Hiranmoy Mondal | Site Manager | 22 days | SITE | Basic=10883, HRA=5280, OtherAllow=1437 | PF_EE=1306, ESI=0 (EPF wages>15000), PT=150
  ('NF-EMP-009', '2026-04-01'::date, 22.0,  10883,   5280,  17600,  19200,     0,    0.00, 1306, 1306, 150,      0,   0,  17744),
  -- NF-EMP-010: Shaheen | Poultry Assistant | 27 days | SITE | Basic=13356, HRA=1170 | PF_EE=1603, ESI=0, PT=150
  ('NF-EMP-010', '2026-04-01'::date, 27.0,  13356,   1170,  14526,  15602,     0,    0.00, 1603, 1603, 150,      0,   0,  13849),
  -- NF-EMP-011: Tyeda Srisailam | Poultry Assistant | 28 days | SITE | Basic=13767, HRA=0 | PF_EE=1652, ESI=0, PT=0
  ('NF-EMP-011', '2026-04-01'::date, 28.0,  13767,      0,  13767,  14750,     0,    0.00, 1652, 1652,   0,      0,   0,  13098),
  -- NF-EMP-012: Sanjib Mondal | Administrative Manager | 30 days | SITE | Basic=14840, HRA=7680, OtherAllow=3080 | PF_EE=1781, ESI=0, PT=200
  ('NF-EMP-012', '2026-04-01'::date, 30.0,  14840,   7680,  25600,  27307,     0,    0.00, 1781, 1781, 200,      0,   0,  25326),
  -- NF-EMP-013: Ananta Hembram | Poultry Assistant | 28.5 days | SITE | Basic=14013, HRA=0 | ESI_EE=113, ESI_ER=487.37, PF_EE=1682
  ('NF-EMP-013', '2026-04-01'::date, 28.5,  14013,      0,  14013,  14996,   113,  487.37, 1682, 1682,   0,      0,   0,  13201),
  -- NF-EMP-014: Ramdas Mahali | Poultry Assistant | 30 days | SITE | Basic=14500, HRA=0 | ESI_EE=117, ESI_ER=502.68, PT=150, Advance=334
  ('NF-EMP-014', '2026-04-01'::date, 30.0,  14500,      0,  14500,  15467,   117,  502.68, 1740, 1740, 150,      0, 334,  13460),
  -- NF-EMP-015: Dubaraj Hemram | Poultry Assistant | 24 days | SITE | Basic=11600, HRA=0 | ESI_EE=95, ESI_ER=408.43, PF_EE=1392, Advance=864
  ('NF-EMP-015', '2026-04-01'::date, 24.0,  11600,      0,  11600,  12567,    95,  408.43, 1392, 1392,   0,      0, 864,  11080),
  -- NF-EMP-016: Ratikanta Mohanta | Poultry Assistant | 6.5 days | SITE | Basic=3215, HRA=35 | ESI_EE=29, ESI_ER=121.88, PF_EE=386, Advance=3000
  ('NF-EMP-016', '2026-04-01'::date,  6.5,   3215,     35,   3250,   3750,    29,  121.88,  386,  386,   0,      0, 3000,   3335),
  -- NF-EMP-017: Lakeshwar Jagat | Medium Vehicle Driver | 29.5 days | SITE | Basic=14258, HRA=0 | ESI_EE=111, ESI_ER=479.08, PF_EE=1711, Advance=830
  ('NF-EMP-017', '2026-04-01'::date, 29.5,  14258,      0,  14258,  14741,   111,  479.08, 1711, 1711,   0,      0, 830,  12919),
  -- NF-EMP-018: Dimbaj Kumar Mohanta | Site Manager | 12 days | KPALLY | Basic=5936, HRA=3240, OtherAllow=1624 | PF_EE=712, ESI=0, PT=0
  ('NF-EMP-018', '2026-04-01'::date, 12.0,   5936,   3240,  10800,  11700,     0,    0.00,  712,  712,   0,      0,   0,  10988)
) AS t(emp_id_str, pay_month, days_worked,
       basic_salary, hra, gross_salary, earned_salary,
       esi_employee, esi_employer, pf_employee, pf_employer,
       pt, tds, advance, net_salary)
JOIN public.employees e ON e.emp_id = t.emp_id_str
ON CONFLICT (employee_id, month) DO UPDATE SET
  days_worked   = EXCLUDED.days_worked,
  basic_salary  = EXCLUDED.basic_salary,
  hra           = EXCLUDED.hra,
  gross_salary  = EXCLUDED.gross_salary,
  earned_salary = EXCLUDED.earned_salary,
  esi_employee  = EXCLUDED.esi_employee,
  esi_employer  = EXCLUDED.esi_employer,
  pf_employee   = EXCLUDED.pf_employee,
  pf_employer   = EXCLUDED.pf_employer,
  pt            = EXCLUDED.pt,
  tds           = EXCLUDED.tds,
  advance       = EXCLUDED.advance,
  net_salary    = EXCLUDED.net_salary;
