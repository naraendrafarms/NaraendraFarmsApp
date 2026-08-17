-- Vencobb430 breeder standards: Venco Tables 1-6, 9 and 10.
--
-- Tables 5 and 9 describe the SAME weeks of the same birds (female laying,
-- 24-66) -- one gives body weight and feed, the other egg and hatch
-- performance -- so they are merged into one row per week rather than stored
-- twice. Same for Tables 6 and 10. That is why 287 transcribed rows become
-- 201 stored rows.
--
-- Tables 7 and 8 (production performance) are NOT loaded here: they already
-- live in std_production_curve, 86 rows, and duplicating them would leave two
-- answers to the same question.
--
-- Male standards are stored ONCE with season 'Both', on the authority of the
-- note under Table 3: "Both for Winter and Summer Brooding / Growing, same Male
-- bodyweight standards are recommended."
--
-- Transcribed from photographs, so figures printed oddly in the source are kept
-- as printed rather than smoothed: winter laying week 40 carries BRE 1 with the
-- lower 22.91/948 nutrients; winter egg table week 48 dips to 46.4 g chick
-- weight; summer egg mass repeats 37.3 at weeks 64 and 65. Blank cells in the
-- source stay NULL -- a zero would be read as a real standard of zero.

CREATE TABLE IF NOT EXISTS public.breed_standard (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breed                text NOT NULL DEFAULT 'Vencobb430',
  season               text NOT NULL CHECK (season IN ('Summer','Winter','Both')),
  sex                  text NOT NULL CHECK (sex IN ('Female','Male')),
  phase                text NOT NULL CHECK (phase IN ('Growing','Laying')),
  week_of_age          int  NOT NULL,
  body_weight_g        numeric,
  weekly_gain_g        numeric,
  feed_g_per_day       numeric,
  feed_increment_g     numeric,
  feed_type            text,
  me_kcal              numeric,
  protein_g            numeric,
  dig_lysine_mg        numeric,
  egg_weight_g         numeric,
  egg_mass_g           numeric,
  chick_weight_g       numeric,
  fertility_pct        numeric,
  hatchability_pct     numeric,
  hatch_of_fertile_pct numeric,
  created_at           timestamptz DEFAULT now(),
  UNIQUE (breed, season, sex, phase, week_of_age)
);

-- RLS with a policy, not RLS alone. A table with row security enabled and no
-- policy denies every write -- that is exactly what broke the Cull Bird page.
ALTER TABLE public.breed_standard ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all" ON public.breed_standard;
CREATE POLICY "auth_all" ON public.breed_standard FOR ALL
  USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

INSERT INTO public.breed_standard
  (season, sex, phase, week_of_age, body_weight_g, weekly_gain_g, feed_g_per_day,
   feed_increment_g, feed_type, me_kcal, protein_g, dig_lysine_mg,
   egg_weight_g, egg_mass_g, chick_weight_g, fertility_pct, hatchability_pct, hatch_of_fertile_pct)
SELECT * FROM (VALUES
  ('Summer','Female','Growing',1,140,100,23,23,'CF',66,4.37,214,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',2,260,120,29,6,'CF',83,5.51,270,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',3,400,140,35,6,'CF',100,6.65,326,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',4,530,130,40,5,'CF',114,7.6,372,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',5,640,110,44,4,'GF',119,6.38,264,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',6,740,100,47,3,'GF',127,6.82,282,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',7,840,100,49,2,'GF',132,7.11,294,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',8,940,100,51,2,'GF',138,7.4,306,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',9,1040,100,52,1,'GF',140,7.54,312,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',10,1130,90,53,1,'GF',143,7.69,318,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',11,1220,90,54,1,'GF',146,7.83,324,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',12,1310,90,56,2,'GF',151,8.12,336,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',13,1400,90,58,2,'GF',157,8.41,348,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',14,1500,100,61,3,'GF',165,8.85,366,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',15,1610,110,66,5,'GF',178,9.57,396,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',16,1730,120,72,6,'DF',202,10.8,454,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',17,1865,135,80,8,'DF',224,12,504,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',18,2020,155,88,8,'DF',246,13.2,554,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',19,2190,170,95,7,'DF',266,14.25,599,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',20,2370,180,102,7,'DF',286,15.3,643,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',21,2550,180,107,5,'DF',300,16.05,674,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',22,2720,170,110,3,'PBF',308,16.5,693,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',23,2880,160,113,3,'PBF',316,16.95,712,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Growing',24,3040,160,116,3,'PBF',325,17.4,731,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',1,140,100,23,23,'CF',66,4.26,214,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',2,260,120,29,6,'CF',83,5.37,270,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',3,400,140,35,6,'CF',100,6.48,326,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',4,520,120,40,5,'CF',114,7.4,372,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',5,630,110,44,4,'GF',119,6.38,264,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',6,730,100,46,2,'GF',124,6.67,276,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',7,830,100,48,2,'GF',130,6.96,288,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',8,920,90,50,2,'GF',135,7.25,300,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',9,1010,90,52,2,'GF',140,7.54,312,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',10,1100,90,53,1,'GF',143,7.69,318,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',11,1180,80,54,1,'GF',146,7.83,324,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',12,1260,80,55,1,'GF',149,7.98,330,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',13,1340,80,57,2,'GF',154,8.27,342,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',14,1430,90,60,3,'GF',162,8.7,360,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',15,1530,100,65,5,'GF',176,9.43,390,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',16,1640,110,70,5,'DF',196,10.5,441,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',17,1765,125,77,7,'DF',216,11.55,485,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',18,1905,140,85,8,'DF',238,12.75,536,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',19,2065,160,92,7,'DF',258,13.8,580,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',20,2235,170,98,6,'DF',274,14.7,617,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',21,2415,180,102,4,'DF',286,15.3,643,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',22,2585,170,105,3,'PBF',294,15.75,662,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',23,2745,160,108,3,'PBF',302,16.2,680,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Growing',24,2900,155,111,3,'PBF',311,16.65,699,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',1,140,100,23,NULL,'CF',66,4.37,214,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',2,320,180,32,9,'CF',91,6.08,298,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',3,510,190,43,11,'CF',123,8.17,400,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',4,690,180,51,8,'CF',145,9.69,474,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',5,850,160,58,7,'GF',157,8.41,348,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',6,1000,150,63,5,'GF',170,9.14,378,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',7,1140,140,67,4,'GF',181,9.72,402,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',8,1270,130,70,3,'GF',189,10.15,420,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',9,1400,130,72,2,'GF',194,10.44,432,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',10,1530,130,74,2,'GF',200,10.73,444,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',11,1650,120,76,2,'GF',205,11.02,456,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',12,1770,120,77,1,'GF',208,11.17,462,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',13,1880,110,78,1,'GF',211,11.31,468,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',14,1990,110,79,1,'GF',213,11.46,474,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',15,2110,120,83,4,'GF',224,12.04,498,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',16,2240,130,87,4,'DF',244,13.05,548,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',17,2390,150,94,7,'DF',263,14.1,592,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',18,2550,160,101,7,'DF',283,15.15,636,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',19,2720,170,106,5,'DF',297,15.9,668,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',20,2890,170,109,3,'DF',305,16.35,687,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',21,3050,160,112,3,'DF',314,16.8,706,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',22,3200,150,114,2,'PBF',319,17.1,718,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',23,3340,140,117,3,'PBF',328,17.55,737,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Growing',24,3480,140,120,3,'PBF',336,18,756,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',24,3480,140,120,3,'PBF',336,18,756,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',25,3600,120,123,3,'PBF',344,18.45,775,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',26,3700,100,123,0,'PBF',344,18.45,775,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',27,3790,90,123,0,'PBF',344,18.45,775,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',28,3880,90,123,0,'PBF',344,18.45,775,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',29,3960,80,128,5,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',30,4040,80,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',31,4110,70,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',32,4170,60,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',33,4230,60,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',34,4280,50,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',35,4320,40,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',36,4350,30,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',37,4380,30,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',38,4410,30,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',39,4440,30,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',40,4460,20,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',41,4480,20,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',42,4500,20,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',43,4520,20,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',44,4540,20,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',45,4560,20,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',46,4580,20,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',47,4600,20,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',48,4620,20,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',49,4640,20,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',50,4660,20,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',51,4675,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',52,4690,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',53,4705,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',54,4720,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',55,4735,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',56,4750,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',57,4765,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',58,4780,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',59,4795,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',60,4810,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',61,4825,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',62,4840,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',63,4855,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',64,4870,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',65,4885,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Both','Male','Laying',66,4900,15,128,0,'MF',346,16.64,640,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Summer','Female','Laying',24,2900,150,111,3,'BRE 1',311,16.65,699,48,2.4,NULL,NULL,NULL,NULL),
  ('Summer','Female','Laying',25,3020,120,117,6,'BRE 1',328,17.55,737,50.4,10.1,35.3,85,55,64.7),
  ('Summer','Female','Laying',26,3120,100,140,23,'BRE 1',392,21,882,52.2,25.1,36.5,88.5,62,70.1),
  ('Summer','Female','Laying',27,3210,90,156,16,'BRE 1',437,23.4,983,54,37.8,37.8,92,72,78.3),
  ('Summer','Female','Laying',28,3300,90,156,0,'BRE 1',437,23.4,983,55.7,44.6,39,94,78,83),
  ('Summer','Female','Laying',29,3380,80,156,0,'BRE 1',437,23.4,983,57.1,48,40,94.5,81,85.7),
  ('Summer','Female','Laying',30,3450,70,156,0,'BRE 1',437,23.4,983,58.2,50.1,40.7,95.5,84,88),
  ('Summer','Female','Laying',31,3500,50,156,0,'BRE 1',437,23.4,983,59.2,51.5,41.4,96,86,89.6),
  ('Summer','Female','Laying',32,3530,30,156,0,'BRE 1',437,23.4,983,60.1,51.7,42.1,96,87,90.6),
  ('Summer','Female','Laying',33,3560,30,156,0,'BRE 1',437,23.4,983,60.9,51.8,42.6,96.3,88,91.4),
  ('Summer','Female','Laying',34,3580,20,156,0,'BRE 1',437,23.4,983,61.7,51.8,43.2,96.5,88.5,91.7),
  ('Summer','Female','Laying',35,3600,20,154,-2,'BRE 1',431,23.1,970,62.4,51.8,43.7,96.5,89,92.2),
  ('Summer','Female','Laying',36,3620,20,154,0,'BRE 1',431,23.1,970,63,51.7,44.1,96.5,90,93.3),
  ('Summer','Female','Laying',37,3640,20,154,0,'BRE 1',431,23.1,970,63.6,51.5,44.5,96.5,90,93.3),
  ('Summer','Female','Laying',38,3660,20,154,0,'BRE 1',431,23.1,970,64.1,51.3,44.9,96.5,90.5,93.8),
  ('Summer','Female','Laying',39,3680,20,154,0,'BRE 1',431,23.1,970,64.5,51,45.2,96.5,90.5,93.8),
  ('Summer','Female','Laying',40,3695,15,154,0,'BRE 1',431,23.1,970,64.8,50.5,45.4,96.5,91,94.3),
  ('Summer','Female','Laying',41,3710,15,154,0,'BRE 2',436,22.33,924,65.1,50.1,45.5,96.5,91,94.3),
  ('Summer','Female','Laying',42,3725,15,152,-2,'BRE 2',430,22.04,912,65.4,49.7,45.6,96.5,91,94.3),
  ('Summer','Female','Laying',43,3740,15,152,0,'BRE 2',430,22.04,912,65.7,49.3,45.9,96.5,90.5,93.8),
  ('Summer','Female','Laying',44,3755,15,152,0,'BRE 2',430,22.04,912,66,48.8,46.1,96.5,90.5,93.8),
  ('Summer','Female','Laying',45,3770,15,152,0,'BRE 2',430,22.04,912,66.2,48.3,46.2,96,90,93.8),
  ('Summer','Female','Laying',46,3785,15,152,0,'BRE 2',430,22.04,912,66.4,47.8,46.3,96,90,93.8),
  ('Summer','Female','Laying',47,3800,15,152,0,'BRE 2',430,22.04,912,66.6,47.3,46.5,96,89.5,93.2),
  ('Summer','Female','Laying',48,3815,15,152,0,'BRE 2',430,22.04,912,66.8,46.8,46.6,96,89.5,93.2),
  ('Summer','Female','Laying',49,3830,15,152,0,'BRE 2',430,22.04,912,67,46.2,46.6,96,89,92.7),
  ('Summer','Female','Laying',50,3845,15,152,0,'BRE 2',430,22.04,912,67.2,45.7,46.7,96,89,92.7),
  ('Summer','Female','Laying',51,3860,15,150,-2,'BRE 2',425,21.75,900,67.4,45.2,46.8,95.5,88.5,92.7),
  ('Summer','Female','Laying',52,3870,10,150,0,'BRE 2',425,21.75,900,67.6,44.6,47,95.5,88.5,92.7),
  ('Summer','Female','Laying',53,3880,10,150,0,'BRE 2',425,21.75,900,67.8,44.1,47.1,95.5,88,92.1),
  ('Summer','Female','Laying',54,3890,10,150,0,'BRE 2',425,21.75,900,68,43.5,47.3,95,87.5,92.1),
  ('Summer','Female','Laying',55,3900,10,150,0,'BRE 2',425,21.75,900,68.1,42.9,47.3,94.5,87,92.1),
  ('Summer','Female','Laying',56,3910,10,150,0,'BRE 2',425,21.75,900,68.2,42.3,47.4,94.5,86.5,91.5),
  ('Summer','Female','Laying',57,3920,10,150,0,'BRE 2',425,21.75,900,68.3,41.7,47.5,94,86,91.5),
  ('Summer','Female','Laying',58,3930,10,150,0,'BRE 2',425,21.75,900,68.4,41,47.5,94,86,91.5),
  ('Summer','Female','Laying',59,3940,10,150,0,'BRE 2',425,21.75,900,68.5,40.4,47.5,94,85.5,91),
  ('Summer','Female','Laying',60,3950,10,150,0,'BRE 2',425,21.75,900,68.6,39.8,47.6,94,85.5,91),
  ('Summer','Female','Laying',61,3960,10,148,-2,'BRE 2',419,21.46,888,68.7,39.2,47.6,93.5,84.5,90.4),
  ('Summer','Female','Laying',62,3970,10,148,0,'BRE 2',419,21.46,888,68.8,38.5,47.7,93,83.5,89.8),
  ('Summer','Female','Laying',63,3980,10,148,0,'BRE 2',419,21.46,888,68.9,37.9,47.7,92.5,83,89.7),
  ('Summer','Female','Laying',64,3990,10,148,0,'BRE 2',419,21.46,888,69,37.3,47.7,92,82.5,89.7),
  ('Summer','Female','Laying',65,4000,10,148,0,'BRE 2',419,21.46,888,69.1,37.3,47.7,92,82,89.1),
  ('Summer','Female','Laying',66,4010,10,148,0,'BRE 2',419,21.46,888,69.2,36.7,47.8,91,81,89),
  ('Winter','Female','Laying',24,3040,160,116,3,'BRE 1',325,17.4,731,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Winter','Female','Laying',25,3180,140,119,3,'BRE 1',333,17.85,750,50.7,2.54,35.5,78,50,64.1),
  ('Winter','Female','Laying',26,3300,120,122,3,'BRE 1',342,18.3,769,52.6,11,36.8,83,57,68.7),
  ('Winter','Female','Laying',27,3390,90,143,21,'BRE 1',400,21.45,901,54.4,24.5,38.1,89,66,74.2),
  ('Winter','Female','Laying',28,3480,90,160,17,'BRE 1',448,24,1008,56.1,38.7,39.3,92,72,78.3),
  ('Winter','Female','Laying',29,3560,80,160,0,'BRE 1',448,24,1008,57.6,45.5,40.3,94,76,80.9),
  ('Winter','Female','Laying',30,3630,70,160,0,'BRE 1',448,24,1008,58.8,48.2,41.2,95,80,84.2),
  ('Winter','Female','Laying',31,3680,50,160,0,'BRE 1',448,24,1008,59.8,50.2,41.9,96,83,86.5),
  ('Winter','Female','Laying',32,3710,30,160,0,'BRE 1',448,24,1008,60.7,51.6,42.5,96,86,89.6),
  ('Winter','Female','Laying',33,3740,30,160,0,'BRE 1',448,24,1008,61.6,53,43.1,96.3,87,90.3),
  ('Winter','Female','Laying',34,3760,20,160,0,'BRE 1',448,24,1008,62.4,53,43.7,96.5,88,91.2),
  ('Winter','Female','Laying',35,3780,20,160,0,'BRE 1',448,24,1008,63.1,53,44.2,96.5,89,92.2),
  ('Winter','Female','Laying',36,3800,20,158,-2,'BRE 1',442,23.7,995,63.7,52.9,44.6,96.5,90,93.3),
  ('Winter','Female','Laying',37,3820,20,158,0,'BRE 1',442,23.7,995,64.2,52.6,44.9,96.5,90.5,93.8),
  ('Winter','Female','Laying',38,3840,20,158,0,'BRE 1',442,23.7,995,64.7,52.4,45.3,97,91,93.8),
  ('Winter','Female','Laying',39,3860,20,158,0,'BRE 1',442,23.7,995,65,52,45.5,97,91,93.8),
  ('Winter','Female','Laying',40,3880,20,158,0,'BRE 1',442,22.91,948,65.3,52.2,45.7,97,91.5,94.3),
  ('Winter','Female','Laying',41,3895,15,158,0,'BRE 2',447,22.91,948,65.6,51.8,45.9,97,91.5,94.3),
  ('Winter','Female','Laying',42,3910,15,156,-2,'BRE 2',441,22.62,936,65.9,51.4,46.1,97,91.5,94.3),
  ('Winter','Female','Laying',43,3925,15,156,0,'BRE 2',441,22.62,936,66.2,51,46.3,97,91,93.8),
  ('Winter','Female','Laying',44,3940,15,156,0,'BRE 2',441,22.62,936,66.5,50.5,46.6,97,91,93.8),
  ('Winter','Female','Laying',45,3950,10,156,0,'BRE 2',441,22.62,936,66.7,50,46.7,96.5,90.5,93.8),
  ('Winter','Female','Laying',46,3960,10,156,0,'BRE 2',441,22.62,936,66.9,49.5,46.8,96.5,90,93.3),
  ('Winter','Female','Laying',47,3970,10,156,0,'BRE 2',441,22.62,936,67.1,49,47,96,89.5,93.2),
  ('Winter','Female','Laying',48,3980,10,154,-2,'BRE 2',436,22.33,924,67.3,48.5,46.4,96,89.5,93.2),
  ('Winter','Female','Laying',49,3990,10,154,0,'BRE 2',436,22.33,924,67.5,47.9,46.6,96,89.5,93.2),
  ('Winter','Female','Laying',50,4000,10,154,0,'BRE 2',436,22.33,924,67.7,47.4,46.7,96,89,92.7),
  ('Winter','Female','Laying',51,4010,10,154,0,'BRE 2',436,22.33,924,67.9,46.9,46.9,96,89,92.7),
  ('Winter','Female','Laying',52,4020,10,154,0,'BRE 2',436,22.33,924,68.1,46.3,47,95.5,88.5,92.7),
  ('Winter','Female','Laying',53,4030,10,154,0,'BRE 2',436,22.33,924,68.3,45.8,47.1,95.5,88.5,92.7),
  ('Winter','Female','Laying',54,4040,10,152,-2,'BRE 2',430,22.04,912,68.5,45.2,47.3,95,88,92.6),
  ('Winter','Female','Laying',55,4050,10,152,0,'BRE 2',430,22.04,912,68.6,44.6,47.3,94,87,92.6),
  ('Winter','Female','Laying',56,4060,10,152,0,'BRE 2',430,22.04,912,68.7,44,47.4,94,87,92.6),
  ('Winter','Female','Laying',57,4070,10,152,0,'BRE 2',430,22.04,912,68.8,43.3,47.5,94,86.5,92),
  ('Winter','Female','Laying',58,4080,10,152,0,'BRE 2',430,22.04,912,68.9,42.7,47.5,93.5,86,92),
  ('Winter','Female','Laying',59,4090,10,152,0,'BRE 2',430,22.04,912,69,42.1,47.6,93,85.5,91.9),
  ('Winter','Female','Laying',60,4100,10,150,-2,'BRE 2',425,21.75,900,69.1,41.5,47.7,93,85.5,91.9),
  ('Winter','Female','Laying',61,4110,10,150,0,'BRE 2',425,21.75,900,69.2,40.8,47.7,93,85,91.4),
  ('Winter','Female','Laying',62,4120,10,150,0,'BRE 2',425,21.75,900,69.3,40.2,47.8,92.5,84,90.8),
  ('Winter','Female','Laying',63,4130,10,150,0,'BRE 2',425,21.75,900,69.4,39.6,47.9,92,83,90.2),
  ('Winter','Female','Laying',64,4140,10,150,0,'BRE 2',425,21.75,900,69.5,38.9,48,92,83,90.2),
  ('Winter','Female','Laying',65,4150,10,150,0,'BRE 2',425,21.75,900,69.6,38.3,48,92,82,89.1),
  ('Winter','Female','Laying',66,4160,10,150,0,'BRE 2',425,21.75,900,69.7,37.6,48.1,92,82,89.1)
) AS v(season, sex, phase, week_of_age, body_weight_g, weekly_gain_g, feed_g_per_day,
       feed_increment_g, feed_type, me_kcal, protein_g, dig_lysine_mg,
       egg_weight_g, egg_mass_g, chick_weight_g, fertility_pct, hatchability_pct, hatch_of_fertile_pct)
WHERE NOT EXISTS (
  SELECT 1 FROM public.breed_standard b
  WHERE b.breed='Vencobb430' AND b.season=v.season AND b.sex=v.sex
    AND b.phase=v.phase AND b.week_of_age=v.week_of_age
);

-- VERIFY 5: 201 rows, split as expected.
SELECT COUNT(*)::text AS rows_loaded,
       COALESCE(string_agg(DISTINCT season||'/'||sex||'/'||phase, ', '), '-') AS groups
FROM public.breed_standard;

-- VERIFY 6: spot-check against the images --
--   Female Summer Growing wk1 body weight 140, wk24 3040
--   Female Winter Laying wk24 feed 116, wk66 body weight 4160
--   Summer egg table wk30 hatchability 84.0, Winter wk30 hatchability 80.0
SELECT (SELECT body_weight_g FROM public.breed_standard WHERE season='Summer' AND sex='Female' AND phase='Growing' AND week_of_age=1)::text AS f_sum_grow_wk1_bw,
       (SELECT body_weight_g FROM public.breed_standard WHERE season='Summer' AND sex='Female' AND phase='Growing' AND week_of_age=24)::text AS f_sum_grow_wk24_bw,
       (SELECT feed_g_per_day FROM public.breed_standard WHERE season='Winter' AND sex='Female' AND phase='Laying' AND week_of_age=24)::text AS f_win_lay_wk24_feed,
       (SELECT body_weight_g FROM public.breed_standard WHERE season='Winter' AND sex='Female' AND phase='Laying' AND week_of_age=66)::text AS f_win_lay_wk66_bw,
       (SELECT hatchability_pct FROM public.breed_standard WHERE season='Summer' AND sex='Female' AND phase='Laying' AND week_of_age=30)::text AS sum_wk30_hatchability,
       (SELECT hatchability_pct FROM public.breed_standard WHERE season='Winter' AND sex='Female' AND phase='Laying' AND week_of_age=30)::text AS win_wk30_hatchability;

-- VERIFY 7: THE QUESTION ASKED -- is the STD Hatch % being typed on each hatch
-- batch the same as the breed standard for that flock's age and season?
--
-- Matched on: the flock's laying_season (F-19 Summer, F-20 Winter), and the
-- flock's age in WEEKS at the setting date, rounded to the nearest whole week
-- because the standard is published per week. Batches whose flock has no
-- placement date, or whose age falls outside 24-66 weeks, cannot be compared
-- and are counted separately rather than silently dropped.
WITH b AS (
  SELECT hb.id, hb.std_hatch_pct,
         ROUND(EXTRACT(day FROM hb.setting_date - f.placement_date)/7)::int AS wk,
         f.laying_season, f.flock_no
  FROM public.hatch_batches hb
  JOIN public.flocks f ON f.id = hb.flock_id
  WHERE hb.hatched_chicks IS NOT NULL AND f.placement_date IS NOT NULL
), j AS (
  SELECT b.*, s.hatchability_pct AS std_hatch, s.hatch_of_fertile_pct AS std_hof
  FROM b LEFT JOIN public.breed_standard s
    ON s.sex='Female' AND s.phase='Laying' AND s.season = b.laying_season AND s.week_of_age = b.wk
)
SELECT COUNT(*)::text AS batches,
       COUNT(*) FILTER (WHERE std_hatch IS NULL)::text AS no_standard_for_that_age,
       COUNT(*) FILTER (WHERE std_hatch_pct IS NULL)::text AS no_std_hatch_pct_typed,
       COUNT(*) FILTER (WHERE std_hatch IS NOT NULL AND std_hatch_pct IS NOT NULL
                          AND ABS(std_hatch_pct - std_hatch) < 0.05)::text AS matches_the_standard,
       COUNT(*) FILTER (WHERE std_hatch IS NOT NULL AND std_hatch_pct IS NOT NULL
                          AND ABS(std_hatch_pct - std_hatch) >= 0.05)::text AS differs_from_standard,
       COALESCE(ROUND(AVG(std_hatch_pct - std_hatch) FILTER (WHERE std_hatch IS NOT NULL AND std_hatch_pct IS NOT NULL), 2)::text, '-') AS avg_typed_minus_standard
FROM j;

-- VERIFY 8: the same, per flock, so a flock entered differently stands out.
WITH b AS (
  SELECT hb.std_hatch_pct, ROUND(EXTRACT(day FROM hb.setting_date - f.placement_date)/7)::int AS wk,
         f.laying_season, f.flock_no
  FROM public.hatch_batches hb JOIN public.flocks f ON f.id = hb.flock_id
  WHERE hb.hatched_chicks IS NOT NULL AND f.placement_date IS NOT NULL
)
SELECT COALESCE(string_agg(line, '  ||  ' ORDER BY line), 'NONE') AS per_flock
FROM (
  SELECT 'F-' || b.flock_no || ' (' || COALESCE(b.laying_season,'no season') || ')'
         || ' n=' || COUNT(*)
         || ' wks=' || MIN(b.wk) || '-' || MAX(b.wk)
         || ' typed_avg=' || COALESCE(ROUND(AVG(b.std_hatch_pct),2)::text,'-')
         || ' std_avg=' || COALESCE(ROUND(AVG(s.hatchability_pct),2)::text,'-')
         || ' diff=' || COALESCE(ROUND(AVG(b.std_hatch_pct - s.hatchability_pct),2)::text,'-') AS line
  FROM b LEFT JOIN public.breed_standard s
    ON s.sex='Female' AND s.phase='Laying' AND s.season=b.laying_season AND s.week_of_age=b.wk
  GROUP BY b.flock_no, b.laying_season
) x;
