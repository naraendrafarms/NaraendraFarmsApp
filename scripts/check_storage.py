#!/usr/bin/env python3
"""One-off: query DB storage and print actual results"""
import subprocess, json, os

MGMT = os.environ["MGMT"]
REF  = os.environ.get("REF", "kjliulgpipqqwptinrrd")

def query(sql):
    with open("/tmp/q.json","w") as f:
        json.dump({"query": sql}, f)
    r = subprocess.run(["curl","-s","-X","POST",
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        "-H", f"Authorization: Bearer {MGMT}",
        "-H", "Content-Type: application/json",
        "--data-binary", "@/tmp/q.json"],
        capture_output=True, text=True, timeout=30)
    try: return json.loads(r.stdout)
    except: return r.stdout[:500]

print("=== SUPABASE STORAGE REPORT ===")

total = query("SELECT pg_size_pretty(pg_database_size(current_database())) AS total_db_size;")
print("Total DB size:", total)

tables = query("""
SELECT tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS total_size,
  n_live_tup AS rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC
LIMIT 15;
""")
print("\nTop tables by size:")
if isinstance(tables, list):
    for row in tables:
        print(f"  {row.get('tablename','?'):35s} {row.get('total_size','?'):12s} ({row.get('rows','?')} rows)")
else:
    print(tables)
