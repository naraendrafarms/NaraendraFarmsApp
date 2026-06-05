#!/usr/bin/env python3
import subprocess, json, os

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
    return "not_found"

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

# Counts
counts = {}
for t in ["farms","flocks","daily_records","he_dispatch","hatchability","salary_abstract","electricity_bills"]:
    counts[t] = rest_count(t)

# Mgmt API counts  
mgmt = {}
for t in ["daily_records","he_dispatch","hatchability","salary_abstract","electricity_bills"]:
    res = mgmt_sql(f"SELECT COUNT(*) as n FROM public.{t}")
    mgmt[t] = res[0].get("n","?") if isinstance(res,list) and res else str(res)[:100]

farms = rest_get("farms","code,name",10)
flocks = rest_get("flocks","flock_no,status,placement_date",10)
dr_sample = rest_get("daily_records","record_date,total_eggs,he_eggs&order=record_date",3)
hatch_sample = rest_get("hatchability","setting_date,hatchery,eggs_set,hatch_pct",3)

# Print results
print("TABLE_COUNTS:", json.dumps(counts))
print("MGMT_COUNTS:", json.dumps(mgmt))
print("FARMS:", json.dumps(farms))
print("FLOCKS:", json.dumps(flocks))
print("DAILY_SAMPLE:", json.dumps(dr_sample))
print("HATCH_SAMPLE:", json.dumps(hatch_sample))

# Write to GITHUB_STEP_SUMMARY  
summary_file = os.environ.get("GITHUB_STEP_SUMMARY","/tmp/summary.md")
with open(summary_file,"w") as f:
    f.write("# DB Status\n\n")
    f.write("## REST Counts\n")
    for k,v in counts.items(): f.write(f"- **{k}**: {v}\n")
    f.write("\n## Mgmt API Counts\n")
    for k,v in mgmt.items(): f.write(f"- **{k}**: {v}\n")
    f.write("\n## Farms\n")
    if isinstance(farms,list):
        for fa in farms: f.write(f"- {fa.get('code')}: {fa.get('name')}\n")
    f.write("\n## Flocks\n")
    if isinstance(flocks,list):
        for fl in flocks: f.write(f"- F{fl.get('flock_no')}: {fl.get('status')} - {fl.get('placement_date')}\n")
    f.write("\n## Daily Records Sample\n")
    if isinstance(dr_sample,list):
        for d in dr_sample: f.write(f"- {d.get('record_date')}: eggs={d.get('total_eggs')} he={d.get('he_eggs')}\n")
    f.write("\n## Hatchability Sample\n")
    if isinstance(hatch_sample,list):
        for h in hatch_sample: f.write(f"- {h.get('setting_date')} {h.get('hatchery')}: {h.get('eggs_set')} eggs {h.get('hatch_pct')}%\n")
    else: f.write(str(hatch_sample)+"\n")
print("Done!")
