SELECT string_agg(name, ' | ') FROM public.parties
WHERE name IN ('Venkatadri Hatcheries - Bhaskar Reddy', 'Ellandula Srinivas Eggs');
