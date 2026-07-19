import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { pool } from "../config/database.js";
import { env } from "../config/env.js";

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

  const [emailColumns] = await pool.query("SHOW COLUMNS FROM admin_users LIKE 'email'");

  if (!emailColumns.length) {
    await pool.query("ALTER TABLE admin_users ADD COLUMN email VARCHAR(150) NULL AFTER role");
  }

  const [rows] = await pool.query("SELECT id FROM admin_users WHERE username = ? LIMIT 1", ["admin"]);

  if (!rows.length) {
    await pool.query(
      "INSERT INTO admin_users (username, name, role, email, password_hash) VALUES (?, ?, ?, ?, ?)",
      ["admin", "Hospital Admin", "admin", env.adminEmail || null, await hashPassword(DEFAULT_ADMIN_PASSWORD)]
    );
  } else if (env.adminEmail) {
    await pool.query("UPDATE admin_users SET email = ? WHERE username = ? AND (email IS NULL OR email = '')", [
      env.adminEmail,
      "admin"
    ]);
  }

  await ensurePasswordResetOtpsTable();
}

export async function ensurePasswordResetOtpsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_user_id INT NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      reset_token_hash VARCHAR(255) NULL,
      verified_at DATETIME NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_password_reset_otps_admin
        FOREIGN KEY (admin_user_id) REFERENCES admin_users(id)
        ON DELETE CASCADE
    )
  `);

  const [tokenColumns] = await pool.query("SHOW COLUMNS FROM password_reset_otps LIKE 'reset_token_hash'");

  if (!tokenColumns.length) {
    await pool.query("ALTER TABLE password_reset_otps ADD COLUMN reset_token_hash VARCHAR(255) NULL AFTER otp_hash");
  }

  const [verifiedColumns] = await pool.query("SHOW COLUMNS FROM password_reset_otps LIKE 'verified_at'");

  if (!verifiedColumns.length) {
    await pool.query("ALTER TABLE password_reset_otps ADD COLUMN verified_at DATETIME NULL AFTER reset_token_hash");
  }
}

export async function getAdminByUsername(username) {
  const [rows] = await pool.query(
    `
      SELECT id, username, name, role, email, password_hash AS passwordHash
      FROM admin_users
      WHERE username = ?
      LIMIT 1
    `,
    [username]
  );

  return rows[0] || null;
}

export async function getAdminForPasswordReset(identifier) {
  const cleanIdentifier = String(identifier || "").trim();
  const [rows] = await pool.query(
    `
      SELECT id, username, name, role, email
      FROM admin_users
      WHERE username = ? OR email = ?
      LIMIT 1
    `,
    [cleanIdentifier, cleanIdentifier]
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

export async function createPasswordResetOtp(adminUserId, otp) {
  await pool.query(
    "UPDATE password_reset_otps SET used_at = NOW() WHERE admin_user_id = ? AND used_at IS NULL",
    [adminUserId]
  );

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await pool.query(
    "INSERT INTO password_reset_otps (admin_user_id, otp_hash, expires_at) VALUES (?, ?, ?)",
    [adminUserId, await hashPassword(otp), expiresAt]
  );
}

export async function verifyPasswordResetOtp(adminUserId, otp) {
  const [rows] = await pool.query(
    `
      SELECT id, otp_hash AS otpHash
      FROM password_reset_otps
      WHERE admin_user_id = ?
        AND used_at IS NULL
        AND verified_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [adminUserId]
  );

  const resetOtp = rows[0];

  if (!resetOtp || !(await verifyPassword(otp, resetOtp.otpHash))) {
    return "";
  }

  const resetToken = randomBytes(32).toString("hex");
  await pool.query(
    "UPDATE password_reset_otps SET reset_token_hash = ?, verified_at = NOW() WHERE id = ?",
    [await hashPassword(resetToken), resetOtp.id]
  );

  return resetToken;
}

export async function consumePasswordResetToken(adminUserId, resetToken, username, newPassword) {
  const [rows] = await pool.query(
    `
      SELECT id, reset_token_hash AS resetTokenHash
      FROM password_reset_otps
      WHERE admin_user_id = ?
        AND reset_token_hash IS NOT NULL
        AND verified_at IS NOT NULL
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY verified_at DESC
      LIMIT 1
    `,
    [adminUserId]
  );

  const resetOtp = rows[0];

  if (!resetOtp || !(await verifyPassword(resetToken, resetOtp.resetTokenHash))) {
    return false;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query("UPDATE admin_users SET password_hash = ? WHERE username = ?", [
      await hashPassword(newPassword),
      username
    ]);
    await connection.query("UPDATE password_reset_otps SET used_at = NOW() WHERE id = ?", [resetOtp.id]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
