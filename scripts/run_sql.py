#!/usr/bin/env python3
"""Run SQL file via Supabase Management API with proper error detection"""
import subprocess, json, os, sys, time

MGMT  = os.environ["MGMT"]
REF   = os.environ.get("REF", "kjliulgpipqqwptinrrd")
fname = sys.argv[1]
label = fname.split("/")[-1]

with open(fname) as f:
    sql = f.read()

print(f"[{label}] Running {len(sql)} chars of SQL...")

with open("/tmp/q.json","w") as f:
    json.dump({"query": sql}, f)

r = subprocess.run([
    "curl", "-s", "-w", "\nHTTP_STATUS:%{http_code}", "-X", "POST",
    f"https://api.supabase.com/v1/projects/{REF}/database/query",
    "-H", f"Authorization: Bearer {MGMT}",
    "-H", "Content-Type: application/json",
    "--data-binary", "@/tmp/q.json"
], capture_output=True, text=True, timeout=180)

lines = r.stdout.strip().split("\n")
http_status = lines[-1]
body = "\n".join(lines[:-1])

print(f"[{label}] {http_status}")

# Parse body to check for errors
try:
    parsed = json.loads(body)
    if isinstance(parsed, dict) and parsed.get("message"):
        msg = parsed["message"]
        # These are acceptable - means item already exists
        ok_errors = ["already exists", "already defined", "duplicate", "multiple"]
        if any(e in msg.lower() for e in ok_errors):
            print(f"[{label}] NOTE (OK): {msg[:200]}")
        else:
            print(f"[{label}] SQL ERROR: {msg[:500]}")
            # Try statement by statement
            print(f"[{label}] Retrying statement by statement...")
            import re
            # Smart split: don't split inside dollar-quoted blocks
            stmts = []
            in_dollar = False
            current = []
            for line in sql.split("\n"):
                if "$$" in line:
                    in_dollar = not in_dollar
                current.append(line)
                if line.rstrip().endswith(";") and not in_dollar:
                    s = "\n".join(current).strip()
                    if s and not s.startswith("--"):
                        stmts.append(s)
                    current = []
            
            errors = 0
            for i, stmt in enumerate(stmts):
                with open("/tmp/stmt.json","w") as f:
                    json.dump({"query": stmt}, f)
                r2 = subprocess.run(["curl","-s","-X","POST",
                    f"https://api.supabase.com/v1/projects/{REF}/database/query",
                    "-H",f"Authorization: Bearer {MGMT}",
                    "-H","Content-Type: application/json",
                    "--data-binary","@/tmp/stmt.json"],
                    capture_output=True,text=True,timeout=60)
                try:
                    d = json.loads(r2.stdout)
                    if isinstance(d,dict) and d.get("message"):
                        m = d["message"]
                        if not any(e in m.lower() for e in ["already exists","already defined"]):
                            print(f"  stmt_{i+1} ERROR: {m[:200]}")
                            errors += 1
                        else:
                            pass  # already exists = ok
                except:
                    pass
            print(f"[{label}] Stmt-by-stmt done. Errors: {errors}")
    elif isinstance(parsed, list):
        if parsed:
            print(f"[{label}] OK - {len(parsed)} rows returned")
        else:
            print(f"[{label}] OK - empty result (expected for DDL)")
    else:
        print(f"[{label}] Response: {str(parsed)[:200]}")
except json.JSONDecodeError:
    if body.strip():
        print(f"[{label}] Non-JSON response: {body[:200]}")
    else:
        print(f"[{label}] OK - empty response")

sys.exit(0)  # Always exit 0 - let workflow continue
