#!/usr/bin/env python3
"""
seed_guard.py <table> <flock_no>

Exits 0 (run seed) if the flock has zero rows in the given table.
Exits 1 (skip seed) if the flock already has rows.

Usage in deploy.yml:
  if python3 scripts/seed_guard.py daily_records 19; then
    python3 scripts/run_sql.py data_f19_daily_01.sql
  fi
"""
import sys, os, requests

table    = sys.argv[1]   # e.g. "daily_records"
flock_no = sys.argv[2]   # e.g. "19"

MGMT = os.environ['MGMT']
REF  = os.environ['REF']

url = f"https://api.supabase.com/v1/projects/{REF}/database/query"
headers = {"Authorization": f"Bearer {MGMT}", "Content-Type": "application/json"}

sql = f"""
SELECT COUNT(*) AS cnt
FROM {table}
WHERE flock_id = (SELECT id FROM flocks WHERE flock_no = {flock_no} LIMIT 1)
"""

resp = requests.post(url, json={"query": sql}, headers=headers)
resp.raise_for_status()
data = resp.json()

cnt = 0
for row in data:
    cnt = int(row.get("cnt", 0))

if cnt == 0:
    print(f"Flock {flock_no} has 0 rows in {table} — running seed")
    sys.exit(0)
else:
    print(f"Flock {flock_no} already has {cnt} rows in {table} — skipping seed")
    sys.exit(1)
