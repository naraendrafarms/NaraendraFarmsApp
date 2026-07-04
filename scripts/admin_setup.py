import subprocess, json, os, sys

SK   = os.environ["SK"]
MGMT = os.environ["MGMT"]
REF  = os.environ["REF"]
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@naraendrafarms.com")
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
BASE = f"https://kjliulgpipqqwptinrrd.supabase.co"

def curl_json(method, url, headers, data=None):
    cmd = ["curl", "-s", "-X", method, url]
    for k, v in headers.items():
        cmd += ["-H", f"{k}: {v}"]
    if data:
        cmd += ["-d", json.dumps(data)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except:
        return {}

def run_sql(sql):
    with open("/tmp/q.json", "w") as f:
        json.dump({"query": sql}, f)
    r = subprocess.run([
        "curl", "-s", "-X", "POST",
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        "-H", f"Authorization: Bearer {MGMT}",
        "-H", "Content-Type: application/json",
        "--data-binary", "@/tmp/q.json"
    ], capture_output=True, text=True)
    print("SQL result:", r.stdout[:300])
    return r.stdout

auth_headers = {"apikey": SK, "Authorization": f"Bearer {SK}", "Content-Type": "application/json"}

# Try to create user
create_resp = curl_json("POST", f"{BASE}/auth/v1/admin/users", auth_headers, {
    "email": ADMIN_EMAIL,
    "password": ADMIN_PASSWORD,
    "email_confirm": True,
    "user_metadata": {"full_name": "Admin", "role": "admin"}
})
user_id = create_resp.get("id", "")
print(f"Create response id: {user_id}")

# If user already existed, fetch from list
if not user_id:
    list_resp = curl_json("GET", f"{BASE}/auth/v1/admin/users?per_page=200", auth_headers)
    users = list_resp.get("users", [])
    for u in users:
        if u.get("email") == ADMIN_EMAIL:
            user_id = u["id"]
            break

print(f"Admin user ID: {user_id}")
if not user_id:
    print("ERROR: Could not get admin user ID")
    sys.exit(1)

# Upsert profile
sql = (
    f"INSERT INTO public.profiles (id, full_name, role, is_active) "
    f"VALUES ('{user_id}', 'Admin', 'admin', true) "
    f"ON CONFLICT (id) DO UPDATE SET role='admin', full_name='Admin', is_active=true;"
)
run_sql(sql)
print("Admin profile upserted successfully")

# Also add email column to profiles if missing
add_email_col = "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;"
run_sql(add_email_col)
print("Email column ensured on profiles table")
