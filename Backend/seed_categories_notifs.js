import pool from "./src/config/db.js";

async function seedCategoriesAndNotifications() {
  console.log("Seeding categories and notifications if missing...");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

    INSERT INTO categories (name) VALUES 
      ('Command & Control'),
      ('Target Data Exfiltration'),
      ('Cryptocurrency Mixer'),
      ('Identity & Operator Alias'),
      ('Network Relay & Proxy'),
      ('Threat Actor Syndicate'),
      ('Location & Fiber Transit'),
      ('Automated Reconnaissance')
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO notifications (title, detail, route, unread, time) VALUES
      ('CRITICAL: High-volume data exfiltration in progress', 'ALERT-009 · ORION-NODE-03 ➔ ORION-HUB-01 (32.4 GB)', 'alerts', true, NOW()),
      ('Target beaconing velocity increased +180%', 'ALERT-004 · Frankfurt ➔ Reykjavik C2 Sync', 'alerts', true, NOW() - INTERVAL '4 minutes'),
      ('Large-scale cryptocurrency laundering detected', 'ALERT-011 · 42.8 BTC split across Zurich & Dubai', 'alerts', true, NOW() - INTERVAL '18 minutes');
  `);
  console.log("Categories and notifications populated successfully.");
  process.exit(0);
}

seedCategoriesAndNotifications().catch((e) => {
  console.error(e);
  process.exit(1);
});
