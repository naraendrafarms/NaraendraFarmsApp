#!/usr/bin/env python3
import subprocess, json, os, sys

ANON = os.environ["ANON_KEY"]
SK   = os.environ["SERVICE_KEY"]
BASE = "https://kjliulgpipqqwptinrrd.supabase.co/rest/v1"

def rest_count(table):
    r = subprocess.run([
        "curl", "-s", "-I",
        f"{BASE}/{table}?select=id&limit=0",
        "-H", f"apikey: {ANON}",
        "-H", f"Authorization: Bearer {ANON}",
        "-H", "Prefer: count=exact"
    ], capture_output=True, text=True)
    for line in r.stdout.split("\n"):
        if "content-range" in line.lower():
            try: return int(line.split("/")[1].strip())
            except: return line.strip()
    return "?"

def rest_get(table, fields, limit=3):
    url = f"{BASE}/{table}?select={fields}&limit={limit}"
    r = subprocess.run([
        "curl", "-s", url,
        "-H", f"apikey: {ANON}",
        "-H", f"Authorization: Bearer {ANON}"
    ], capture_output=True, text=True)
    try: return json.loads(r.stdout)
    except: return r.stdout[:200]

def mgmt_sql(sql):
    with open("/tmp/q.json","w") as f: 
        json.dump({"query": sql}, f)
    r = subprocess.run([
        "curl", "-s", "-X", "POST",
        "https://api.supabase.com/v1/projects/kjliulgpipqqwptinrrd/database/query",
        "-H", f"Authorization: Bearer {SK}",
        "-H", "Content-Type: application/json",
        "-d", "@/tmp/q.json"
    ], capture_output=True, text=True)
    try: return json.loads(r.stdout)
    except: return r.stdout[:300]

lines = []
lines.append("# DB Verification Results")
lines.append("")

tables = ["farms","flocks","daily_records","he_dispatch","hatchability","salary_abstract","electricity_bills"]
lines.append("## Table Counts (REST API)")
for t in tables:
    c = rest_count(t)
    lines.append(f"- **{t}**: {c}")

lines.append("")
lines.append("## Farms")
farms = rest_get("farms","code,name",10)
if isinstance(farms,list):
    for f in farms: lines.append(f"- {f.get('code')}: {f.get('name')}")
else: lines.append(str(farms))

lines.append("")
lines.append("## Flocks")
flocks = rest_get("flocks","flock_no,status,placement_date",10)
if isinstance(flocks,list):
    for f in flocks: lines.append(f"- F{f.get('flock_no')}: {f.get('status')} placed {f.get('placement_date')}")
else: lines.append(str(flocks))

lines.append("")
lines.append("## Daily Records Sample (first 3)")
dr = rest_get("daily_records","record_date,total_eggs,he_eggs&order=record_date",3)
if isinstance(dr,list):
    for r in dr: lines.append(f"- {r.get('record_date')}: eggs={r.get('total_eggs')} he={r.get('he_eggs')}")
else: lines.append(str(dr))

lines.append("")
lines.append("## Hatchability Sample")
hatch = rest_get("hatchability","setting_date,hatchery,eggs_set,hatch_pct",3)
if isinstance(hatch,list):
    for h in hatch: lines.append(f"- {h.get('setting_date')} {h.get('hatchery')}: {h.get('eggs_set')} eggs {h.get('hatch_pct')} hatch%")
else: lines.append(str(hatch))

lines.append("")
lines.append("## Mgmt API Direct SQL Counts")
for table in ["daily_records","he_dispatch","hatchability","salary_abstract","electricity_bills"]:
    res = mgmt_sql(f"SELECT COUNT(*) as n FROM public.{table}")
    if isinstance(res,list) and res: lines.append(f"- {table}: {res[0].get('n','?')}")
    else: lines.append(f"- {table}: {str(res)[:100]}")

output = "\n".join(lines)
print(output)
with open("DB_STATUS.md","w") as f: f.write(output)
print("\nWritten to DB_STATUS.md")
