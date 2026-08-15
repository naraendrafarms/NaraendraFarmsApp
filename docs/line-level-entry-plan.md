# Line-level shed entry — migration plan

**Status: PLAN ONLY. Nothing in this document has been run.**

Purpose: let shed supervisors record production (4 rounds a day), mortality,
feed and medicine **per line**, feeding the views management and accounts
already use — without disturbing any existing login, entry screen or report.

---

## The two rules everything follows

**1. Roll UP, never replace.** Line entries live in new tables and are summed
into `daily_records`. Every existing report, `v_flock_summary`, the bird chain
and HD% keep reading exactly what they read today and are not modified.

**2. A shed is line-managed OR shed-managed, never both.** Two doors into the
same row means silent overwrites — the same failure as the electricity payment
that was deleted from the Cash Book while the bill still read Paid. Switching a
shed on makes Bulk Daily Entry show that shed read-only. Switching it off
returns it to normal. Migration happens **one shed at a time, at your pace.**

---

## What already exists (verified, migration 637)

- **27 sheds, all active**, all with `capacity_female`, `total_boxes`,
  `birds_per_box`; 18 of 27 also have `a_side_boxes` / `b_side_boxes`
- **No line concept anywhere** — every `%line%` column in the database is an
  address line or a purchase-order line item
- Sheds in use: Flock 20 → 8, Flock 22 → 12, Flock 23 → 2
- Roles: `admin, management, accounts, site_manager, site_incharge, viewer`
- `medicine_usage` is **flock-level** — it has no `shed_id`
- `daily_records` is one row per flock+shed+date, enforced by two unique indexes

## Open items that block go-live (not the build)

- **Capacity is wrong somewhere.** Birds standing exceed shed capacity:
  Flock 23 ♀36,656 standing vs ♀18,672 capacity; Flock 20 ♀34,128 vs ♀29,824.
  Capacity becomes the denominator of every line-level percentage, so this must
  be resolved before anyone reads those percentages.
- **9 sheds have no A/B split** (`A0/B0`) — their lines cannot be seeded
  provisionally and need the sheet.
- The line sheet itself (16 lines per shed, under A and B).

---

## Migrations

Each is written so its verification sits **inside the first 5 statements** —
`run_sql.py` prints no further, which is how migration 621's checks were lost.
No `$`+`$` marker appears in any comment (it desynchronises the runner's
statement splitter).

### 638 — `shed_lines`

```
shed_lines (
  id, shed_id → sheds, side ('A'|'B'), line_no int,
  boxes int, capacity_female int, capacity_male int,
  is_provisional bool default true,
  is_active bool default true,
  UNIQUE (shed_id, side, line_no)
)
```

`is_provisional` matters: seeded rows are estimates until the sheet arrives, and
a screen must be able to say so rather than presenting a guess as a measurement.

**Verifies:** table exists; row count is zero.

### 639 — seed provisional lines

For the 18 sheds with an A/B split: 8 lines per side, boxes divided evenly,
capacity derived as `boxes × birds_per_box`, all flagged provisional. The 9
sheds without a split are **skipped and named in the output**, not guessed at.

**Verifies:** lines created per shed; which sheds were skipped; that the sum of
line capacity per shed equals shed capacity (or reports the difference).

### 640 — shed supervisor role and shed assignment

- Widen the `profiles.role` CHECK to include `shed_supervisor`
- New `profile_sheds (profile_id, shed_id)` — a supervisor may hold several
  sheds; `profiles.farm_id` alone is too coarse

**Verifies:** the CHECK accepts the new value; the table exists; existing
profiles are untouched (count by role before and after).

### 641 — the line entry tables

```
line_production   (line_id, record_date, round_no 1..4, eggs, entered_by, entered_at)
line_mortality    (line_id, record_date, female, male, reason, entered_by, entered_at)
line_feed         (line_id, record_date, feed_type_id, female_kg, male_kg, entered_by, entered_at)
```

- `round_no` is 1–4, `UNIQUE (line_id, record_date, round_no)` so the same round
  cannot be entered twice
- `entered_by` / `entered_at` on every row — with 20–30 people entering, a
  disagreement is unresolvable without them
- **Grades are deliberately absent.** Grading happens once at day end by the
  site manager, on `daily_records` as today. The rounds record counts only.

**Verifies:** all three tables exist with their unique constraints.

### 642 — medicine at line level

`medicine_usage` gains **nullable** `shed_id` and `line_id`. Nullable is the
point: every existing flock-level row stays valid and every existing report
keeps working. New entries can be more specific.

**Verifies:** columns exist; existing row count unchanged; the medicine unit and
cost checks from migrations 605–615 still pass.

### 643 — the roll-up

A trigger on the three line tables recomputes that shed's `daily_records` row
for that date: eggs = sum of the 4 rounds, mortality = sum of line mortality,
feed = sum of line feed, upserted on the existing `(flock_id, shed_id,
record_date)` unique index.

**Critical detail, learned from Flock 23:** `daily_records` has a BEFORE trigger
(`fn_chain_daily_opening`, migrations 200/225) that overwrites `opening_*` from
the previous day's closing and computes `closing_*` itself. The roll-up must
therefore write **only** the movement columns and let that trigger do its work.
Writing `closing_*` directly would be silently overwritten — which is exactly
what made migration 601 report success while changing nothing.

**Verifies:** on a test date, the daily record equals the sum of its line rows;
`closing = opening + in − mortality − cull − out` still holds; the chain to the
next day is unbroken.

### 644 — the opt-in switch

`sheds.line_managed boolean not null default false`.

Nothing changes behaviour until a shed is switched on. Bulk Daily Entry reads
this flag and renders those sheds read-only.

**Verifies:** column exists; **all 27 sheds are false** — i.e. the system is
inert until deliberately enabled.

---

## App work (after the migrations)

1. **Masters → Lines** — list and edit lines per shed, provisional flag visible
2. **Shed entry screen** — phone-shaped, one line at a time, large fields,
   4 rounds, mortality, feed; **works offline and syncs when signal returns**
3. **Bulk Daily Entry** — read-only for line-managed sheds, clearly labelled
4. **Line-wise views** — production, mortality, medicine and feed per line
   against capacity, in the existing management views
5. **Access** — a shed supervisor sees only his assigned sheds

**Note on security:** scoping a supervisor to his sheds is currently enforced in
the app's queries only. At the database level every authenticated user can still
read and write everything (migrations 626–631 closed anonymous access, not
per-user scoping). With 20–30 logins this becomes worth fixing properly with
farm/shed-scoped RLS policies. It is a separate piece of work and should be
priced as one.

---

## Order of go-live

1. You resolve the capacity discrepancy
2. Migrations 638–644 run; everything stays inert (`line_managed` all false)
3. **One shed** switched on; entered line-wise for a few days alongside normal
   working
4. Verify on that shed: daily record equals the sum of rounds; bird count and
   HD% behave as before on All Flocks Data; Cost & Income and the Operations
   Board still tie out
5. **If any of those move, stop and fix before a second shed is switched on**
6. Sheet arrives → correct the line list → switch on shed by shed

---

## What this plan deliberately does not do

- Does not change `daily_records`' shape, its triggers, or any existing report
- Does not touch Bulk Daily Entry's behaviour for shed-managed sheds
- Does not alter any existing login, role or permission
- Does not assume the line sheet; seeded lines are marked provisional
- Does not build offline entry as an afterthought — it is listed as core,
  because a supervisor at a shed with weak signal is the normal case, not the
  exception
