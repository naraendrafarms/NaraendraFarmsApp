-- Diagnostic only, kept very short so nothing is truncated.
SELECT (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_schema='public' AND table_name='payment_plan_manual_items'
          AND column_name='gross_amount')::text AS has_gross_amount,
       (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_schema='public' AND table_name='payment_plan_manual_items'
          AND column_name='deduction_amount')::text AS has_deduction_amount,
       (SELECT COUNT(*) FROM information_schema.columns
        WHERE table_schema='public' AND table_name='payment_plan_manual_items'
          AND column_name='deduction_reason')::text AS has_deduction_reason;

SELECT COALESCE(string_agg(label || ' amt=' || amount
       || ' gross=' || COALESCE(gross_amount::text,'NULL')
       || ' ded=' || COALESCE(deduction_amount::text,'NULL')
       || ' ' || to_char(created_at,'DD/MM HH24:MI'), ' | ' ORDER BY created_at), 'NO ROWS') AS the_rows
FROM public.payment_plan_manual_items;
