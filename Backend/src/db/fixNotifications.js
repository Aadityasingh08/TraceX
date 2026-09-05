import pool from "../config/db.js";

const sql = `
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  detail TEXT,
  route VARCHAR(50),
  alert_id INTEGER REFERENCES alerts(id),
  entity_id INTEGER REFERENCES entities(id),
  trend_id VARCHAR(100) REFERENCES trends(id),
  unread BOOLEAN DEFAULT TRUE,
  time TIMESTAMP DEFAULT NOW()
);
`;

async function run() {
  await pool.query(sql);
  console.log("✅ notifications table rebuilt");
  process.exit();
}
run();