UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nDONE: imported 84 rows into flock_weekly_performance from WEEKLY_REPORT_NF_20.xlsx - rearing weeks 1-23 (female+male) and laying weeks 24-61 (female only; the report has no male body weight column for the laying phase, only male feed grams which was not imported). Verified n=84, values checked against source. No existing app data was touched.'
WHERE title = 'Flock 20: body weight never entered'
  AND task_type = 'development';
