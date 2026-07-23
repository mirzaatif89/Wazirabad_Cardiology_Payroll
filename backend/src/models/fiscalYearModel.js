import { pool } from "../config/database.js";

function toNull(value) {
  return value === "" || value === undefined ? null : value;
}

function formatFiscalYearName(startDate, endDate) {
  const startYear = new Date(startDate).getFullYear();
  const endYear = new Date(endDate).getFullYear();
  return `${startYear}-${endYear}`;
}

function deriveCurrentFiscalYearDates(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth() + 1;
  const startYear = month >= 7 ? year : year - 1;
  const endYear = startYear + 1;

  return {
    name: `${startYear}-${endYear}`,
    startDate: `${startYear}-07-01`,
    endDate: `${endYear}-06-30`,
    isActive: 1
  };
}

async function ensureOneActiveFiscalYear(connection = pool) {
  const [activeRows] = await connection.query(
    `
      SELECT id
      FROM fiscal_years
      WHERE is_active = 1
      ORDER BY start_date DESC, id DESC
    `
  );

  if (activeRows.length > 1) {
    const [keep] = activeRows;
    const idsToDisable = activeRows.slice(1).map((row) => row.id);
    await connection.query(
      `UPDATE fiscal_years SET is_active = 0 WHERE id IN (${idsToDisable.map(() => "?").join(",")})`,
      idsToDisable
    );
    return keep.id;
  }

  if (activeRows.length === 1) {
    return activeRows[0].id;
  }

  const [rows] = await connection.query(
    "SELECT id FROM fiscal_years ORDER BY start_date DESC, id DESC LIMIT 1"
  );

  if (!rows.length) {
    return null;
  }

  await connection.query("UPDATE fiscal_years SET is_active = 0");
  await connection.query("UPDATE fiscal_years SET is_active = 1 WHERE id = ?", [rows[0].id]);
  return rows[0].id;
}

export async function ensureFiscalYearsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fiscal_years (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(20) NOT NULL UNIQUE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CHECK (start_date <= end_date)
    )
  `);

  const [nameColumns] = await pool.query("SHOW COLUMNS FROM fiscal_years LIKE 'name'");
  if (!nameColumns.length) {
    await pool.query("ALTER TABLE fiscal_years ADD COLUMN name VARCHAR(20) NOT NULL AFTER id");
  }

  const [activeColumns] = await pool.query("SHOW COLUMNS FROM fiscal_years LIKE 'is_active'");
  if (!activeColumns.length) {
    await pool.query("ALTER TABLE fiscal_years ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 0 AFTER end_date");
  }

  const [rows] = await pool.query("SELECT id FROM fiscal_years LIMIT 1");
  if (!rows.length) {
    const defaults = deriveCurrentFiscalYearDates();
    await pool.query(
      "INSERT INTO fiscal_years (name, start_date, end_date, is_active) VALUES (?, ?, ?, ?)",
      [defaults.name, defaults.startDate, defaults.endDate, 1]
    );
    return;
  }

  await ensureOneActiveFiscalYear();
}

export function normalizeFiscalYearPayload(payload) {
  const startDate = String(toNull(payload.startDate ?? payload.start_date) || "").trim();
  const endDate = String(toNull(payload.endDate ?? payload.end_date) || "").trim();

  return {
    name: String(toNull(payload.name) || "").trim(),
    startDate,
    endDate,
    isActive: Boolean(payload.isActive ?? payload.is_active)
  };
}

export async function getFiscalYears() {
  const [rows] = await pool.query(`
    SELECT
      id,
      name,
      start_date AS startDate,
      end_date AS endDate,
      is_active AS isActive,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM fiscal_years
    ORDER BY is_active DESC, start_date DESC, id DESC
  `);

  return rows;
}

export async function getFiscalYearById(id) {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        name,
        start_date AS startDate,
        end_date AS endDate,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM fiscal_years
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
}

export async function getActiveFiscalYear(connection = pool) {
  const [rows] = await connection.query(
    `
      SELECT
        id,
        name,
        start_date AS startDate,
        end_date AS endDate,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM fiscal_years
      WHERE is_active = 1
      ORDER BY start_date DESC, id DESC
      LIMIT 1
    `
  );

  if (rows[0]) {
    return rows[0];
  }

  const [latestRows] = await connection.query(
    `
      SELECT
        id,
        name,
        start_date AS startDate,
        end_date AS endDate,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM fiscal_years
      ORDER BY start_date DESC, id DESC
      LIMIT 1
    `
  );

  return latestRows[0] || null;
}

export async function getFiscalYearForDate(targetDate, connection = pool) {
  const [rows] = await connection.query(
    `
      SELECT
        id,
        name,
        start_date AS startDate,
        end_date AS endDate,
        is_active AS isActive,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM fiscal_years
      WHERE start_date <= ?
        AND end_date >= ?
      ORDER BY start_date DESC, id DESC
      LIMIT 1
    `,
    [targetDate, targetDate]
  );

  return rows[0] || null;
}

export async function insertFiscalYear(payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
        INSERT INTO fiscal_years (name, start_date, end_date, is_active)
        VALUES (?, ?, ?, ?)
      `,
      [payload.name, payload.startDate, payload.endDate, 0]
    );

    if (payload.isActive) {
      await connection.query("UPDATE fiscal_years SET is_active = 0");
      await connection.query("UPDATE fiscal_years SET is_active = 1 WHERE id = ?", [result.insertId]);
    } else {
      await ensureOneActiveFiscalYear(connection);
    }

    await connection.commit();
    return getFiscalYearById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateFiscalYearById(id, payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
        UPDATE fiscal_years
        SET name = ?, start_date = ?, end_date = ?
        WHERE id = ?
      `,
      [payload.name, payload.startDate, payload.endDate, id]
    );

    if (!result.affectedRows) {
      await connection.rollback();
      return 0;
    }

    if (payload.isActive) {
      await connection.query("UPDATE fiscal_years SET is_active = 0");
      await connection.query("UPDATE fiscal_years SET is_active = 1 WHERE id = ?", [id]);
    } else {
      await ensureOneActiveFiscalYear(connection);
    }

    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteFiscalYearById(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[existing]] = await connection.query(
      "SELECT id, is_active AS isActive FROM fiscal_years WHERE id = ? LIMIT 1",
      [id]
    );

    if (!existing) {
      await connection.rollback();
      return 0;
    }

    const [result] = await connection.query("DELETE FROM fiscal_years WHERE id = ?", [id]);

    if (existing.isActive) {
      await ensureOneActiveFiscalYear(connection);
    }

    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function setActiveFiscalYearById(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[existing]] = await connection.query(
      "SELECT id FROM fiscal_years WHERE id = ? LIMIT 1",
      [id]
    );

    if (!existing) {
      await connection.rollback();
      return null;
    }

    await connection.query("UPDATE fiscal_years SET is_active = 0");
    await connection.query("UPDATE fiscal_years SET is_active = 1 WHERE id = ?", [id]);
    await connection.commit();
    return getFiscalYearById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function deriveFiscalYearFromDates(startDate, endDate) {
  return formatFiscalYearName(startDate, endDate);
}
