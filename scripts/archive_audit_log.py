#!/usr/bin/env python3
"""Move audit_log rows older than KEEP_DAYS out of the database into the
audit-archive storage bucket.

THE FARM'S OWN DATA IS NEVER READ OR WRITTEN HERE. Only public.audit_log, which
is the diary of changes, never the flocks, sales, salaries, invoices or cash
book themselves.

The order below is the whole safety of this script and must not be rearranged:

    1. count what is in scope
    2. export it, oldest first, in pages
    3. gzip it
    4. UPLOAD it to storage
    5. DOWNLOAD it back and compare the bytes
    6. only then DELETE from the table

Any failure before step 6 exits non-zero with nothing deleted. The rows are
still in the database and the job can simply be run again.
"""
import os, sys, json, csv, io, gzip, hashlib, subprocess, datetime

MGMT   = os.environ["SUPABASE_MGMT_TOKEN"]
SRK    = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
REF    = "kjliulgpipqqwptinrrd"
KEEP   = int(os.environ.get("KEEP_DAYS", "30"))
DRY    = os.environ.get("DRY_RUN", "false").lower() == "true"
BUCKET = "audit-archive"
API    = f"https://api.supabase.com/v1/projects/{REF}/database/query"
STORE  = f"https://{REF}.supabase.co/storage/v1"


def q(sql):
    """Run SQL through the management API, the same path the nightly backup uses."""
    with open("/tmp/aq.json", "w") as f:
        json.dump({"query": sql}, f)
    r = subprocess.run(["curl", "-s", "-X", "POST", API,
                        "-H", f"Authorization: Bearer {MGMT}",
                        "-H", "Content-Type: application/json",
                        "--data-binary", "@/tmp/aq.json"],
                       capture_output=True, text=True)
    try:
        out = json.loads(r.stdout)
    except Exception:
        print("Unreadable reply from the database:", r.stdout[:300]); sys.exit(1)
    if isinstance(out, dict) and out.get("message"):
        print("QUERY FAILED:", out["message"]); sys.exit(1)
    return out


# A fixed cutoff computed ONCE. Deriving it inside each statement would let the
# boundary drift between the export and the delete, and rows written during the
# run would fall into a window that was never exported.
cutoff = (datetime.datetime.now(datetime.timezone.utc)
          - datetime.timedelta(days=KEEP)).strftime("%Y-%m-%d %H:%M:%S+00")
print(f"Keeping {KEEP} days. Cutoff: {cutoff}")
print(f"Dry run: {DRY}\n")

stat = q(f"""
  SELECT count(*)::int AS in_scope,
         (SELECT count(*)::int FROM public.audit_log) AS total,
         min(changed_at)::text AS oldest, max(changed_at)::text AS newest
  FROM public.audit_log WHERE changed_at < '{cutoff}'::timestamptz
""")[0]
n = stat["in_scope"]
print(f"audit_log holds {stat['total']} rows; {n} are older than the cutoff")
if n == 0:
    print("Nothing to archive."); sys.exit(0)
print(f"Range to archive: {stat['oldest']} -> {stat['newest']}\n")

# 1. Export, oldest first, in pages. One statement returning half a million rows
#    would be refused, and a truncated export followed by a delete would lose
#    exactly the rows that never made it into the file.
rows, page, PAGE = [], 0, 5000
while True:
    batch = q(f"""
      SELECT id, table_name, record_id, action, user_id, user_email,
             changed_at, summary
      FROM public.audit_log WHERE changed_at < '{cutoff}'::timestamptz
      ORDER BY changed_at, id LIMIT {PAGE} OFFSET {page * PAGE}
    """)
    if not batch:
        break
    rows.extend(batch)
    print(f"  exported {len(rows)} / {n}")
    if len(batch) < PAGE:
        break
    page += 1

if len(rows) != n:
    print(f"REFUSING TO CONTINUE: expected {n} rows, exported {len(rows)}.")
    print("Nothing has been deleted."); sys.exit(1)

# 2. To CSV, then gzip
buf = io.StringIO()
w = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
w.writeheader()
for r in rows:
    w.writerow(r)
raw = buf.getvalue().encode()
blob = gzip.compress(raw)
digest = hashlib.sha256(blob).hexdigest()
stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
name = f"audit_log_upto_{cutoff[:10]}_{stamp}.csv.gz"
print(f"\n{len(rows)} rows -> {len(raw):,} bytes CSV -> {len(blob):,} bytes gzipped")
print(f"File: {name}\n  sha256 {digest}")

if DRY:
    print("\nDRY RUN — not uploading, not deleting."); sys.exit(0)

if not SRK:
    print("No service role key available, so the file cannot be uploaded.")
    print("Nothing has been deleted."); sys.exit(1)

with open("/tmp/" + name, "wb") as f:
    f.write(blob)

# 3. Upload
up = subprocess.run(["curl", "-s", "-w", "\n%{http_code}", "-X", "POST",
                     f"{STORE}/object/{BUCKET}/{name}",
                     "-H", f"Authorization: Bearer {SRK}",
                     "-H", "Content-Type: application/gzip",
                     "--data-binary", "@/tmp/" + name],
                    capture_output=True, text=True)
code = up.stdout.strip().split("\n")[-1]
if code not in ("200", "201"):
    print(f"UPLOAD FAILED (HTTP {code}): {up.stdout[:300]}")
    print("Nothing has been deleted."); sys.exit(1)
print(f"Uploaded (HTTP {code})")

# 4. VERIFY by reading it back and comparing bytes. An upload that reported
#    success but stored something else would otherwise be discovered only when
#    the archive was needed, long after the rows were gone.
subprocess.run(["curl", "-s", "-o", "/tmp/verify.gz",
                f"{STORE}/object/{BUCKET}/{name}",
                "-H", f"Authorization: Bearer {SRK}"], check=True)
back = open("/tmp/verify.gz", "rb").read()
if hashlib.sha256(back).hexdigest() != digest:
    print(f"VERIFY FAILED: read back {len(back):,} bytes, expected {len(blob):,}.")
    print("Nothing has been deleted."); sys.exit(1)
print(f"Verified: {len(back):,} bytes read back, sha256 matches")

# 5. Only now delete, bounded by the SAME cutoff that was exported
gone = q(f"""
  WITH d AS (DELETE FROM public.audit_log
             WHERE changed_at < '{cutoff}'::timestamptz RETURNING 1)
  SELECT count(*)::int AS deleted FROM d
""")[0]["deleted"]
print(f"\nDeleted {gone} rows from audit_log")
if gone != len(rows):
    print(f"NOTE: {gone} deleted vs {len(rows)} archived — rows written during the "
          f"run with an older timestamp. The archive holds what was exported; "
          f"re-run to catch any remainder.")

after = q("""
  SELECT count(*)::int AS rows,
         pg_size_pretty(pg_total_relation_size('public.audit_log')) AS size
  FROM public.audit_log
""")[0]
print(f"audit_log now: {after['rows']} rows, {after['size']}")
print("Note: Postgres reuses freed space rather than shrinking the file, so the "
      "reported size falls only after a VACUUM FULL.")
