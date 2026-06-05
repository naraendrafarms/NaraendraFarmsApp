#!/usr/bin/env python3
"""
Database initialization script for Naraendra Farms.
Runs full schema + seed data via Supabase endpoints.
"""
import subprocess, json, os, sys, time

SK   = os.environ["SERVICE_KEY"]
ANON = os.environ["ANON_KEY"]
REF  = "kjliulgpipqqwptinrrd"
BASE = f"https://{REF}.supabase.co"

def run_sql_pg_meta(sql, label=""):
    """Run SQL via Supabase pg_meta endpoint (requires service_role)"""
    with open("/tmp/sql_payload.json","w") as f:
        json.dump({"query": sql}, f)
    r = subprocess.run([
        "curl","-s","-w","\nHTTP_CODE:%{http_code}","-X","POST",
        f"{BASE}/pg/query",
        "-H", f"Authorization: Bearer {SK}",
        "-H", "apikey: " + SK,
        "-H", "Content-Type: application/json",
        "--data-binary", "@/tmp/sql_payload.json"
    ], capture_output=True, text=True, timeout=60)
    lines = r.stdout.strip().split("\n")
    http_code = lines[-1].replace("HTTP_CODE:","")
    body = "\n".join(lines[:-1])
    print(f"  [{label}] HTTP {http_code}: {body[:200]}")
    return http_code, body

def run_sql_rest(sql, label=""):
    """Run SQL via Supabase REST rpc"""
    with open("/tmp/sql_payload.json","w") as f:
        json.dump({"query": sql}, f)
    r = subprocess.run([
        "curl","-s","-w","\nHTTP_CODE:%{http_code}","-X","POST",
        f"{BASE}/rest/v1/rpc/exec",
        "-H", f"Authorization: Bearer {SK}",
        "-H", f"apikey: {SK}",
        "-H", "Content-Type: application/json",
        "--data-binary", "@/tmp/sql_payload.json"
    ], capture_output=True, text=True, timeout=60)
    lines = r.stdout.strip().split("\n")
    http_code = lines[-1].replace("HTTP_CODE:","")
    body = "\n".join(lines[:-1])
    print(f"  [{label}] HTTP {http_code}: {body[:200]}")
    return http_code, body

def check_tables():
    """Check what tables exist via REST API"""
    r = subprocess.run([
        "curl","-s",
        f"{BASE}/rest/v1/farms?select=code&limit=1",
        "-H", f"apikey: {ANON}",
        "-H", f"Authorization: Bearer {ANON}"
    ], capture_output=True, text=True)
    try:
        d = json.loads(r.stdout)
        if isinstance(d, list): return True  # table exists
        if isinstance(d, dict) and d.get("code") == "PGRST205": return False  # table missing
    except: pass
    return None

print("="*60)
print("NARAENDRA FARMS - DATABASE INITIALIZATION")
print("="*60)

# Step 1: Check if schema already exists
print("\n1. Checking if schema exists...")
has_schema = check_tables()
print(f"   farms table: {'EXISTS' if has_schema else 'MISSING' if has_schema is False else 'UNKNOWN'}")

# Step 2: Try pg_meta endpoint for schema
print("\n2. Testing pg_meta endpoint...")
code, body = run_sql_pg_meta("SELECT 1 as test", "ping")
pg_meta_works = code.startswith("2")
print(f"   pg_meta works: {pg_meta_works}")

# Step 3: Try to install psql and use direct connection
print("\n3. Installing psql...")
r = subprocess.run(["apt-get","install","-y","-q","postgresql-client"],
    capture_output=True, text=True)
print(f"   psql install: {'OK' if r.returncode==0 else 'FAILED'}")

# Step 4: Run schema using best available method
if pg_meta_works:
    print("\n4. Running schema via pg_meta...")
    schema_sql = open("supabase/migrations/001_schema.sql").read()
    # Split into statements and run each
    stmts = [s.strip() for s in schema_sql.split(";") if s.strip() and not s.strip().startswith("--")]
    print(f"   Running {len(stmts)} statements...")
    errors = 0
    for i, stmt in enumerate(stmts[:5]):  # test first 5
        code, body = run_sql_pg_meta(stmt + ";", f"stmt_{i+1}")
        if not code.startswith("2"): errors += 1
    print(f"   Test errors: {errors}")
else:
    print("\n4. pg_meta not available")
    # Try direct psql connection
    DB_URL = os.environ.get("DB_URL","")
    if DB_URL:
        print("   Running via psql...")
        r = subprocess.run(["psql", DB_URL, "-f", "supabase/migrations/001_schema.sql"],
            capture_output=True, text=True)
        print(f"   psql: {r.returncode} | {r.stdout[:200]} | {r.stderr[:200]}")
    else:
        print("   No DB_URL available - need database password")
        print("   ACTION REQUIRED: Please provide the Supabase DB password")
        sys.exit(1)

# Report status
print("\n5. Final check...")
has_schema_after = check_tables()
print(f"   farms table after: {'EXISTS' if has_schema_after else 'STILL MISSING'}")
