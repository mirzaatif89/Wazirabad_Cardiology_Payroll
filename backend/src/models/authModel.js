import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { pool } from "../config/database.js";

const scrypt = promisify(scryptCallback);
const DEFAULT_ADMIN_PASSWORD = "admin123";

async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [salt, key] = String(storedHash || "").split(":");

  if (!salt || !key) {
    return false;
  }

  const derivedKey = await scrypt(password, salt, 64);
  const storedKey = Buffer.from(key, "hex");

  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}

export async function ensureAdminUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'admin',
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await pool.query("SELECT id FROM admin_users WHERE username = ? LIMIT 1", ["admin"]);

  if (!rows.length) {
    await pool.query(
      "INSERT INTO admin_users (username, name, role, password_hash) VALUES (?, ?, ?, ?)",
      ["admin", "Hospital Admin", "admin", await hashPassword(DEFAULT_ADMIN_PASSWORD)]
    );
  }
}

export async function getAdminByUsername(username) {
  const [rows] = await pool.query(
    `
      SELECT id, username, name, role, password_hash AS passwordHash
      FROM admin_users
      WHERE username = ?
      LIMIT 1
    `,
    [username]
  );

  return rows[0] || null;
}

export async function verifyAdminPassword(username, password) {
  const admin = await getAdminByUsername(username);

  if (!admin) {
    return null;
  }

  const isValid = await verifyPassword(password, admin.passwordHash);
  return isValid ? admin : null;
}

export async function updateAdminPassword(username, newPassword) {
  const [result] = await pool.query(
    "UPDATE admin_users SET password_hash = ? WHERE username = ?",
    [await hashPassword(newPassword), username]
  );

  return result.affectedRows;
}
