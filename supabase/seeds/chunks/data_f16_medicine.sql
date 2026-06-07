-- Flock 16 Medicine Master & Usage
INSERT INTO public.medicines_master (name)
VALUES
  ('AIBV-IBMA5'),
  ('Ambiplex'),
  ('Aquamax 5L'),
  ('Avain Encephalomyelitis and Inclusion Body Hepatitis(IBH)/Hydropercardium Syndrome(HPS)Vaccine ,Inactivated.IP/AE & IBH & HPS (IB ASTRO) (1000 DOSE)'),
  ('Avian Encephalomyelitis Vaccine Inactivated - 500ML-    1000 Doses / AE KILLED (1000 DOSE)'),
  ('Avian Infectious bronochitis Vaccine Live,Massachusetts Strain IP 1000 Doses / IB LIVE (1000 DOSE)MASS'),
  ('Avian Reo Virus Vaccine ,Inactivated IP VET-500ML    -   1000 Doses / AVIAN REO KILLED (1000 DOSE)'),
  ('Avian Reo Virus Vaccine ,Inactivated IP VET-500ML- 1000 Doses /  AVIAN REO KILLED (1000 DOSE)'),
  ('B 904 5L'),
  ('BVCLO2 Tablet'),
  ('BVClo2 Chlorine Dioxide Tablets 10 Grams'),
  ('Becobest Vet inj -Multi Vitamin'),
  ('Bio Buster Plus 500 Grams'),
  ('Bronchine killed'),
  ('Electrocare Plus-1kg'),
  ('Enrocin 5L'),
  ('Famitone'),
  ('Famitone 1L'),
  ('Fowl Cholera T1,T3,T4 Serotypes And Infectious coryza A,B,C2,C3 Serotypes Vaccine Inactivated 500ML-1000 Doses/FC+IC KILLED-FOWL CHOLERA-1000 DOSE'),
  ('Fowlpox Vaccine Live,IP 1000 Doses / FOWL POX LIVE (1000 DOSE)'),
  ('Gentamicin'),
  ('Gentamicin INJ 100 ML'),
  ('Gumboro (1000 Doses)/ILT 1000 Doses'),
  ('Hipraviar Clone Or H120 2500 Doses'),
  ('Hivit-Multi Vitamin INJ 100 ML'),
  ('IBD intermediate plus'),
  ('IBDVI Live IP'),
  ('Inclusion Body/IBH Killed'),
  ('Infectious Bursal Disesase Vaccine Inactivated IP-200 ML-400 Doses / IBD KILLED -400 Dose/IBDK'),
  ('Infectious Bursal Disesase Vaccine Intermediate Plus Type Live,IP / INTERMEDIATE TYPE (1000 DOSE)'),
  ('KAYSOL FORTE 50GM'),
  ('KEMRAKSHA + 5L'),
  ('Kohrsolin 5 Ltrs'),
  ('Liv-52'),
  ('Live 52 5L'),
  ('MDV-HVT+SB1'),
  ('Mycoplasma Gallisepticum Vaccine Inactivated BP - 500ML / MG KILLED-1000 DOES'),
  ('ND Lasota 1000'),
  ('New Castle Disease Ranikhet Disease Vaccine Live Mesogenic R2B Strain/ R2B Live 1000 Doses'),
  ('New Castle Disease and avain Infectious Bronchitis(Masschusetts and Nephropathic (Strain) Vaccine,Inactivated .(NBIBMN-1000 Doses)/ND+IB KILLED (1000 DOSE)'),
  ('Newcastle Disease Vaccine Inactivated Ranikhet Disease-500 ML / ND Killed'),
  ('Newcastle Disesase Vaccine,Inactivated Pullet-ND Lasota Strain-500 ML / VVND HP (White) KILLED (2000 DOSE)'),
  ('Newcastle Disesase Vaccine,Inactivated Pullet-ND Lasota Strain-500 ML / VVND LP (GREEN) KILLED (2000 DOSE)'),
  ('Nobillis CAVP4 1000 DS'),
  ('Nobils REO live 1000 DS'),
  ('Nobils REO live 1000 DS/REO LIVE'),
  ('Oxy Tetra'),
  ('OxytetraCycline  LA INJ IP 50ML/OTC LA INJ (50 ML)'),
  ('Promed'),
  ('SafeGuard 5L'),
  ('Salmonella Polyvalent Vaccine Inactivated IP (500 ml) / SALMONELLA KILLED (1000 DOSE)'),
  ('Solucal'),
  ('Tilmovet'),
  ('Trysil Dry 1kg'),
  ('VVAANDOX'),
  ('VVND-Inactivated Pullet-White'),
  ('Ventrimisole'),
  ('Ventriplex M 4X -5 L')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.medicine_usage (
  flock_id, usage_date, medicine_id, quantity, unit, rate, amount
) VALUES
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-23',
    (SELECT id FROM public.medicines_master WHERE name='Solucal' LIMIT 1),
    6, 'Litres', 138.4, 830.4000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-23',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    3, 'Litres', 580, 1740
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-23',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    1, 'Nos', 23.6, 23.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-23',
    (SELECT id FROM public.medicines_master WHERE name='AIBV-IBMA5' LIMIT 1),
    29000, 'Doses', 0.1113, 3227.7
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-23',
    (SELECT id FROM public.medicines_master WHERE name='MDV-HVT+SB1' LIMIT 1),
    58000, 'Doses', 2.06, 119480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-23',
    (SELECT id FROM public.medicines_master WHERE name='Tilmovet' LIMIT 1),
    450, 'Milli Ltrs', 10.85, 4882.5
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-24',
    (SELECT id FROM public.medicines_master WHERE name='Solucal' LIMIT 1),
    10, 'Litres', 138.4, 1384
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-24',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    5, 'Litres', 580, 2900
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-24',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    1, 'Nos', 23.6, 23.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-24',
    (SELECT id FROM public.medicines_master WHERE name='AIBV-IBMA5' LIMIT 1),
    22000, 'Doses', 0.1113, 2448.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-24',
    (SELECT id FROM public.medicines_master WHERE name='MDV-HVT+SB1' LIMIT 1),
    44000, 'Doses', 2.06, 90640
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-24',
    (SELECT id FROM public.medicines_master WHERE name='Tilmovet' LIMIT 1),
    500, 'Milli Ltrs', 10.85, 5425
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-25',
    (SELECT id FROM public.medicines_master WHERE name='Solucal' LIMIT 1),
    6, 'Litres', 138.4, 830.4000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-25',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    3, 'Litres', 580, 1740
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-25',
    (SELECT id FROM public.medicines_master WHERE name='Tilmovet' LIMIT 1),
    500, 'Milli Ltrs', 10.85, 5425
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-26',
    (SELECT id FROM public.medicines_master WHERE name='Solucal' LIMIT 1),
    8, 'Litres', 138.4, 1107.2
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-26',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    4, 'Litres', 580, 2320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-26',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    4, 'Nos', 23.6, 94.4
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-26',
    (SELECT id FROM public.medicines_master WHERE name='Tilmovet' LIMIT 1),
    470, 'Milli Ltrs', 10.85, 5099.5
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-26',
    (SELECT id FROM public.medicines_master WHERE name='OxytetraCycline  LA INJ IP 50ML/OTC LA INJ (50 ML)' LIMIT 1),
    50, 'Mili Liters', 2.5984, 129.92
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-26',
    (SELECT id FROM public.medicines_master WHERE name='Becobest Vet inj -Multi Vitamin' LIMIT 1),
    50, 'Mili Liters', 1.04, 52
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-27',
    (SELECT id FROM public.medicines_master WHERE name='Solucal' LIMIT 1),
    10, 'Litres', 138.4, 1384
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-27',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    5, 'Litres', 580, 2900
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-27',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    4, 'Nos', 23.6, 94.4
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-28',
    (SELECT id FROM public.medicines_master WHERE name='Solucal' LIMIT 1),
    10, 'Litres', 138.4, 1384
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-28',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    5, 'Litres', 580, 2900
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-28',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    4, 'Nos', 23.6, 94.4
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-28',
    (SELECT id FROM public.medicines_master WHERE name='Oxy Tetra' LIMIT 1),
    50, 'Mili Liters', 2.5984, 129.92
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-28',
    (SELECT id FROM public.medicines_master WHERE name='Becobest Vet inj -Multi Vitamin' LIMIT 1),
    50, 'Mili Liters', 1.04, 52
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-28',
    (SELECT id FROM public.medicines_master WHERE name='ND Lasota 1000' LIMIT 1),
    51000, 'Doses', 0.1638, 8353.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-29',
    (SELECT id FROM public.medicines_master WHERE name='VVAANDOX' LIMIT 1),
    400, 'Grams', 1.792, 716.8000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-29',
    (SELECT id FROM public.medicines_master WHERE name='Liv-52' LIMIT 1),
    1.2, 'Litres', 99, 118.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-29',
    (SELECT id FROM public.medicines_master WHERE name='Ambiplex' LIMIT 1),
    4, 'Nos', 116, 464
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-29',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    2, 'Nos', 23.6, 47.2
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-30',
    (SELECT id FROM public.medicines_master WHERE name='VVAANDOX' LIMIT 1),
    400, 'Grams', 1.792, 716.8000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-30',
    (SELECT id FROM public.medicines_master WHERE name='Liv-52' LIMIT 1),
    1.2, 'Litres', 99, 118.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-30',
    (SELECT id FROM public.medicines_master WHERE name='Ambiplex' LIMIT 1),
    4, 'Nos', 116, 464
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-30',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    3, 'Nos', 23.6, 70.80000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-30',
    (SELECT id FROM public.medicines_master WHERE name='IBDVI Live IP' LIMIT 1),
    51000, 'Doses', 0.1785, 9103.5
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-11-30',
    (SELECT id FROM public.medicines_master WHERE name='SafeGuard 5L' LIMIT 1),
    4, 'liters', 268.568, 1074.272
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-01',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    200, 'Grams', 1.6, 320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-01',
    (SELECT id FROM public.medicines_master WHERE name='VVAANDOX' LIMIT 1),
    400, 'Grams', 1.792, 716.8000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-01',
    (SELECT id FROM public.medicines_master WHERE name='Liv-52' LIMIT 1),
    1.2, 'Litres', 99, 118.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-01',
    (SELECT id FROM public.medicines_master WHERE name='Ambiplex' LIMIT 1),
    4, 'Nos', 116, 464
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-01',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    4, 'Nos', 23.6, 94.4
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-02',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    400, 'Grams', 1.6, 640
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-02',
    (SELECT id FROM public.medicines_master WHERE name='VVAANDOX' LIMIT 1),
    400, 'Grams', 1.792, 716.8000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-02',
    (SELECT id FROM public.medicines_master WHERE name='Liv-52' LIMIT 1),
    1.2, 'Litres', 99, 118.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-02',
    (SELECT id FROM public.medicines_master WHERE name='Ambiplex' LIMIT 1),
    4, 'Nos', 116, 464
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-02',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    4, 'Nos', 23.6, 94.4
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-03',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    200, 'Grams', 1.6, 320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-03',
    (SELECT id FROM public.medicines_master WHERE name='VVAANDOX' LIMIT 1),
    400, 'Grams', 1.792, 716.8000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-03',
    (SELECT id FROM public.medicines_master WHERE name='Liv-52' LIMIT 1),
    1.2, 'Litres', 99, 118.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-03',
    (SELECT id FROM public.medicines_master WHERE name='Ambiplex' LIMIT 1),
    4, 'Nos', 116, 464
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-03',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    8, 'Nos', 23.6, 188.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-04',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    100, 'Grams', 1.6, 160
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-04',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    8, 'Nos', 23.6, 188.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-04',
    (SELECT id FROM public.medicines_master WHERE name='New Castle Disease and avain Infectious Bronchitis(Masschusetts and Nephropathic (Strain) Vaccine,Inactivated .(NBIBMN-1000 Doses)/ND+IB KILLED (1000 DOSE)' LIMIT 1),
    43000, 'Doses', 3.302, 141986
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-05',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    8, 'Nos', 23.6, 188.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-06',
    (SELECT id FROM public.medicines_master WHERE name='Tilmovet' LIMIT 1),
    1920, 'Milli Ltrs', 10.85, 20832
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-06',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    12, 'Nos', 23.6, 283.20000000000005
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-07',
    (SELECT id FROM public.medicines_master WHERE name='Tilmovet' LIMIT 1),
    1920, 'Milli Ltrs', 10.85, 20832
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-07',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-08',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    8, 'Nos', 23.6, 188.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-08',
    (SELECT id FROM public.medicines_master WHERE name='VVND-Inactivated Pullet-White' LIMIT 1),
    52000, 'Doses', 2.62385, 136440.2
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-09',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-09',
    (SELECT id FROM public.medicines_master WHERE name='Bronchine killed' LIMIT 1),
    18000, 'Doses', 2.9106, 52390.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-09',
    (SELECT id FROM public.medicines_master WHERE name='IBD intermediate plus' LIMIT 1),
    18000, 'Doses', 0.241, 4338
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-10',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    12, 'Nos', 23.6, 283.20000000000005
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-10',
    (SELECT id FROM public.medicines_master WHERE name='Bronchine killed' LIMIT 1),
    16000, 'Doses', 2.9106, 46569.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-10',
    (SELECT id FROM public.medicines_master WHERE name='IBD intermediate plus' LIMIT 1),
    16000, 'Doses', 0.241, 3856
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-10',
    (SELECT id FROM public.medicines_master WHERE name='Promed' LIMIT 1),
    5, 'Kg', 925, 4625
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-11',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-11',
    (SELECT id FROM public.medicines_master WHERE name='Promed' LIMIT 1),
    5, 'Kg', 925, 4625
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-11',
    (SELECT id FROM public.medicines_master WHERE name='Bronchine killed' LIMIT 1),
    18000, 'Doses', 2.9106, 52390.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-11',
    (SELECT id FROM public.medicines_master WHERE name='IBD intermediate plus' LIMIT 1),
    17000, 'Doses', 0.241, 4097
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-11',
    (SELECT id FROM public.medicines_master WHERE name='Inclusion Body/IBH Killed' LIMIT 1),
    5000, 'Doses', 1.65375, 8268.75
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-12',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-12',
    (SELECT id FROM public.medicines_master WHERE name='Promed' LIMIT 1),
    5, 'Kg', 925, 4625
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-12',
    (SELECT id FROM public.medicines_master WHERE name='Inclusion Body/IBH Killed' LIMIT 1),
    19000, 'Doses', 1.65375, 31421.25
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-13',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    15, 'Nos', 23.6, 354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-13',
    (SELECT id FROM public.medicines_master WHERE name='Promed' LIMIT 1),
    5, 'Kg', 925, 4625
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-13',
    (SELECT id FROM public.medicines_master WHERE name='Inclusion Body/IBH Killed' LIMIT 1),
    26000, 'Doses', 1.65375, 42997.5
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-14',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-14',
    (SELECT id FROM public.medicines_master WHERE name='Promed' LIMIT 1),
    5, 'Kg', 925, 4625
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-14',
    (SELECT id FROM public.medicines_master WHERE name='Newcastle Disease Vaccine Inactivated Ranikhet Disease-500 ML / ND Killed' LIMIT 1),
    16000, 'Doses', 1.07625, 17220
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-14',
    (SELECT id FROM public.medicines_master WHERE name='Avian Infectious bronochitis Vaccine Live,Massachusetts Strain IP 1000 Doses / IB LIVE (1000 DOSE)MASS' LIMIT 1),
    16000, 'Doses', 0.111, 1776
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-15',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-15',
    (SELECT id FROM public.medicines_master WHERE name='Promed' LIMIT 1),
    5, 'Kg', 925, 4625
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-15',
    (SELECT id FROM public.medicines_master WHERE name='Newcastle Disease Vaccine Inactivated Ranikhet Disease-500 ML / ND Killed' LIMIT 1),
    24000, 'Doses', 1.07625, 25830
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-15',
    (SELECT id FROM public.medicines_master WHERE name='Avian Infectious bronochitis Vaccine Live,Massachusetts Strain IP 1000 Doses / IB LIVE (1000 DOSE)MASS' LIMIT 1),
    24000, 'Doses', 0.111, 2664
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-16',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-16',
    (SELECT id FROM public.medicines_master WHERE name='Newcastle Disease Vaccine Inactivated Ranikhet Disease-500 ML / ND Killed' LIMIT 1),
    12000, 'Doses', NULL, 0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-16',
    (SELECT id FROM public.medicines_master WHERE name='Avian Infectious bronochitis Vaccine Live,Massachusetts Strain IP 1000 Doses / IB LIVE (1000 DOSE)MASS' LIMIT 1),
    11000, 'Doses', 0.111, 1221
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-16',
    (SELECT id FROM public.medicines_master WHERE name='Nobils REO live 1000 DS' LIMIT 1),
    9000, 'Doses', 2.73, 24570
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-17',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-17',
    (SELECT id FROM public.medicines_master WHERE name='Nobils REO live 1000 DS' LIMIT 1),
    25000, 'Doses', 2.73, 68250
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-18',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-18',
    (SELECT id FROM public.medicines_master WHERE name='Nobils REO live 1000 DS' LIMIT 1),
    17000, 'Doses', 2.73, 46410
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-18',
    (SELECT id FROM public.medicines_master WHERE name='Avian Reo Virus Vaccine ,Inactivated IP VET-500ML- 1000 Doses /  AVIAN REO KILLED (1000 DOSE)' LIMIT 1),
    14000, 'Doses', 2.122, 29708
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-18',
    (SELECT id FROM public.medicines_master WHERE name='Hivit-Multi Vitamin INJ 100 ML' LIMIT 1),
    100, 'Mili liters', 1.1424, 114.24000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-18',
    (SELECT id FROM public.medicines_master WHERE name='Infectious Bursal Disesase Vaccine Intermediate Plus Type Live,IP / INTERMEDIATE TYPE (1000 DOSE)' LIMIT 1),
    14000, 'Doses', 0.241, 3374
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-19',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    15, 'Nos', 23.6, 354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-19',
    (SELECT id FROM public.medicines_master WHERE name='Avian Reo Virus Vaccine ,Inactivated IP VET-500ML- 1000 Doses /  AVIAN REO KILLED (1000 DOSE)' LIMIT 1),
    18000, 'Doses', 2.122, 38196
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-19',
    (SELECT id FROM public.medicines_master WHERE name='Infectious Bursal Disesase Vaccine Intermediate Plus Type Live,IP / INTERMEDIATE TYPE (1000 DOSE)' LIMIT 1),
    18000, 'Doses', 0.241, 4338
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-20',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    15, 'Nos', 23.6, 354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-20',
    (SELECT id FROM public.medicines_master WHERE name='Avian Reo Virus Vaccine ,Inactivated IP VET-500ML- 1000 Doses /  AVIAN REO KILLED (1000 DOSE)' LIMIT 1),
    20000, 'Doses', 2.122, 42440
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-20',
    (SELECT id FROM public.medicines_master WHERE name='Infectious Bursal Disesase Vaccine Intermediate Plus Type Live,IP / INTERMEDIATE TYPE (1000 DOSE)' LIMIT 1),
    19000, 'Doses', 0.241, 4579
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-21',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    15, 'Nos', 23.6, 354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-21',
    (SELECT id FROM public.medicines_master WHERE name='Fowlpox Vaccine Live,IP 1000 Doses / FOWL POX LIVE (1000 DOSE)' LIMIT 1),
    24000, 'Doses', 0.131, 3144
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-22',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    15, 'Nos', 23.6, 354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-22',
    (SELECT id FROM public.medicines_master WHERE name='Fowlpox Vaccine Live,IP 1000 Doses / FOWL POX LIVE (1000 DOSE)' LIMIT 1),
    27000, 'Doses', 0.131, 3537
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-23',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    15, 'Nos', 23.6, 354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-24',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    15, 'Nos', 23.6, 354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-24',
    (SELECT id FROM public.medicines_master WHERE name='Gumboro (1000 Doses)/ILT 1000 Doses' LIMIT 1),
    40000, 'Doses', 1.57, 62800
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-24',
    (SELECT id FROM public.medicines_master WHERE name='OxytetraCycline  LA INJ IP 50ML/OTC LA INJ (50 ML)' LIMIT 1),
    50, 'Mili Liters', 2.5984, 129.92
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-25',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    16, 'Nos', 23.6, 377.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-25',
    (SELECT id FROM public.medicines_master WHERE name='Gumboro (1000 Doses)/ILT 1000 Doses' LIMIT 1),
    11000, 'Doses', 1.57, 17270
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-26',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    16, 'Nos', 23.6, 377.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-27',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    16, 'Nos', 23.6, 377.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-28',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    16, 'Nos', 23.6, 377.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-28',
    (SELECT id FROM public.medicines_master WHERE name='Famitone 1L' LIMIT 1),
    5, 'Liters', 580, 2900
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-29',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    16, 'Nos', 23.6, 377.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-29',
    (SELECT id FROM public.medicines_master WHERE name='Famitone 1L' LIMIT 1),
    5, 'Liters', 580, 2900
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-30',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    16, 'Nos', 23.6, 377.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-30',
    (SELECT id FROM public.medicines_master WHERE name='Famitone 1L' LIMIT 1),
    5, 'Liters', 580, 2900
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-31',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2023-12-31',
    (SELECT id FROM public.medicines_master WHERE name='Famitone 1L' LIMIT 1),
    5, 'Liters', 580, 2900
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-01',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-02',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    20, 'Nos', 23.6, 472
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-03',
    (SELECT id FROM public.medicines_master WHERE name='BVClo2 Chlorine Dioxide Tablets 10 Grams' LIMIT 1),
    16, 'Nos', 23.6, 377.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-04',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-05',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-05',
    (SELECT id FROM public.medicines_master WHERE name='Tilmovet' LIMIT 1),
    3840, 'Milli Ltrs', 10.85, 41664
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-05',
    (SELECT id FROM public.medicines_master WHERE name='Newcastle Disesase Vaccine,Inactivated Pullet-ND Lasota Strain-500 ML / VVND LP (GREEN) KILLED (2000 DOSE)' LIMIT 1),
    20000, 'Doses', 0.972, 19440
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-06',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-06',
    (SELECT id FROM public.medicines_master WHERE name='Tilmovet' LIMIT 1),
    3840, 'Milli Ltrs', 10.85, 41664
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-06',
    (SELECT id FROM public.medicines_master WHERE name='Newcastle Disesase Vaccine,Inactivated Pullet-ND Lasota Strain-500 ML / VVND LP (GREEN) KILLED (2000 DOSE)' LIMIT 1),
    31000, 'Doses', 0.972, 30132
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-07',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-07',
    (SELECT id FROM public.medicines_master WHERE name='OxytetraCycline  LA INJ IP 50ML/OTC LA INJ (50 ML)' LIMIT 1),
    50, 'Mili Liters', 2.5984, 129.92
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-08',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-08',
    (SELECT id FROM public.medicines_master WHERE name='Nobillis CAVP4 1000 DS' LIMIT 1),
    26000, 'Doses', 6.615, 171990
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-09',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-09',
    (SELECT id FROM public.medicines_master WHERE name='Nobillis CAVP4 1000 DS' LIMIT 1),
    25000, 'Doses', 6.615, 165375
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-10',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-11',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-11',
    (SELECT id FROM public.medicines_master WHERE name='Avian Reo Virus Vaccine ,Inactivated IP VET-500ML    -   1000 Doses / AVIAN REO KILLED (1000 DOSE)' LIMIT 1),
    25000, 'Doses', 2.122, 53050
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-12',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-12',
    (SELECT id FROM public.medicines_master WHERE name='Famitone 1L' LIMIT 1),
    5, 'Liters', 580, 2900
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-12',
    (SELECT id FROM public.medicines_master WHERE name='Gentamicin' LIMIT 1),
    100, 'ML', 1.168, 116.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-12',
    (SELECT id FROM public.medicines_master WHERE name='Avian Reo Virus Vaccine ,Inactivated IP VET-500ML    -   1000 Doses / AVIAN REO KILLED (1000 DOSE)' LIMIT 1),
    27000, 'Doses', 2.122, 57294
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-13',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-13',
    (SELECT id FROM public.medicines_master WHERE name='Famitone 1L' LIMIT 1),
    5, 'Liters', 580, 2900
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-13',
    (SELECT id FROM public.medicines_master WHERE name='Hivit-Multi Vitamin INJ 100 ML' LIMIT 1),
    100, 'ML', 1.1424, 114.24000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-14',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-15',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-15',
    (SELECT id FROM public.medicines_master WHERE name='Fowl Cholera T1,T3,T4 Serotypes And Infectious coryza A,B,C2,C3 Serotypes Vaccine Inactivated 500ML-1000 Doses/FC+IC KILLED-FOWL CHOLERA-1000 DOSE' LIMIT 1),
    22500, 'Doses', 2.48, 55800
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-15',
    (SELECT id FROM public.medicines_master WHERE name='Hipraviar Clone Or H120 2500 Doses' LIMIT 1),
    22500, 'Doses', 0.231, 5197.5
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-16',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-16',
    (SELECT id FROM public.medicines_master WHERE name='Fowl Cholera T1,T3,T4 Serotypes And Infectious coryza A,B,C2,C3 Serotypes Vaccine Inactivated 500ML-1000 Doses/FC+IC KILLED-FOWL CHOLERA-1000 DOSE' LIMIT 1),
    25000, 'Doses', 2.48, 62000
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-16',
    (SELECT id FROM public.medicines_master WHERE name='Hipraviar Clone Or H120 2500 Doses' LIMIT 1),
    25000, 'Doses', 0.231, 5775
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-17',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-17',
    (SELECT id FROM public.medicines_master WHERE name='Fowl Cholera T1,T3,T4 Serotypes And Infectious coryza A,B,C2,C3 Serotypes Vaccine Inactivated 500ML-1000 Doses/FC+IC KILLED-FOWL CHOLERA-1000 DOSE' LIMIT 1),
    4500, 'Doses', 2.48, 11160
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-17',
    (SELECT id FROM public.medicines_master WHERE name='Hipraviar Clone Or H120 2500 Doses' LIMIT 1),
    5000, 'Doses', 0.231, 1155
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-18',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-18',
    (SELECT id FROM public.medicines_master WHERE name='Hivit-Multi Vitamin INJ 100 ML' LIMIT 1),
    100, 'ML', 1.1424, 114.24000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-19',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-19',
    (SELECT id FROM public.medicines_master WHERE name='Salmonella Polyvalent Vaccine Inactivated IP (500 ml) / SALMONELLA KILLED (1000 DOSE)' LIMIT 1),
    20000, 'Doses', 2.976, 59520
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-20',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    20, 'Nos', 23.6, 472
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-20',
    (SELECT id FROM public.medicines_master WHERE name='Ventrimisole' LIMIT 1),
    4000, 'Grams', 2.24, 8960
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-20',
    (SELECT id FROM public.medicines_master WHERE name='Salmonella Polyvalent Vaccine Inactivated IP (500 ml) / SALMONELLA KILLED (1000 DOSE)' LIMIT 1),
    31000, 'Doses', 2.976, 92256
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-21',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-21',
    (SELECT id FROM public.medicines_master WHERE name='Gentamicin' LIMIT 1),
    100, 'ML', 1.168, 116.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-22',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-22',
    (SELECT id FROM public.medicines_master WHERE name='Live 52 5L' LIMIT 1),
    2, 'Liters', 99, 198
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-23',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-23',
    (SELECT id FROM public.medicines_master WHERE name='Live 52 5L' LIMIT 1),
    2, 'Liters', 99, 198
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-23',
    (SELECT id FROM public.medicines_master WHERE name='New Castle Disease Ranikhet Disease Vaccine Live Mesogenic R2B Strain/ R2B Live 1000 Doses' LIMIT 1),
    26000, 'Doses', 0.132, 3432
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-24',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-25',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-25',
    (SELECT id FROM public.medicines_master WHERE name='Live 52 5L' LIMIT 1),
    2, 'Liters', 99, 198
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-26',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-26',
    (SELECT id FROM public.medicines_master WHERE name='Live 52 5L' LIMIT 1),
    2, 'Liters', 99, 198
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-26',
    (SELECT id FROM public.medicines_master WHERE name='Gentamicin' LIMIT 1),
    100, 'ML', 1.168, 116.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-26',
    (SELECT id FROM public.medicines_master WHERE name='Fowl Cholera T1,T3,T4 Serotypes And Infectious coryza A,B,C2,C3 Serotypes Vaccine Inactivated 500ML-1000 Doses/FC+IC KILLED-FOWL CHOLERA-1000 DOSE' LIMIT 1),
    20000, 'Doses', 2.48, 49600
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-26',
    (SELECT id FROM public.medicines_master WHERE name='Avian Infectious bronochitis Vaccine Live,Massachusetts Strain IP 1000 Doses / IB LIVE (1000 DOSE)MASS' LIMIT 1),
    20000, 'Doses', 0.111, 2220
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-27',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-27',
    (SELECT id FROM public.medicines_master WHERE name='Hivit-Multi Vitamin INJ 100 ML' LIMIT 1),
    100, 'Mili Liters', 1.1424, 114.24000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-27',
    (SELECT id FROM public.medicines_master WHERE name='Fowl Cholera T1,T3,T4 Serotypes And Infectious coryza A,B,C2,C3 Serotypes Vaccine Inactivated 500ML-1000 Doses/FC+IC KILLED-FOWL CHOLERA-1000 DOSE' LIMIT 1),
    19000, 'Doses', 2.48, 47120
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-27',
    (SELECT id FROM public.medicines_master WHERE name='Avian Infectious bronochitis Vaccine Live,Massachusetts Strain IP 1000 Doses / IB LIVE (1000 DOSE)MASS' LIMIT 1),
    19000, 'Doses', 0.111, 2109
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-28',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-28',
    (SELECT id FROM public.medicines_master WHERE name='Fowl Cholera T1,T3,T4 Serotypes And Infectious coryza A,B,C2,C3 Serotypes Vaccine Inactivated 500ML-1000 Doses/FC+IC KILLED-FOWL CHOLERA-1000 DOSE' LIMIT 1),
    12000, 'Doses', 2.48, 29760
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-28',
    (SELECT id FROM public.medicines_master WHERE name='Avian Infectious bronochitis Vaccine Live,Massachusetts Strain IP 1000 Doses / IB LIVE (1000 DOSE)MASS' LIMIT 1),
    12000, 'Doses', 0.111, 1332
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-29',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-29',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    100, 'Grams', 1.6, 160
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-29',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    700, 'Mlil Liters', 0.5712, 399.84000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-30',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-30',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    100, 'Grams', 1.6, 160
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-30',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    700, 'Mlil Liters', 0.5712, 399.84000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-31',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-31',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    100, 'Grams', 1.6, 160
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-31',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    700, 'Mlil Liters', 0.5712, 399.84000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-31',
    (SELECT id FROM public.medicines_master WHERE name='Newcastle Disesase Vaccine,Inactivated Pullet-ND Lasota Strain-500 ML / VVND HP (White) KILLED (2000 DOSE)' LIMIT 1),
    27000, 'Doses', 2.623, 70821
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-01-31',
    (SELECT id FROM public.medicines_master WHERE name='Bio Buster Plus 500 Grams' LIMIT 1),
    700, 'Grams', 0.955, 668.5
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-01',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-01',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    100, 'Grams', 1.6, 160
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-01',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    700, 'Mlil Liters', 0.5712, 399.84000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-01',
    (SELECT id FROM public.medicines_master WHERE name='Newcastle Disesase Vaccine,Inactivated Pullet-ND Lasota Strain-500 ML / VVND HP (White) KILLED (2000 DOSE)' LIMIT 1),
    20000, 'Doses', 2.623, 52460.00000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-01',
    (SELECT id FROM public.medicines_master WHERE name='Bio Buster Plus 500 Grams' LIMIT 1),
    700, 'Grams', 0.955, 668.5
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-02',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-02',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    200, 'Grams', 1.6, 320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-02',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    1400, 'Mlil Liters', 0.5712, 799.6800000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-02',
    (SELECT id FROM public.medicines_master WHERE name='Newcastle Disesase Vaccine,Inactivated Pullet-ND Lasota Strain-500 ML / VVND HP (White) KILLED (2000 DOSE)' LIMIT 1),
    4000, 'Doses', 2.623, 10492
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-03',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-03',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    300, 'Grams', 1.6, 480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-03',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    1400, 'Mlil Liters', 0.5712, 799.6800000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-04',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-04',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    200, 'Grams', 1.6, 320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-04',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    1400, 'Mlil Liters', 0.5712, 799.6800000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-05',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-05',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    300, 'Grams', 1.6, 480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-05',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    2100, 'Mlil Liters', 0.5712, 1199.52
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-05',
    (SELECT id FROM public.medicines_master WHERE name='Fowlpox Vaccine Live,IP 1000 Doses / FOWL POX LIVE (1000 DOSE)' LIMIT 1),
    13000, 'Doses', 0.131, 1703
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-06',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-06',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    300, 'Grams', 1.6, 480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-06',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    2100, 'Mlil Liters', 0.5712, 1199.52
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-06',
    (SELECT id FROM public.medicines_master WHERE name='Fowlpox Vaccine Live,IP 1000 Doses / FOWL POX LIVE (1000 DOSE)' LIMIT 1),
    14000, 'Doses', 0.131, 1834
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-06',
    (SELECT id FROM public.medicines_master WHERE name='B 904 5L' LIMIT 1),
    300, 'Mlil Liters', 0.77423, 232.269
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-06',
    (SELECT id FROM public.medicines_master WHERE name='Gentamicin INJ 100 ML' LIMIT 1),
    100, 'Mlil Liters', 1.165, 116.5
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-07',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-07',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    400, 'Grams', 1.6, 640
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-07',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    2300, 'Mlil Liters', 0.5712, 1313.76
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-07',
    (SELECT id FROM public.medicines_master WHERE name='Fowlpox Vaccine Live,IP 1000 Doses / FOWL POX LIVE (1000 DOSE)' LIMIT 1),
    16000, 'Doses', 0.131, 2096
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-07',
    (SELECT id FROM public.medicines_master WHERE name='B 904 5L' LIMIT 1),
    300, 'Mlil Liters', 0.77423, 232.269
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-08',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-08',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    400, 'Grams', 1.6, 640
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-08',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    2300, 'Mlil Liters', 0.5712, 1313.76
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-08',
    (SELECT id FROM public.medicines_master WHERE name='Fowlpox Vaccine Live,IP 1000 Doses / FOWL POX LIVE (1000 DOSE)' LIMIT 1),
    8000, 'Doses', 0.131, 1048
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-08',
    (SELECT id FROM public.medicines_master WHERE name='B 904 5L' LIMIT 1),
    300, 'Mlil Liters', 0.77423, 232.269
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-08',
    (SELECT id FROM public.medicines_master WHERE name='Hivit-Multi Vitamin INJ 100 ML' LIMIT 1),
    100, 'Mili liters', 1.1424, 114.24000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-09',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-09',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    300, 'Grams', 1.6, 480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-09',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    1600, 'Mlil Liters', 0.5712, 913.9200000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-09',
    (SELECT id FROM public.medicines_master WHERE name='B 904 5L' LIMIT 1),
    300, 'Mlil Liters', 0.77423, 232.269
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-10',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-10',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    300, 'Grams', 1.6, 480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-10',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    2200, 'Mlil Liters', 0.5712, 1256.64
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-11',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-11',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    200, 'Grams', 1.6, 320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-11',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    1500, 'Mlil Liters', 0.5712, 856.8000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-11',
    (SELECT id FROM public.medicines_master WHERE name='Avain Encephalomyelitis and Inclusion Body Hepatitis(IBH)/Hydropercardium Syndrome(HPS)Vaccine ,Inactivated.IP/AE & IBH & HPS (IB ASTRO) (1000 DOSE)' LIMIT 1),
    20000, 'Doses', 3.41775, 68355
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-12',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-12',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    200, 'Grams', 1.6, 320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-12',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    1500, 'Mlil Liters', 0.5712, 856.8000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-12',
    (SELECT id FROM public.medicines_master WHERE name='Avain Encephalomyelitis and Inclusion Body Hepatitis(IBH)/Hydropercardium Syndrome(HPS)Vaccine ,Inactivated.IP/AE & IBH & HPS (IB ASTRO) (1000 DOSE)' LIMIT 1),
    31000, 'Doses', 3.41775, 105950.25
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-13',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-13',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    200, 'Grams', 1.6, 320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-13',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    1500, 'Mlil Liters', 0.5712, 856.8000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-14',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-14',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    200, 'Grams', 1.6, 320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-14',
    (SELECT id FROM public.medicines_master WHERE name='Enrocin 5L' LIMIT 1),
    1500, 'Mlil Liters', 0.5712, 856.8000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-14',
    (SELECT id FROM public.medicines_master WHERE name='Gentamicin INJ 100 ML' LIMIT 1),
    100, 'Mlil Liters', 1.165, 116.5
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-14',
    (SELECT id FROM public.medicines_master WHERE name='Nobils REO live 1000 DS/REO LIVE' LIMIT 1),
    27000, 'Doses', 2.73, 73710
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-15',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-15',
    (SELECT id FROM public.medicines_master WHERE name='KAYSOL FORTE 50GM' LIMIT 1),
    200, 'Grams', 1.6, 320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-15',
    (SELECT id FROM public.medicines_master WHERE name='Hivit-Multi Vitamin INJ 100 ML' LIMIT 1),
    100, 'Mili liters', 1.1424, 114.24000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-15',
    (SELECT id FROM public.medicines_master WHERE name='Nobils REO live 1000 DS/REO LIVE' LIMIT 1),
    24000, 'Doses', 2.73, 65520
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-16',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-17',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-18',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-19',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-20',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-20',
    (SELECT id FROM public.medicines_master WHERE name='Tilmovet' LIMIT 1),
    5760, 'Milli Ltrs', 10.85, 62496
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-21',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    14, 'Nos', 23.6, 330.40000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-21',
    (SELECT id FROM public.medicines_master WHERE name='Tilmovet' LIMIT 1),
    5760, 'Milli Ltrs', 10.85, 62496
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-21',
    (SELECT id FROM public.medicines_master WHERE name='Gentamicin' LIMIT 1),
    100, 'ML', 1.168, 116.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-21',
    (SELECT id FROM public.medicines_master WHERE name='Salmonella Polyvalent Vaccine Inactivated IP (500 ml) / SALMONELLA KILLED (1000 DOSE)' LIMIT 1),
    21000, 'Doses', 2.976, 62496
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-22',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-22',
    (SELECT id FROM public.medicines_master WHERE name='Hivit-Multi Vitamin INJ 100 ML' LIMIT 1),
    100, 'Mili liters', 1.1424, 114.24000000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-22',
    (SELECT id FROM public.medicines_master WHERE name='Salmonella Polyvalent Vaccine Inactivated IP (500 ml) / SALMONELLA KILLED (1000 DOSE)' LIMIT 1),
    26000, 'Doses', 2.976, 77376
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-23',
    (SELECT id FROM public.medicines_master WHERE name='SafeGuard 5L' LIMIT 1),
    1.4, 'liters', 268.568, 375.99519999999995
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-23',
    (SELECT id FROM public.medicines_master WHERE name='Salmonella Polyvalent Vaccine Inactivated IP (500 ml) / SALMONELLA KILLED (1000 DOSE)' LIMIT 1),
    4000, 'Doses', 2.976, 11904
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-24',
    (SELECT id FROM public.medicines_master WHERE name='SafeGuard 5L' LIMIT 1),
    1.4, 'liters', 268.568, 375.99519999999995
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-25',
    (SELECT id FROM public.medicines_master WHERE name='SafeGuard 5L' LIMIT 1),
    1.4, 'liters', 268.568, 375.99519999999995
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-25',
    (SELECT id FROM public.medicines_master WHERE name='Avian Encephalomyelitis Vaccine Inactivated - 500ML-    1000 Doses / AE KILLED (1000 DOSE)' LIMIT 1),
    27000, 'Doses', 2.095, 56565.00000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-26',
    (SELECT id FROM public.medicines_master WHERE name='SafeGuard 5L' LIMIT 1),
    1.4, 'liters', 268.568, 375.99519999999995
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-26',
    (SELECT id FROM public.medicines_master WHERE name='Avian Encephalomyelitis Vaccine Inactivated - 500ML-    1000 Doses / AE KILLED (1000 DOSE)' LIMIT 1),
    24000, 'Doses', 2.095, 50280.00000000001
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-26',
    (SELECT id FROM public.medicines_master WHERE name='B 904 5L' LIMIT 1),
    450, 'Mlil Liters', 0.77423, 348.4035
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-27',
    (SELECT id FROM public.medicines_master WHERE name='SafeGuard 5L' LIMIT 1),
    1.4, 'liters', 268.568, 375.99519999999995
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-27',
    (SELECT id FROM public.medicines_master WHERE name='B 904 5L' LIMIT 1),
    450, 'Mlil Liters', 0.77423, 348.4035
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-28',
    (SELECT id FROM public.medicines_master WHERE name='SafeGuard 5L' LIMIT 1),
    1.4, 'liters', 268.568, 375.99519999999995
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-28',
    (SELECT id FROM public.medicines_master WHERE name='Mycoplasma Gallisepticum Vaccine Inactivated BP - 500ML / MG KILLED-1000 DOES' LIMIT 1),
    27000, 'Doses', 4.41, 119070
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-29',
    (SELECT id FROM public.medicines_master WHERE name='SafeGuard 5L' LIMIT 1),
    1.4, 'liters', 268.568, 375.99519999999995
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-02-29',
    (SELECT id FROM public.medicines_master WHERE name='Mycoplasma Gallisepticum Vaccine Inactivated BP - 500ML / MG KILLED-1000 DOES' LIMIT 1),
    24000, 'Doses', 4.41, 105840
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-01',
    (SELECT id FROM public.medicines_master WHERE name='SafeGuard 5L' LIMIT 1),
    1.4, 'liters', 268.568, 375.99519999999995
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-02',
    (SELECT id FROM public.medicines_master WHERE name='SafeGuard 5L' LIMIT 1),
    1.4, 'liters', 268.568, 375.99519999999995
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-02',
    (SELECT id FROM public.medicines_master WHERE name='Gumboro (1000 Doses)/ILT 1000 Doses' LIMIT 1),
    13000, 'Doses', 1.57, 20410
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-02',
    (SELECT id FROM public.medicines_master WHERE name='KEMRAKSHA + 5L' LIMIT 1),
    2, 'Liters', 330, 660
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-03',
    (SELECT id FROM public.medicines_master WHERE name='SafeGuard 5L' LIMIT 1),
    1.4, 'liters', 268.568, 375.99519999999995
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-03',
    (SELECT id FROM public.medicines_master WHERE name='Gumboro (1000 Doses)/ILT 1000 Doses' LIMIT 1),
    30000, 'Doses', 1.57, 47100
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-04',
    (SELECT id FROM public.medicines_master WHERE name='SafeGuard 5L' LIMIT 1),
    1.4, 'liters', 268.568, 375.99519999999995
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-04',
    (SELECT id FROM public.medicines_master WHERE name='Gumboro (1000 Doses)/ILT 1000 Doses' LIMIT 1),
    8000, 'Doses', 1.57, 12560
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-05',
    (SELECT id FROM public.medicines_master WHERE name='SafeGuard 5L' LIMIT 1),
    1.4, 'liters', 268.568, 375.99519999999995
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-06',
    (SELECT id FROM public.medicines_master WHERE name='SafeGuard 5L' LIMIT 1),
    1.4, 'liters', 268.568, 375.99519999999995
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-06',
    (SELECT id FROM public.medicines_master WHERE name='New Castle Disease and avain Infectious Bronchitis(Masschusetts and Nephropathic (Strain) Vaccine,Inactivated .(NBIBMN-1000 Doses)/ND+IB KILLED (1000 DOSE)' LIMIT 1),
    8000, 'Doses', 3.302, 26416
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-06',
    (SELECT id FROM public.medicines_master WHERE name='B 904 5L' LIMIT 1),
    1700, 'Mlil Liters', 0.77423, 1316.191
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-07',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-08',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-09',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-10',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-11',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-12',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-13',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-14',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-14',
    (SELECT id FROM public.medicines_master WHERE name='Newcastle Disesase Vaccine,Inactivated Pullet-ND Lasota Strain-500 ML / VVND LP (GREEN) KILLED (2000 DOSE)' LIMIT 1),
    25000, 'Doses', 0.972, 24300
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-14',
    (SELECT id FROM public.medicines_master WHERE name='B 904 5L' LIMIT 1),
    1000, 'Mlil Liters', 0.77423, 774.23
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-15',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-15',
    (SELECT id FROM public.medicines_master WHERE name='Newcastle Disesase Vaccine,Inactivated Pullet-ND Lasota Strain-500 ML / VVND LP (GREEN) KILLED (2000 DOSE)' LIMIT 1),
    18000, 'Doses', 0.972, 17496
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-16',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-16',
    (SELECT id FROM public.medicines_master WHERE name='Newcastle Disesase Vaccine,Inactivated Pullet-ND Lasota Strain-500 ML / VVND LP (GREEN) KILLED (2000 DOSE)' LIMIT 1),
    8000, 'Doses', 0.972, 7776
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-17',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-17',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    0.3, 'Litres', 580, 174
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-17',
    (SELECT id FROM public.medicines_master WHERE name='Electrocare Plus-1kg' LIMIT 1),
    4, 'Kg', 189, 756
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-18',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-18',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    0.65, 'Litres', 580, 377
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-18',
    (SELECT id FROM public.medicines_master WHERE name='Electrocare Plus-1kg' LIMIT 1),
    4, 'Kg', 189, 756
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-18',
    (SELECT id FROM public.medicines_master WHERE name='Kohrsolin 5 Ltrs' LIMIT 1),
    3, 'LITERS', 1063.4, 3190.2000000000003
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-18',
    (SELECT id FROM public.medicines_master WHERE name='Infectious Bursal Disesase Vaccine Inactivated IP-200 ML-400 Doses / IBD KILLED -400 Dose/IBDK' LIMIT 1),
    21000, 'Doses', 2.352, 49392
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-19',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-19',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    0.3, 'Litres', 580, 174
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-19',
    (SELECT id FROM public.medicines_master WHERE name='Electrocare Plus-1kg' LIMIT 1),
    2, 'Kg', 189, 378
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-19',
    (SELECT id FROM public.medicines_master WHERE name='Infectious Bursal Disesase Vaccine Inactivated IP-200 ML-400 Doses / IBD KILLED -400 Dose/IBDK' LIMIT 1),
    30000, 'Doses', 2.352, 70560
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-20',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    18, 'Nos', 23.6, 424.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-20',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    2.55, 'Litres', 580, 1479
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-20',
    (SELECT id FROM public.medicines_master WHERE name='Electrocare Plus-1kg' LIMIT 1),
    2, 'Kg', 189, 378
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-21',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    15, 'Nos', 23.6, 354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-21',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    0.2, 'Litres', 580, 116
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-21',
    (SELECT id FROM public.medicines_master WHERE name='Electrocare Plus-1kg' LIMIT 1),
    2, 'Kg', 189, 378
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-21',
    (SELECT id FROM public.medicines_master WHERE name='Aquamax 5L' LIMIT 1),
    0.4, 'Liters', 107.85, 43.14
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-21',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    4, 'Litres', 580, 2320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-22',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    12, 'Nos', 23.6, 283.20000000000005
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-22',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    1.6, 'Litres', 580, 928
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-22',
    (SELECT id FROM public.medicines_master WHERE name='Electrocare Plus-1kg' LIMIT 1),
    2, 'Kg', 189, 378
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-22',
    (SELECT id FROM public.medicines_master WHERE name='Aquamax 5L' LIMIT 1),
    0.6, 'Liters', 107.85, 64.71
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-22',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    4, 'Litres', 580, 2320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-23',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    9, 'Nos', 23.6, 212.4
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-23',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    1.2, 'Litres', 580, 696
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-23',
    (SELECT id FROM public.medicines_master WHERE name='Electrocare Plus-1kg' LIMIT 1),
    1, 'Kg', 189, 189
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-23',
    (SELECT id FROM public.medicines_master WHERE name='Aquamax 5L' LIMIT 1),
    0.8, 'Liters', 107.85, 86.28
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-23',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    2, 'Litres', 580, 1160
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-24',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    6, 'Nos', 23.6, 141.60000000000002
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-24',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    1, 'Litres', 580, 580
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-24',
    (SELECT id FROM public.medicines_master WHERE name='Electrocare Plus-1kg' LIMIT 1),
    1, 'Kg', 189, 189
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-24',
    (SELECT id FROM public.medicines_master WHERE name='Aquamax 5L' LIMIT 1),
    1.2, 'Liters', 107.85, 129.42
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-24',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    3, 'Litres', 580, 1740
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-25',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    4, 'Nos', 23.6, 94.4
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-25',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    0.4, 'Litres', 580, 232
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-25',
    (SELECT id FROM public.medicines_master WHERE name='Electrocare Plus-1kg' LIMIT 1),
    1, 'Kg', 189, 189
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-25',
    (SELECT id FROM public.medicines_master WHERE name='Aquamax 5L' LIMIT 1),
    2.4, 'Litres', 107.85, 258.84
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-25',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    4, 'Litres', 580, 2320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-26',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    1, 'Nos', 23.6, 23.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-26',
    (SELECT id FROM public.medicines_master WHERE name='Aquamax 5L' LIMIT 1),
    1.6, 'Litres', 107.85, 172.56
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-26',
    (SELECT id FROM public.medicines_master WHERE name='Famitone' LIMIT 1),
    4, 'Litres', 580, 2320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-27',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    1, 'Nos', 23.6, 23.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-27',
    (SELECT id FROM public.medicines_master WHERE name='Aquamax 5L' LIMIT 1),
    2.4, 'Litres', 107.85, 258.84
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-28',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    1, 'Nos', 23.6, 23.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-28',
    (SELECT id FROM public.medicines_master WHERE name='Aquamax 5L' LIMIT 1),
    2.4, 'Litres', 107.85, 258.84
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-28',
    (SELECT id FROM public.medicines_master WHERE name='Nobillis CAVP4 1000 DS' LIMIT 1),
    24000, 'Doses', 6.615, 158760
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-29',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    1, 'Nos', 23.6, 23.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-29',
    (SELECT id FROM public.medicines_master WHERE name='Aquamax 5L' LIMIT 1),
    2.4, 'Litres', 107.85, 258.84
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-29',
    (SELECT id FROM public.medicines_master WHERE name='Nobillis CAVP4 1000 DS' LIMIT 1),
    26000, 'Doses', 6.615, 171990
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-29',
    (SELECT id FROM public.medicines_master WHERE name='Trysil Dry 1kg' LIMIT 1),
    6.4, 'kg', 899, 5753.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-30',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    1, 'Nos', 23.6, 23.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-30',
    (SELECT id FROM public.medicines_master WHERE name='Aquamax 5L' LIMIT 1),
    2.4, 'Litres', 107.85, 258.84
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-30',
    (SELECT id FROM public.medicines_master WHERE name='Trysil Dry 1kg' LIMIT 1),
    6.4, 'kg', 899, 5753.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-31',
    (SELECT id FROM public.medicines_master WHERE name='BVCLO2 Tablet' LIMIT 1),
    1, 'Nos', 23.6, 23.6
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-31',
    (SELECT id FROM public.medicines_master WHERE name='Aquamax 5L' LIMIT 1),
    2.4, 'Litres', 107.85, 258.84
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-31',
    (SELECT id FROM public.medicines_master WHERE name='Trysil Dry 1kg' LIMIT 1),
    3.2, 'kg', 899, 2876.8
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-31',
    (SELECT id FROM public.medicines_master WHERE name='Ventriplex M 4X -5 L' LIMIT 1),
    5, 'Liters', 110.8, 554
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-03-31',
    (SELECT id FROM public.medicines_master WHERE name='Mycoplasma Gallisepticum Vaccine Inactivated BP - 500ML / MG KILLED-1000 DOES' LIMIT 1),
    25000, 'Doses', 4.41, 110250
  )
ON CONFLICT DO NOTHING;
