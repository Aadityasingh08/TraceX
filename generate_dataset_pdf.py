import json
import os
import subprocess
import tempfile

def generate_pdf_report():
    json_path = os.path.abspath("tracex_15000_dataset.json")
    if not os.path.exists(json_path):
        print(f"[!] File not found: {json_path}")
        return

    print("[*] Loading 15,000 dataset for PDF generation...")
    with open(json_path, "r", encoding="utf-8") as f:
        records = json.load(f)

    total_records = len(records)
    print(f"[*] Total records: {total_records}. Formatting HTML for PDF conversion...")

    # Calculate statistics
    total_val = sum(r.get("amount_inr", 0) for r in records)
    cities_count = len(set(r.get("location") for r in records))
    channels_count = len(set(r.get("source_channel") for r in records))

    # Generate HTML Table rows (high density styling)
    # We include all records
    table_rows = []
    for r in records:
        table_rows.append(f"""
        <tr>
            <td class="mono font-bold">#{r['id']}</td>
            <td><strong>{r['name']}</strong><br><span class="muted mono">{r['handle']}</span></td>
            <td>{r['location']}</td>
            <td class="mono">{r['contact_phone']}<br><span class="muted" style="font-size:10px">{r['contact_email']}</span></td>
            <td class="mono" style="font-size:10px">{r['wallet'][:10]}...{r['wallet'][-6:]}</td>
            <td class="mono font-bold text-cyan">₹{r['amount_inr']:,}</td>
            <td class="mono text-muted" style="font-size:10px">{r['date'][:10]}</td>
            <td style="font-size:10px">{r['source_channel']}</td>
        </tr>
        """)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TRACE-X | 15,000 Intelligence Records Dossier</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
  @page {{
    size: A4 landscape;
    margin: 10mm 10mm 12mm 10mm;
    @bottom-right {{
      content: counter(page);
    }}
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    color: #0f172a;
    background: #ffffff;
    font-size: 11px;
    line-height: 1.4;
  }}
  .mono {{ font-family: 'JetBrains Mono', monospace; }}
  .font-bold {{ font-weight: 700; }}
  .text-cyan {{ color: #0891b2; }}
  .text-muted {{ color: #64748b; }}
  .muted {{ color: #94a3b8; font-size: 10px; }}

  /* COVER / HEADER */
  .header-card {{
    background: linear-gradient(135deg, #090d16 0%, #171c2f 60%, #0c1020 100%);
    color: #ffffff;
    padding: 24px 30px;
    border-radius: 8px;
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
  .header-card h1 {{
    font-size: 24px;
    letter-spacing: -0.03em;
    margin-bottom: 4px;
    color: #38bdf8;
  }}
  .header-card p {{
    color: #94a3b8;
    font-size: 12px;
  }}
  .kpi-grid {{
    display: flex;
    gap: 16px;
  }}
  .kpi-box {{
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    padding: 10px 16px;
    border-radius: 6px;
    text-align: center;
  }}
  .kpi-box span {{
    display: block;
    color: #94a3b8;
    font-size: 9px;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.05em;
  }}
  .kpi-box strong {{
    display: block;
    font-size: 18px;
    color: #f8fafc;
    font-family: 'JetBrains Mono', monospace;
    margin-top: 2px;
  }}

  /* TABLE */
  table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5px;
    page-break-inside: auto;
  }}
  tr {{
    page-break-inside: avoid;
    page-break-after: auto;
  }}
  thead {{
    display: table-header-group;
  }}
  th {{
    background: #0f172a;
    color: #f8fafc;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 600;
    text-align: left;
    padding: 7px 8px;
    border: 1px solid #1e293b;
    letter-spacing: 0.03em;
  }}
  td {{
    padding: 5px 8px;
    border: 1px solid #e2e8f0;
    vertical-align: middle;
  }}
  tbody tr:nth-child(even) {{
    background: #f8fafc;
  }}
</style>
</head>
<body>

<div class="header-card">
  <div>
    <div style="font-family:'JetBrains Mono',monospace; font-size:10px; color:#38bdf8; letter-spacing:0.08em; margin-bottom:4px;">TRACE-X INTELLIGENCE CORPUS</div>
    <h1>15,000 Multi-Source Transit & Operatives Dossier</h1>
    <p>Comprehensive structured records: Suspect Identifiers, Transit Corridors, Escrow Settlements & Contact Telemetry</p>
  </div>
  <div class="kpi-grid">
    <div class="kpi-box">
      <span>TOTAL RECORDS</span>
      <strong>{total_records:,}</strong>
    </div>
    <div class="kpi-box">
      <span>MONITORED CITIES</span>
      <strong>{cities_count}</strong>
    </div>
    <div class="kpi-box">
      <span>INTEL CHANNELS</span>
      <strong>{channels_count}</strong>
    </div>
    <div class="kpi-box">
      <span>ESCROW VALUE</span>
      <strong style="color:#34d399">₹{total_val:,}</strong>
    </div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width: 50px;">REC ID</th>
      <th style="width: 130px;">NAME & HANDLE</th>
      <th style="width: 130px;">LOCATION CORRIDOR</th>
      <th style="width: 150px;">CONTACT (PHONE / EMAIL)</th>
      <th style="width: 140px;">ESCROW WALLET</th>
      <th style="width: 85px;">VALUATION</th>
      <th style="width: 80px;">DATE</th>
      <th>SOURCE / CHANNEL</th>
    </tr>
  </thead>
  <tbody>
    {''.join(table_rows)}
  </tbody>
</table>

</body>
</html>
"""

    temp_html = os.path.abspath("tracex_15000_temp.html")
    pdf_out = os.path.abspath("TRACE_X_15000_Records_Dataset.pdf")

    print("[*] Writing HTML template...")
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)

    user_data_dir = os.path.join(tempfile.gettempdir(), "chrome_pdf_profile_15k")
    os.makedirs(user_data_dir, exist_ok=True)

    chrome_exe = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    edge_exe = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    browser = chrome_exe if os.path.exists(chrome_exe) else edge_exe

    cmd = [
        browser,
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        f"--user-data-dir={user_data_dir}",
        f"--print-to-pdf={pdf_out}",
        temp_html
    ]

    print(f"[*] Compiling PDF via {os.path.basename(browser)} (this may take 10-15 seconds for 15,000 records)...")
    res = subprocess.run(cmd, capture_output=True, text=True)

    if os.path.exists(pdf_out):
        size_mb = os.path.getsize(pdf_out) / (1024 * 1024)
        print(f"[SUCCESS] PDF generated successfully!")
        print(f" -> Output Path: {pdf_out}")
        print(f" -> File Size: {size_mb:.2f} MB")
    else:
        print("[!] PDF generation failed:", res.stderr)

if __name__ == "__main__":
    generate_pdf_report()
