#!/usr/bin/env python3
import subprocess, json, os

ANON = os.environ["ANON_KEY"]
SK   = os.environ["SERVICE_KEY"]
GH_TOKEN = os.environ["GITHUB_TOKEN"]
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
    return "table_not_found"

def rest_get(table, fields, limit=3):
    url = f"{BASE}/{table}?select={fields}&limit={limit}"
    r = subprocess.run(["curl","-s",url,
        "-H",f"apikey: {ANON}","-H",f"Authorization: Bearer {ANON}"],
        capture_output=True, text=True)
    try: return json.loads(r.stdout)
    except: return r.stdout[:200]

def mgmt_sql(sql):
    with open("/tmp/q.json","w") as f: json.dump({"query":sql},f)
    r = subprocess.run(["curl","-s","-X","POST",
        "https://api.supabase.com/v1/projects/kjliulgpipqqwptinrrd/database/query",
        "-H",f"Authorization: Bearer {SK}",
        "-H","Content-Type: application/json",
        "-d","@/tmp/q.json"], capture_output=True, text=True)
    try: return json.loads(r.stdout)
    except: return r.stdout[:300]

# Collect all results
lines = ["## Naraendra Farms - Database Verification\n"]

lines.append("### REST API Table Counts")
for t in ["farms","flocks","daily_records","he_dispatch","hatchability","salary_abstract","electricity_bills"]:
    c = rest_count(t)
    lines.append(f"- **{t}**: `{c}`")

lines.append("\n### Supabase Mgmt API - Direct SQL")
for t in ["daily_records","he_dispatch","hatchability","salary_abstract","electricity_bills"]:
    res = mgmt_sql(f"SELECT COUNT(*) as n FROM public.{t}")
    if isinstance(res,list) and res: lines.append(f"- **{t}**: {res[0].get('n','?')}")
    else: lines.append(f"- **{t}**: ERROR: {str(res)[:150]}")

lines.append("\n### Farms")
farms = rest_get("farms","code,name",10)
if isinstance(farms,list):
    for f in farms: lines.append(f"- {f.get('code')}: {f.get('name')}")
else: lines.append(f"- {farms}")

lines.append("\n### Flocks")
flocks = rest_get("flocks","flock_no,status,placement_date",10)
if isinstance(flocks,list):
    for f in flocks: lines.append(f"- F{f.get('flock_no')}: {f.get('status')} placed={f.get('placement_date')}")
else: lines.append(f"- {flocks}")

lines.append("\n### Daily Records Sample")
dr = rest_get("daily_records","record_date,total_eggs,he_eggs&order=record_date",5)
if isinstance(dr,list):
    for d in dr: lines.append(f"- {d.get('record_date')}: eggs={d.get('total_eggs')} he={d.get('he_eggs')}")
else: lines.append(f"- {dr}")

lines.append("\n### Hatchability Sample")
h = rest_get("hatchability","setting_date,hatchery,eggs_set,hatch_pct",5)
if isinstance(h,list):
    for r in h: lines.append(f"- {r.get('setting_date')} {r.get('hatchery')}: {r.get('eggs_set')} eggs {r.get('hatch_pct')}%")
else: lines.append(f"- {h}")

body = "\n".join(lines)
print(body)

# Create GitHub issue with results
import json as json2
with open("/tmp/issue.json","w") as f:
    json2.dump({"title":"DB Verification Results","body":body,"labels":[]},f)

r = subprocess.run(["curl","-s","-X","POST",
    "https://api.github.com/repos/naraendrafarms/NaraendraFarmsApp/issues",
    "-H",f"Authorization: token {GH_TOKEN}",
    "-H","Accept: application/vnd.github+json",
    "-H","Content-Type: application/json",
    "-d","@/tmp/issue.json"], capture_output=True,text=True)
try:
    d = json2.loads(r.stdout)
    print(f"\nIssue created: #{d.get('number')} - {d.get('html_url','')}")
except: print("Issue create response:", r.stdout[:200])
