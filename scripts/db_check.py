#!/usr/bin/env python3
"""DB verification script - run in GitHub Actions to check table counts"""
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
            # content-range: 0-0/1949
            try: return int(line.split("/")[1].strip())
            except: return line.strip()
    return "?"

def rest_get(table, select="*", limit=5):
    r = subprocess.run([
        "curl", "-s",
        f"{BASE}/{table}?select={select}&limit={limit}",
        "-H", f"apikey: {ANON}",
        "-H", f"Authorization: Bearer {ANON}"
    ], capture_output=True, text=True)
    try: return json.loads(r.stdout)
    except: return r.stdout[:200]

def mgmt_query(sql):
    payload = json.dumps({"query": sql})
    with open("/tmp/q.json","w") as f: f.write(payload)
    r = subprocess.run([
        "curl", "-s", "-X", "POST",
        "https://api.supabase.com/v1/projects/kjliulgpipqqwptinrrd/database/query",
        "-H", f"Authorization: Bearer {SK}",
        "-H", "Content-Type: application/json",
        "-d", "@/tmp/q.json"
    ], capture_output=True, text=True)
    try: return json.loads(r.stdout)
    except: return r.stdout[:300]

print("=" * 50)
print("NARAENDRA FARMS - DATABASE VERIFICATION")
print("=" * 50)

tables = ["farms","flocks","daily_records","he_dispatch",
          "hatchability","salary_abstract","electricity_bills"]
for t in tables:
    count = rest_count(t)
    print(f"  {t:30s}: {count}")

print()
print("FARMS:")
farms = rest_get("farms","code,name")
for f in (farms if isinstance(farms,list) else []):
    print(f"  {f.get('code','?'):10} {f.get('name','?')}")

print()
print("FLOCKS:")
flocks = rest_get("flocks","flock_no,status,placement_date")
for f in (flocks if isinstance(flocks,list) else []):
    print(f"  F{f.get('flock_no','?'):5} {f.get('status','?'):10} {f.get('placement_date','?')}")

print()
print("SAMPLE DAILY RECORDS:")
dr = rest_get("daily_records","record_date,total_eggs,he_eggs&order=record_date",3)
for r in (dr if isinstance(dr,list) else []):
    print(f"  {r.get('record_date','?')} eggs={r.get('total_eggs','?')} he={r.get('he_eggs','?')}")

print()
print("MGMT API - COUNTS:")
for table in ["daily_records","he_dispatch","hatchability","salary_abstract","electricity_bills"]:
    result = mgmt_query(f"SELECT COUNT(*) as n FROM public.{table}")
    if isinstance(result, list) and result:
        print(f"  {table}: {result[0].get('n','?')}")
    else:
        print(f"  {table}: {str(result)[:100]}")

print()
print("HATCHABILITY SAMPLE:")
hatch = rest_get("hatchability","setting_date,hatchery,eggs_set,chicks_hatched,hatch_pct",3)
for h in (hatch if isinstance(hatch,list) else []):
    print(f"  {h.get('setting_date','?')} {h.get('hatchery','?'):15} {h.get('eggs_set','?')} eggs {h.get('hatch_pct','?')} hatch%")
