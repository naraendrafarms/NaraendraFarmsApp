-- User: dispatches for VHL-related flocks (e.g. Flock 20) should NOT
-- consume the farm's own box/tray stock — VHL supplies its own packaging.
-- VHL is a Hatchery type (hatcheries.type IN ('Hitech','VHL','Other')), and
-- he_dispatch.hatchery_id links to it. Confirm Flock 20's dispatches are
-- indeed tagged to a VHL hatchery, and see how many total dispatch rows
-- (with packaging data) are VHL vs non-VHL across all flocks.
SELECT f.flock_no, h.name AS hatchery_name, h.type AS hatchery_type,
       d.dc_no, d.boxes_20lb, d.boxes_23lb, d.extra_trays_20lb, d.extra_trays_23lb
FROM public.he_dispatch d
JOIN public.flocks f ON f.id = d.flock_id
LEFT JOIN public.hatcheries h ON h.id = d.hatchery_id
WHERE f.flock_no = '20'
ORDER BY d.dispatch_date;

SELECT h.type AS hatchery_type, COUNT(*) AS dispatch_count
FROM public.he_dispatch d
LEFT JOIN public.hatcheries h ON h.id = d.hatchery_id
WHERE COALESCE(d.boxes_20lb,0) > 0 OR COALESCE(d.boxes_23lb,0) > 0
   OR COALESCE(d.extra_trays_20lb,0) > 0 OR COALESCE(d.extra_trays_23lb,0) > 0
GROUP BY h.type;
