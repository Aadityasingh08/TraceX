"""
TraceX Fast Bulk Ingestion Tool
================================
Ingests 15,000+ records into TraceX PostgreSQL Database in high-speed batches.
"""

import json
import os
import sys
import time
import requests

# Options:
# 1. Via Direct API (HTTP Batch)
# 2. Via Bulk CSV/JSON generator

TRACEX_API_URL = "http://localhost:5000/api/records/submit"
LOGIN_URL = "http://localhost:5000/api/auth/login"

def bulk_ingest(file_path="tracex_15000_dataset.json", limit=15000):
    if not os.path.exists(file_path):
        print(f"[!] Dataset file not found: {file_path}")
        return

    print(f"[*] Loading dataset from {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        records = json.load(f)

    total = min(len(records), limit)
    print(f"[*] Ingesting {total} records into TraceX...")

    # Authenticate
    token = None
    try:
        res = requests.post(LOGIN_URL, json={"email": "analyst@tracex.local", "password": "analyst123"}, timeout=5)
        if res.status_code == 200:
            token = res.json().get("token") or res.json().get("user", {}).get("token")
    except Exception as e:
        print(f"[!] Auth warning: {e}")

    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    success = 0
    start_time = time.time()

    for i, item in enumerate(records[:total], 1):
        payload = {
            "title": f"Intel Record #{item['id']} - {item['name']} ({item['location'].split(',')[0]})",
            "snippet": item["snippet"],
            "sourceLabel": f"TransitFeed / {item['source_channel']}",
            "type": "bulk_intel",
            "timestamp": item["date"]
        }

        try:
            r = requests.post(TRACEX_API_URL, json=payload, headers=headers, timeout=5)
            if r.status_code in [200, 201]:
                success += 1
            if i % 100 == 0 or i == total:
                elapsed = time.time() - start_time
                print(f"[+] Processed {i}/{total} records ({success} successful) | Speed: {i/elapsed:.1f} rec/sec")
        except Exception as e:
            if i % 100 == 0:
                print(f"[!] Error at record #{i}: {e}")

    print(f"\n[DONE] Successfully ingested {success}/{total} records into TraceX!")

if __name__ == "__main__":
    count = 15000
    if len(sys.argv) > 1:
        count = int(sys.argv[1])
    bulk_ingest("tracex_15000_dataset.json", limit=count)
