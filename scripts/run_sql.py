#!/usr/bin/env python3
"""Run SQL file via Supabase Management API - statement by statement"""
import subprocess, json, os, sys

MGMT  = os.environ["MGMT"]
REF   = os.environ.get("REF", "kjliulgpipqqwptinrrd")
fname = sys.argv[1]
label = fname.split("/")[-1]

with open(fname) as f:
    sql = f.read()

print(f"[{label}] {len(sql)} chars")

def run_one(query, lbl=""):
    with open("/tmp/q.json","w") as f:
        json.dump({"query": query}, f)
    r = subprocess.run(["curl","-s","-X","POST",
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        "-H", f"Authorization: Bearer {MGMT}",
        "-H", "Content-Type: application/json",
        "--data-binary", "@/tmp/q.json"],
        capture_output=True, text=True, timeout=120)
    try: return json.loads(r.stdout)
    except: return r.stdout[:200]

# Smart split: respect $$ dollar-quoted blocks
stmts = []
in_dollar = False
current_lines = []
for line in sql.split("\n"):
    if "$$" in line:
        count = line.count("$$")
        if count % 2 != 0:
            in_dollar = not in_dollar
    current_lines.append(line)
    if line.rstrip().endswith(";") and not in_dollar:
        s = "\n".join(current_lines).strip()
        if s and not all(l.strip().startswith("--") or not l.strip() for l in s.split("\n")):
            stmts.append(s)
        current_lines = []

if not stmts:
    stmts = [sql]  # fallback: send whole thing

print(f"[{label}] {len(stmts)} statements")

ok_phrases = ["already exists", "already defined", "does not exist", "duplicate"]
errors = 0
for i, stmt in enumerate(stmts):
    resp = run_one(stmt)
    if isinstance(resp, dict) and resp.get("message"):
        msg = resp["message"]
        if any(p in msg.lower() for p in ok_phrases):
            pass  # expected
        else:
            print(f"  [{i+1}] ERROR: {msg[:300]}")
            errors += 1
    elif isinstance(resp, list):
        if len(resp) > 0 and i < 5:
            preview = json.dumps(resp[:5], default=str)[:600]
            print(f"  [{i+1}] OK rows={len(resp)}: {preview}")
    # else: DDL statements return empty list - that's fine

print(f"[{label}] Done. Errors: {errors}")
sys.exit(0)
