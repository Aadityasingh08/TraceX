"""
TraceX Live Telegram Channel Crawler
====================================
Uses Telethon to connect to Telegram channels / groups in real-time,
scrapes latest incoming messages, and streams them into TraceX Backend.

Prerequisites:
  pip install telethon requests

Get API_ID and API_HASH from: https://my.telegram.org
"""

import os
import sys
import datetime
import asyncio
import requests
from telethon import TelegramClient, events

# ----------------- CONFIGURATION -----------------
# 1. Telegram API Credentials
API_ID = int(os.environ.get("TELEGRAM_API_ID", 12345678))          # <-- Replace with your Telegram API ID
API_HASH = os.environ.get("TELEGRAM_API_HASH", "YOUR_API_HASH_HERE") # <-- Replace with your Telegram API HASH
TARGET_CHANNEL = os.environ.get("TELEGRAM_TARGET", "some_public_channel") # e.g. "darknet_talks" or "@channel_name"

# 2. TraceX Backend URL
TRACEX_BASE_URL = os.environ.get("TRACEX_API_URL", "http://localhost:5000")
SUBMIT_URL = f"{TRACEX_BASE_URL}/api/records/submit"
LOGIN_URL = f"{TRACEX_BASE_URL}/api/auth/login"
DEFAULT_EMAIL = os.environ.get("TRACEX_USER", "analyst@tracex.local")
DEFAULT_PASSWORD = os.environ.get("TRACEX_PASS", "analyst123")
# -------------------------------------------------

auth_headers = {"Content-Type": "application/json"}


def authenticate_tracex():
    try:
        res = requests.post(
            LOGIN_URL,
            json={"email": DEFAULT_EMAIL, "password": DEFAULT_PASSWORD},
            timeout=5
        )
        if res.status_code == 200:
            token = res.json().get("token") or (res.json().get("user", {}).get("token"))
            if token:
                auth_headers["Authorization"] = f"Bearer {token}"
                print(f"[+] TraceX Authenticated as {DEFAULT_EMAIL}")
    except Exception as e:
        print(f"[!] TraceX Auth Warning: {e}")


def push_to_tracex(channel_name, msg_id, sender_name, text, timestamp):
    payload = {
        "title": f"Live TG: {channel_name} (Msg #{msg_id})",
        "snippet": f"[User: @{sender_name}] {text}"[:4000],
        "sourceLabel": f"Telegram Live / {channel_name}",
        "type": "telegram_live",
        "timestamp": timestamp
    }

    try:
        res = requests.post(SUBMIT_URL, json=payload, headers=auth_headers, timeout=10)
        if res.status_code in [200, 201]:
            data = res.json()
            candidates = data.get("candidates", [])
            print(f"[+] [Msg #{msg_id}] Ingested to TraceX | Candidates detected: {len(candidates)}")
            for c in candidates:
                print(f"     -> {c.get('type')}: {c.get('value')} (Score: {c.get('confidence')})")
        else:
            print(f"[-] Failed HTTP {res.status_code}: {res.text}")
    except Exception as e:
        print(f"[!] Push Error: {e}")


async def main():
    if API_ID == 12345678 or "YOUR_API_HASH" in API_HASH:
        print("[!] ERROR: Please set your actual TELEGRAM_API_ID and TELEGRAM_API_HASH from https://my.telegram.org")
        return

    authenticate_tracex()

    client = TelegramClient("tracex_tele_session", API_ID, API_HASH)
    await client.start()

    print(f"[*] Connected to Telegram! Monitoring channel: {TARGET_CHANNEL}")

    # Fetch last 20 messages initially
    print(f"[*] Fetching past 20 messages from {TARGET_CHANNEL}...")
    async for message in client.iter_messages(TARGET_CHANNEL, limit=20):
        if not message.text:
            continue
        sender = await message.get_sender()
        sender_name = getattr(sender, "username", None) or getattr(sender, "first_name", "Anonymous")
        msg_date = message.date.isoformat() if message.date else datetime.datetime.utcnow().isoformat()
        push_to_tracex(TARGET_CHANNEL, message.id, sender_name, message.text, msg_date)

    # Listen for new incoming messages live
    @client.on(events.NewMessage(chats=TARGET_CHANNEL))
    async def handler(event):
        msg = event.message
        if not msg.text:
            return
        sender = await msg.get_sender()
        sender_name = getattr(sender, "username", None) or getattr(sender, "first_name", "Anonymous")
        print(f"\n[*] [LIVE NEW MESSAGE] from @{sender_name}")
        push_to_tracex(
            TARGET_CHANNEL,
            msg.id,
            sender_name,
            msg.text,
            msg.date.isoformat() if msg.date else datetime.datetime.utcnow().isoformat()
        )

    print(f"[+] Real-time monitoring active. Press Ctrl+C to stop.")
    await client.run_until_disconnected()


if __name__ == "__main__":
    asyncio.run(main())
