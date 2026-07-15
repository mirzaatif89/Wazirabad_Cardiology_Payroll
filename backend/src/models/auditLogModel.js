import { pool } from "../config/database.js";

export async function ensureAuditLogTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(50),
      document_type VARCHAR(20),
      document_no INT,
      performed_by VARCHAR(100),
      performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    )
  `);
}

export async function logAuditAction({ action, documentType, documentNo, performedBy = "Hospital Admin", notes = "" }) {
  await pool.query(
    `
      INSERT INTO audit_log (action, document_type, document_no, performed_by, notes)
      VALUES (?, ?, ?, ?, ?)
    `,
    [action, documentType, documentNo, performedBy, notes]
  );
}
