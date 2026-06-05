#!/usr/bin/env python3
"""Run a SQL file against Supabase Management API"""
import subprocess, json, os, sys, time

MGMT = os.environ["MGMT"]
REF  = os.environ.get("REF", "kjliulgpipqqwptinrrd")
fname = sys.argv[1]
sql = open(fname).read()
label = fname.split("/")[-1]

with open("/tmp/q.json","w") as f:
    json.dump({"query": sql}, f)

r = subprocess.run([
    "curl","-s","-w","\nHTTP:%{http_code}","-X","POST",
    f"https://api.supabase.com/v1/projects/{REF}/database/query",
    "-H", f"Authorization: Bearer {MGMT}",
    "-H", "Content-Type: application/json",
    "--data-binary", "@/tmp/q.json"
], capture_output=True, text=True, timeout=180)

lines = r.stdout.strip().split("\n")
status = lines[-1]
body   = "\n".join(lines[:-1])
print(f"[{label}] {status}")
if body.strip() and body.strip() != "null":
    # Print only errors
    try:
        d = json.loads(body)
        if isinstance(d, dict) and d.get("message"):
            print(f"  Response: {d.get('message','')[:300]}")
        elif isinstance(d, list) and d:
            print(f"  Rows returned: {len(d)}")
    except:
        if len(body) < 500:
            print(f"  Body: {body}")

# Exit 0 even on SQL errors (e.g. table already exists) - non-fatal
sys.exit(0)
