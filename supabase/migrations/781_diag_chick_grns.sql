-- Migration 781 (READ ONLY): I said GRN had no flock link. That was wrong -
-- migration 144 added grn.flock_id for chick purchases and 224 added
-- free_qty. So the chick receipts probably ARE in GRN. Find out exactly what
-- is there, by category, so the Chick Receipts page can be built on the real
-- source instead of on what somebody typed onto the flock.

SELECT 'chick_grns' AS chk,
       (SELECT count(*) FROM public.grn WHERE flock_id IS NOT NULL) AS grns_with_flock,
       (SELECT string_agg(DISTINCT COALESCE(i.category, '(no item)'), ' , ')
          FROM public.grn g LEFT JOIN public.items i ON i.id = g.item_id
         WHERE g.flock_id IS NOT NULL) AS categories_used,
       (SELECT count(*) FROM public.items WHERE category ILIKE '%chick%') AS chick_items,
       (SELECT string_agg(DISTINCT category, ' , ') FROM public.items) AS all_item_categories;

SELECT 'chick_grn_rows' AS chk,
       (SELECT string_agg(t, '  ||  ' ORDER BY t) FROM (
          SELECT 'F' || COALESCE(f.flock_no, '?')
                 || ' ' || g.grn_date::text
                 || ' ' || COALESCE(g.grn_no, '-')
                 || ' item=' || COALESCE(i.name, g.item_name, '?')
                 || ' cat=' || COALESCE(i.category, '-')
                 || ' qty=' || COALESCE(g.qty, 0) || COALESCE(g.unit, '')
                 || ' free=' || COALESCE(g.free_qty, 0)
                 || ' rate=' || COALESCE(g.price_per_unit, 0)
                 || ' amt=' || COALESCE(g.total_amount, 0)
                 || ' party=' || COALESCE(p.name, '-')
                 || ' inv=' || COALESCE(g.invoice_no, '-') AS t
            FROM public.grn g
            LEFT JOIN public.flocks f ON f.id = g.flock_id
            LEFT JOIN public.items i ON i.id = g.item_id
            LEFT JOIN public.parties p ON p.id = g.party_id
           WHERE g.flock_id IS NOT NULL
              OR COALESCE(i.category, '') ILIKE '%chick%'
              OR COALESCE(i.name, g.item_name, '') ILIKE '%chick%'
           ORDER BY t
           LIMIT 40
       ) x) AS rows_found;
