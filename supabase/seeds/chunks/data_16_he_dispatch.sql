-- HE Dispatch data for Flocks 19 & 20 (all dispatches to Hitech)
SET session_replication_role = replica;

INSERT INTO public.he_dispatch
  (flock_id, dispatch_date, prod_date, dc_no, total_dispatched, free_eggs,
   grade_a, grade_b, rate, amount, setting_date, hatch_date, remarks)
VALUES
-- FLOCK 19
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-10-02','2023-10-02',1,3780,0,3700,80,6.50,24570,'2023-10-04','2023-10-25','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-10-05','2023-10-05',2,3600,0,3520,80,6.50,23400,'2023-10-06','2023-10-27','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-10-09','2023-10-09',3,4200,0,4110,90,6.50,27300,'2023-10-11','2023-11-01','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-10-12','2023-10-12',4,3900,0,3820,80,6.50,25350,'2023-10-14','2023-11-04','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-10-16','2023-10-16',5,4100,0,4020,80,6.50,26650,'2023-10-18','2023-11-08','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-10-19','2023-10-19',6,3800,0,3720,80,6.50,24700,'2023-10-21','2023-11-11','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-10-23','2023-10-23',7,4300,0,4200,100,6.50,27950,'2023-10-25','2023-11-15','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-10-26','2023-10-26',8,4000,0,3910,90,6.50,26000,'2023-10-28','2023-11-18','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-10-30','2023-10-30',9,4200,0,4110,90,6.50,27300,'2023-11-01','2023-11-22','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-11-02','2023-11-02',10,4100,0,4010,90,6.50,26650,'2023-11-04','2023-11-25','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-11-06','2023-11-06',11,3900,0,3820,80,6.50,25350,'2023-11-08','2023-11-29','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-11-09','2023-11-09',12,4200,0,4120,80,6.50,27300,'2023-11-11','2023-12-02','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-11-13','2023-11-13',13,4400,0,4310,90,6.50,28600,'2023-11-15','2023-12-06','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-11-16','2023-11-16',14,4100,0,4010,90,6.50,26650,'2023-11-18','2023-12-09','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-11-20','2023-11-20',15,4000,0,3920,80,6.50,26000,'2023-11-22','2023-12-13','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-11-23','2023-11-23',16,4200,0,4120,80,6.50,27300,'2023-11-25','2023-12-16','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-11-27','2023-11-27',17,4400,0,4310,90,6.50,28600,'2023-11-29','2023-12-20','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-11-30','2023-11-30',18,4100,0,4015,85,6.50,26650,'2023-12-02','2023-12-23','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-12-04','2023-12-04',19,4200,0,4110,90,6.50,27300,'2023-12-06','2023-12-27','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-12-07','2023-12-07',20,4300,0,4215,85,6.50,27950,'2023-12-09','2023-12-30','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-12-11','2023-12-11',21,4000,0,3915,85,6.50,26000,'2023-12-13','2024-01-03','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-12-14','2023-12-14',22,4100,0,4015,85,6.50,26650,'2023-12-16','2024-01-06','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-12-18','2023-12-18',23,4200,0,4120,80,6.50,27300,'2023-12-20','2024-01-10','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-12-21','2023-12-21',24,4400,0,4315,85,6.50,28600,'2023-12-23','2024-01-13','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='19' LIMIT 1),'2023-12-25','2023-12-25',25,4300,0,4215,85,6.50,27950,'2023-12-27','2024-01-17','Hitech'),
-- FLOCK 20
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-10-05','2023-10-05',1,3600,0,3520,80,6.50,23400,'2023-10-07','2023-10-28','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-10-09','2023-10-09',2,3800,0,3718,82,6.50,24700,'2023-10-11','2023-11-01','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-10-12','2023-10-12',3,4000,0,3912,88,6.50,26000,'2023-10-14','2023-11-04','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-10-16','2023-10-16',4,4100,0,4012,88,6.50,26650,'2023-10-18','2023-11-08','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-10-19','2023-10-19',5,4200,0,4115,85,6.50,27300,'2023-10-21','2023-11-11','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-10-23','2023-10-23',6,4000,0,3912,88,6.50,26000,'2023-10-25','2023-11-15','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-10-26','2023-10-26',7,4200,0,4115,85,6.50,27300,'2023-10-28','2023-11-18','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-10-30','2023-10-30',8,4000,0,3912,88,6.50,26000,'2023-11-01','2023-11-22','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-11-02','2023-11-02',9,4100,0,4012,88,6.50,26650,'2023-11-04','2023-11-25','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-11-06','2023-11-06',10,4200,0,4115,85,6.50,27300,'2023-11-08','2023-11-29','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-11-09','2023-11-09',11,4300,0,4215,85,6.50,27950,'2023-11-11','2023-12-02','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-11-13','2023-11-13',12,4000,0,3912,88,6.50,26000,'2023-11-15','2023-12-06','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-11-16','2023-11-16',13,4200,0,4115,85,6.50,27300,'2023-11-18','2023-12-09','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-11-20','2023-11-20',14,4100,0,4012,88,6.50,26650,'2023-11-22','2023-12-13','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-11-23','2023-11-23',15,4300,0,4215,85,6.50,27950,'2023-11-25','2023-12-16','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-11-27','2023-11-27',16,4200,0,4115,85,6.50,27300,'2023-11-29','2023-12-20','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-11-30','2023-11-30',17,4000,0,3912,88,6.50,26000,'2023-12-02','2023-12-23','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-12-04','2023-12-04',18,4200,0,4115,85,6.50,27300,'2023-12-06','2023-12-27','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-12-07','2023-12-07',19,4300,0,4215,85,6.50,27950,'2023-12-09','2023-12-30','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-12-11','2023-12-11',20,4100,0,4012,88,6.50,26650,'2023-12-13','2024-01-03','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-12-14','2023-12-14',21,4000,0,3912,88,6.50,26000,'2023-12-16','2024-01-06','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-12-18','2023-12-18',22,4200,0,4115,85,6.50,27300,'2023-12-20','2024-01-10','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-12-21','2023-12-21',23,4300,0,4215,85,6.50,27950,'2023-12-23','2024-01-13','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-12-25','2023-12-25',24,4000,0,3912,88,6.50,26000,'2023-12-27','2024-01-17','Hitech'),
((SELECT id FROM public.flocks WHERE flock_no='20' LIMIT 1),'2023-12-28','2023-12-28',25,4100,0,4012,88,6.50,26650,'2023-12-30','2024-01-20','Hitech')
ON CONFLICT DO NOTHING;

RESET session_replication_role;
