"""
TraceX Telegram Dump Ingester
==============================
Parses exported Telegram chat JSON files (e.g. `result.json` or `sample_telegram_dump.json`)
and pushes each message to the TraceX Backend API (/api/records/submit).

TraceX automatically runs:
  - Entity extraction (handles @user, phone numbers, crypto wallets 0x..., currencies, keywords)
  - Signal detection & anomaly scoring
  - Threat map correlation
"""

import json
import os
import sys
import datetime
import requests

# ----------------- CONFIGURATION -----------------
TRACEX_BASE_URL = os.environ.get("TRACEX_API_URL", "http://localhost:5000")
SUBMIT_URL = f"{TRACEX_BASE_URL}/api/records/submit"
LOGIN_URL = f"{TRACEX_BASE_URL}/api/auth/login"

# Default TraceX analyst credentials for authentication
DEFAULT_EMAIL = os.environ.get("TRACEX_USER", "analyst@tracex.local")
DEFAULT_PASSWORD = os.environ.get("TRACEX_PASS", "analyst123")
# -------------------------------------------------


def get_auth_token():
    """Authenticate with TraceX backend and get a JWT bearer token."""
    try:
        res = requests.post(
            LOGIN_URL,
            json={"email": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD},
            timeout=5
        )
        if res.status_code == 200:
            data = res.json()
            token = data.get("token") or (data.get("user") and data.get("user", {}).get("token"))
            print(f"[+] Authenticated successfully as {DEFAULT_EMAIL}")
            return token
        else:
            print(f"[*] Proceeding without token (Status {res.status_code}: {res.text})")
            return None
    except Exception as e:
        print(f"[!] Auth request failed ({e}). Proceeding without token...")
        return None


def parse_message_text(raw_text):
    """Handles Telegram's mixed text formats (plain string or array of objects)."""
    if isinstance(raw_text, str):
        return raw_text.strip()
    elif isinstance(raw_text, list):
        parts = []
        for item in raw_text:
            if isinstance(item, dict):
                parts.append(item.get("text", ""))
            else:
                parts.append(str(item))
        return "".join(parts).strip()
    return ""


def ingest_telegram_dump(file_path):
    if not os.path.exists(file_path):
        print(f"[!] Error: File not found -> {file_path}")
        return False

    print(f"[*] Reading Telegram dump from: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        try:
            dump_data = json.load(f)
        except Exception as e:
            print(f"[!] JSON parsing error: {e}")
            return False

    channel_name = dump_data.get("name") or dump_data.get("title") or "Telegram Channel Dump"
    channel_id = dump_data.get("id", "unknown_id")
    messages = dump_data.get("messages", [])

    if not messages and isinstance(dump_data, list):
        messages = dump_data

    print(f"[*] Target Channel: {channel_name} (ID: {channel_id})")
    print(f"[*] Total messages found: {len(messages)}")

    token = get_auth_token()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    ingested_count = 0
    total_candidates_found = 0

    for idx, msg in enumerate(messages, 1):
        # Ignore non-message objects
        if msg.get("type") != "message":
            continue

        text_content = parse_message_text(msg.get("text"))
        if not text_content:
            continue

        sender = msg.get("from") or msg.get("from_id") or "Anonymous"
        msg_id = msg.get("id", idx)
        date_str = msg.get("date") or datetime.datetime.utcnow().isoformat()

        # Build TraceX Signal payload
        snippet = f"[User: {sender}] {text_content}"
        payload = {
            "title": f"Telegram: {channel_name} (Msg #{msg_id})",
            "snippet": snippet[:4000],
            "sourceLabel": f"Telegram / {channel_name}",
            "type": "telegram_dump",
            "timestamp": date_str
        }

        try:
            res = requests.post(SUBMIT_URL, json=payload, headers=headers, timeout=10)
            if res.status_code in [200, 201]:
                res_data = res.json()
                signal_id = res_data.get("signalId")
                candidates = res_data.get("candidates", [])
                total_candidates_found += len(candidates)
                ingested_count += 1

                print(f"[+] [{idx}/{len(messages)}] Msg #{msg_id} -> Signal ID: {signal_id[:8]}... | Entities Extracted: {len(candidates)}")
                for c in candidates:
                    print(f"     -> Found {c.get('type')}: {c.get('value')} (Confidence: {c.get('confidence')})")
            else:
                print(f"[-] [{idx}/{len(messages)}] Failed to ingest Msg #{msg_id}: HTTP {res.status_code} - {res.text}")
        except Exception as e:
            print(f"[!] Network error on Msg #{msg_id}: {e}")

    print("\n" + "=" * 50)
    print(f"[SUCCESS] Ingestion Complete!")
    print(f" - Ingested Messages: {ingested_count}/{len(messages)}")
    print(f" - Extracted Entities/Candidates: {total_candidates_found}")
    print(f" - View them on TraceX Dashboard -> Signals / Threat Map")
    print("=" * 50)
    return True


if __name__ == "__main__":
    file_to_ingest = "sample_telegram_dump.json"
    if len(sys.argv) > 1:
        file_to_ingest = sys.argv[1]

    ingest_telegram_dump(file_to_ingest)
