#!/usr/bin/env python3
import subprocess, json, os, time

ANON = os.environ.get("ANON_KEY","")
SK   = os.environ.get("SERVICE_KEY","")
MGMT = os.environ.get("MGMT_TOKEN","")
GH   = os.environ.get("GH_PAT","")
REF  = "kjliulgpipqqwptinrrd"
BASE = f"https://{REF}.supabase.co"

def mgmt_sql(sql):
    with open("/tmp/q.json","w") as f: json.dump({"query":sql},f)
    r = subprocess.run(["curl","-s","-w","\nHTTP:%{http_code}","-X","POST",
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        "-H",f"Authorization: Bearer {MGMT}",
        "-H","Content-Type: application/json",
        "--data-binary","@/tmp/q.json"],capture_output=True,text=True,timeout=60)
    lines=r.stdout.strip().split("\n"); status=lines[-1]; body="\n".join(lines[:-1])
    return status, body

def rest_get(path):
    r = subprocess.run(["curl","-s",f"{BASE}/rest/v1/{path}",
        "-H",f"apikey: {ANON}","-H",f"Authorization: Bearer {ANON}"],
        capture_output=True,text=True,timeout=30)
    try: return json.loads(r.stdout)
    except: return r.stdout[:200]

# Reload PostgREST schema cache
print("Reloading PostgREST schema cache...")
r = subprocess.run(["curl","-s","-X","POST",
    f"{BASE}/rest/v1/",
    "-H",f"apikey: {SK}",
    "-H",f"Authorization: Bearer {SK}",
    "-H","Content-Profile: pg_catalog",
    "-H","Content-Type: application/json"],
    capture_output=True,text=True,timeout=10)
print(f"Cache reload: {r.stdout[:100]}")
time.sleep(3)

lines = []
lines.append("## DB Verification — After Schema Load\n")

# Use MGMT API for accurate counts
lines.append("### Table Counts (Management API)")
for t in ["farms","flocks","daily_records","he_dispatch","hatchability","salary_abstract","electricity_bills"]:
    status, body = mgmt_sql(f"SELECT COUNT(*) as n FROM public.{t}")
    try:
        d = json.loads(body)
        n = d[0]["n"] if isinstance(d,list) and d else str(d)[:100]
    except: n = f"HTTP:{status} {body[:100]}"
    lines.append(f"- **{t}**: {n}")

# Also via REST (may have cache issue)
lines.append("\n### REST API (may be stale cache)")
for t in ["farms","flocks","daily_records","he_dispatch","hatchability"]:
    r2 = subprocess.run(["curl","-sI",
        f"{BASE}/rest/v1/{t}?select=id&limit=0",
        "-H",f"apikey: {ANON}","-H",f"Authorization: Bearer {ANON}",
        "-H","Prefer: count=exact"],capture_output=True,text=True,timeout=15)
    count = "?"
    for line in r2.stdout.split("\n"):
        if "content-range" in line.lower():
            try: count = int(line.split("/")[1].strip())
            except: count = line.strip()
    lines.append(f"- **{t}**: {count}")

# Sample data
lines.append("\n### Farms")
_, fbody = mgmt_sql("SELECT code,name FROM public.farms ORDER BY code")
try:
    farms = json.loads(fbody)
    for f in (farms if isinstance(farms,list) else []): lines.append(f"- {f.get('code')}: {f.get('name')}")
except: lines.append(str(fbody)[:200])

lines.append("\n### Flocks")
_, flbody = mgmt_sql("SELECT flock_no,status,placement_date FROM public.flocks ORDER BY flock_no")
try:
    flocks = json.loads(flbody)
    for f in (flocks if isinstance(flocks,list) else []): lines.append(f"- F{f.get('flock_no')}: {f.get('status')} placed={f.get('placement_date')}")
except: lines.append(str(flbody)[:200])

lines.append("\n### Daily Records (first 5)")
_, drbody = mgmt_sql("SELECT record_date,total_eggs,he_eggs FROM public.daily_records ORDER BY record_date LIMIT 5")
try:
    dr = json.loads(drbody)
    for d in (dr if isinstance(dr,list) else []): lines.append(f"- {d.get('record_date')}: eggs={d.get('total_eggs')} he={d.get('he_eggs')}")
except: lines.append(str(drbody)[:200])

lines.append("\n### Hatchability (first 5)")
_, hbody = mgmt_sql("SELECT setting_date,hatchery,eggs_set,hatch_pct FROM public.hatchability ORDER BY setting_date LIMIT 5")
try:
    hatch = json.loads(hbody)
    for h in (hatch if isinstance(hatch,list) else []): lines.append(f"- {h.get('setting_date')} {h.get('hatchery')}: {h.get('eggs_set')} eggs {h.get('hatch_pct')}%")
except: lines.append(str(hbody)[:200])

body = "\n".join(lines)
print(body)

# Post to GitHub issue
with open("/tmp/issue.json","w") as f:
    json.dump({"title":"DB Verification Results - Final","body":body,"labels":[]},f)
r = subprocess.run(["curl","-s","-X","POST",
    "https://api.github.com/repos/naraendrafarms/NaraendraFarmsApp/issues",
    "-H",f"Authorization: token {GH}",
    "-H","Accept: application/vnd.github+json",
    "-H","Content-Type: application/json",
    "--data-binary","@/tmp/issue.json"],capture_output=True,text=True)
try:
    d = json.loads(r.stdout)
    print(f"Issue: #{d.get('number')} {d.get('html_url','')}")
except: print("Issue response:", r.stdout[:200])
