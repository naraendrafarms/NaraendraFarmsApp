# NaraendraFarmsApp — Claude Session Rules

## Stack
- React + TypeScript + Vite frontend (Cloudflare Pages: naraendra-farms.pages.dev)
- Supabase (PostgreSQL + PostgREST) backend
- GitHub Actions: `apply-migration.yml` for DB migrations

---

## Rules to Follow Every Session

### 1. Migration Checklist (MANDATORY every time)
```
1. Write migration file  supabase/migrations/NNN_name.sql
2. git add + commit + push to main
3. Trigger workflow:  inputs: {"migration": "NNN_name.sql"}
4. Check actual job logs — confirm filename matches + "Errors: 0"
5. Test the feature in the app immediately after
```
> NEVER trust workflow green status alone — run_sql.py exits 0 even on SQL errors.

### 2. View changes → always DROP first
`CREATE OR REPLACE VIEW` silently fails when column names/order change.
Always: `DROP VIEW IF EXISTS public.view_name;` then `CREATE VIEW ...`

### 3. Audit triggers — wrap in EXCEPTION handler
Any `fn_audit_log()` change must reference the correct column name for each table.
Trigger failures MUST be caught so they never block real INSERT/UPDATE/DELETE.

### 4. Date inputs — never use `<input type="date">`
Android Chrome ignores `lang="en-GB"`. Always use the custom `<DateInput>` component
from `src/components/ui/index.tsx` — displays DD/MM/YYYY, stores YYYY-MM-DD.

### 5. Cash Book auto-entry rules
- NHE sales (je/te/be/bird/manure) → insert to `cash_book` on SAVE (new AND edit)
- HE dispatch → insert to `cash_book` on payment receipt
- Category mapping: je→je_sale, te→te_sale, be→be_sale, manure→litter_sale, bird→bird_sale
- On edit: delete old cash_book entry first to avoid duplicates

### 6. Flock bird count logic (v_flock_summary)
```sql
COALESCE(NULLIF(closing_female, 0), opening_female, total_placed_f) AS current_female
```
Falls back to `total_placed_f` when no daily records exist. Flock shows birds until
either daily records bring count to 0 OR flock status is set to "closed".

---

## Key Files
| File | Purpose |
|------|---------|
| `src/pages/flocks/FlockSalesPages.tsx` | NHE sales + HE dispatch + cash_book auto-entry |
| `src/pages/accounts/CashBook.tsx` | Cash book with categories |
| `src/components/ui/index.tsx` | Shared UI including DateInput |
| `supabase/migrations/` | All DB migrations (apply in order) |
| `scripts/run_sql.py` | Migration runner (exits 0 even on error — check logs!) |
