import { pool } from "../config/database.js";

export async function ensureChartOfAccountsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chart_of_accounts (
      code VARCHAR(20) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

export async function getChartOfAccounts(search = "") {
  const query = `%${search.trim()}%`;
  const [rows] = await pool.query(
    `
      SELECT
        code,
        name
      FROM chart_of_accounts
      WHERE ? = '%%'
        OR code LIKE ?
        OR name LIKE ?
      ORDER BY code ASC
    `,
    [query, query, query]
  );

  return rows;
}
