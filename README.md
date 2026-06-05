# Naraendra Farms — Poultry Management System

React + Supabase + Cloudflare Pages. Low-usage, read-heavy architecture.

---

## STEP 1 — SUPABASE SETUP (5 min)

1. Go to **https://supabase.com** → New project → Name: `naraendra-farms`
2. Save your **Project URL** and **anon key** (Settings → API)
3. Go to **SQL Editor** → paste and run `supabase/migrations/001_schema.sql`
4. Then run `supabase/seeds/001_seed_data.sql`
5. Go to **Authentication → Users** → Add user:
   - Email: `admin@naraendrafarms.com`
   - Password: (choose strong password)
6. Go to **SQL Editor** → run:
   ```sql
   INSERT INTO public.profiles (id, full_name, role)
   SELECT id, 'Admin', 'admin' FROM auth.users WHERE email = 'admin@naraendrafarms.com';
   ```

---

## STEP 2 — GITHUB SETUP (3 min)

1. Create new repo at **https://github.com/new** → Name: `naraendra-farms`
2. Push this code:
   ```bash
   cd naraendra-farms
   git init
   git add .
   git commit -m "Initial: Naraendra Farms app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/naraendra-farms.git
   git push -u origin main
   ```
3. Go to repo **Settings → Secrets and variables → Actions** → Add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - `CLOUDFLARE_API_TOKEN` = (get from Cloudflare step)
   - `CLOUDFLARE_ACCOUNT_ID` = (get from Cloudflare step)

---

## STEP 3 — CLOUDFLARE PAGES (5 min)

1. Go to **https://dash.cloudflare.com** → Workers & Pages → Create application → Pages
2. Connect to Git → Select your `naraendra-farms` repo
3. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Environment variables:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
5. Save and deploy
6. Copy your **Cloudflare API Token** (My Profile → API Tokens → Create Token → Edit Cloudflare Workers template)
7. Copy your **Account ID** from the right sidebar of any Cloudflare page
8. Add both to GitHub Secrets (Step 2 above)

---

## STEP 4 — IMPORT HISTORICAL DATA

After logging in, go to **Import Data** in the left menu:

### Import Daily Records
- Go to **Import → Daily Records**
- Select Flock (e.g. Flock 16)
- Upload each monthly Excel file: `Flock_16_April_2024.xlsx`, etc.
- Both 16-column (Kpally) and 21-column (PPally/BPET) auto-detected
- Click Import → done

### Import Electricity Bills
- Go to **Import → Electricity**
- Upload `ELECTRICTY_BILLS_DETAILS.xlsx` → all months imported at once
- Then upload `Electricity_Bill_Details_FY2025-26.xlsx`

### Import Salary Abstract
- Go to **Import → Salary**
- Upload each month file: `1_Salary_Details_APRIL_2024.xlsx`, etc.
- Month auto-detected from filename

---

## TECH STACK

| Layer | Tech | Cost |
|-------|------|------|
| Frontend | React 18 + TypeScript + Tailwind | Free |
| Backend | Supabase (Postgres + Auth) | Free tier |
| Hosting | Cloudflare Pages | Free |
| CI/CD | GitHub Actions | Free |

## SUPABASE FREE TIER LIMITS
- Database: 500 MB — enough for 10+ years of flock data
- Bandwidth: 5 GB/month — app is read-heavy, minimal writes
- Auth: 50,000 MAU — you have <10 users

## MODULES BUILT
- ✅ Dashboard with flock cards + production chart
- ✅ Flock master (add/edit flocks 19, 20, 21+)
- ✅ Daily flock data entry (all 20 columns, auto-compute closing)
- ✅ HE Dispatch & Sales
- ✅ NHE / Bird / Gas / Manure sales
- ✅ Medicine & Vaccine entry (daily + monthly)
- ✅ GRN (Goods Received)
- ✅ Feed Production batches
- ✅ Feed Transfer (mill → farms)
- ✅ Electricity bills (all 5 meters)
- ✅ Employee master
- ✅ Salary abstract entry
- ✅ Masters: Farms, Sheds, Feed Ingredients, Feed Types, Parties, Medicines
- ✅ Import: Daily records from Excel (auto-detect Kpally/PPally/BPET format)
- ✅ Import: Electricity bills from Excel
- ✅ Import: Salary abstract from Excel
- ✅ Flock detail page (daily table, monthly summary, financial tab)
