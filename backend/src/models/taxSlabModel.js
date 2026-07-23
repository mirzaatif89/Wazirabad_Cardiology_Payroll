import { pool } from "../config/database.js";

function toNull(value) {
  return value === "" || value === undefined ? null : value;
}

function normalizeDecimal(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function roundCurrency(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function pickTaxSlab(slabs, taxableIncome) {
  const sortedSlabs = [...slabs].sort(
    (first, second) => Number(first.srNo || 0) - Number(second.srNo || 0) ||
      Number(first.fromIncome || 0) - Number(second.fromIncome || 0)
  );
  const matchedSlab = sortedSlabs.find((slab) => {
    const fromIncome = Number(slab.fromIncome || 0);
    const toIncome = slab.toIncome === null || slab.toIncome === undefined ? null : Number(slab.toIncome);
    return taxableIncome >= fromIncome && (toIncome === null || taxableIncome <= toIncome);
  });

  if (matchedSlab) {
    return matchedSlab;
  }

  const fallbackSlab = [...sortedSlabs]
    .reverse()
    .find((slab) => taxableIncome >= Number(slab.fromIncome || 0));

  return fallbackSlab || sortedSlabs[0] || null;
}

function calculateProgressiveTax(taxableIncome, slabs) {
  if (!slabs.length || !Number.isFinite(taxableIncome) || taxableIncome <= 0) {
    return { amount: 0, slab: null };
  }

  const slab = pickTaxSlab(slabs, taxableIncome);
  if (!slab) {
    return { amount: 0, slab: null };
  }

  const fromIncome = Number(slab.fromIncome || 0);
  const fixedTax = Number(slab.fixedTax || 0);
  const rate = Number(slab.rate || 0);
  const incrementalIncome = Math.max(0, taxableIncome - fromIncome);
  const amount = fixedTax + (incrementalIncome * rate) / 100;

  return { amount: roundCurrency(amount), slab };
}

async function ensureActivePolicyForFiscalYear(connection, fiscalYearId) {
  const [activeRows] = await connection.query(
    "SELECT id FROM tax_policies WHERE fiscal_year_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1",
    [fiscalYearId]
  );

  if (activeRows.length) {
    return activeRows[0].id;
  }

  const [latestRows] = await connection.query(
    "SELECT id FROM tax_policies WHERE fiscal_year_id = ? ORDER BY id DESC LIMIT 1",
    [fiscalYearId]
  );

  if (!latestRows.length) {
    return null;
  }

  await connection.query("UPDATE tax_policies SET is_active = 0 WHERE fiscal_year_id = ?", [fiscalYearId]);
  await connection.query("UPDATE tax_policies SET is_active = 1 WHERE id = ?", [latestRows[0].id]);
  return latestRows[0].id;
}

export async function ensureTaxSlabTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tax_policies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fiscal_year_id INT NOT NULL,
      name VARCHAR(120) NOT NULL,
      basis ENUM('annual','monthly') NOT NULL DEFAULT 'annual',
      is_active TINYINT(1) NOT NULL DEFAULT 0,
      notes VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_tax_policies_fiscal_year
        FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id)
        ON DELETE CASCADE,
      UNIQUE KEY uniq_tax_policy (fiscal_year_id, name)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tax_slab_brackets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tax_policy_id INT NOT NULL,
      sr_no INT NOT NULL,
      from_income DECIMAL(14, 2) NOT NULL DEFAULT 0,
      to_income DECIMAL(14, 2) NULL,
      rate DECIMAL(6, 2) NOT NULL DEFAULT 0,
      fixed_tax DECIMAL(14, 2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_tax_slabs_policy
        FOREIGN KEY (tax_policy_id) REFERENCES tax_policies(id)
        ON DELETE CASCADE,
      UNIQUE KEY uniq_tax_slab (tax_policy_id, sr_no)
    )
  `);

  const [policyColumns] = await pool.query("SHOW COLUMNS FROM tax_policies LIKE 'notes'");
  if (!policyColumns.length) {
    await pool.query("ALTER TABLE tax_policies ADD COLUMN notes VARCHAR(255) NULL AFTER is_active");
  }
}

export function normalizeTaxPolicyPayload(payload) {
  return {
    fiscalYearId: Number((payload.fiscalYearId ?? payload.fiscal_year_id) || 0),
    name: String(toNull(payload.name) || "").trim(),
    basis: payload.basis === "monthly" ? "monthly" : "annual",
    notes: String(toNull(payload.notes) || "").trim(),
    isActive: Boolean(payload.isActive ?? payload.is_active)
  };
}

export function normalizeTaxSlabPayload(payload, fallbackSrNo = 1) {
  return {
    srNo: Number(payload.srNo ?? payload.sr_no ?? fallbackSrNo),
    fromIncome: normalizeDecimal(payload.fromIncome ?? payload.from_income) ?? 0,
    toIncome: normalizeDecimal(payload.toIncome ?? payload.to_income),
    rate: normalizeDecimal(payload.rate) ?? 0,
    fixedTax: normalizeDecimal(payload.fixedTax ?? payload.fixed_tax) ?? 0
  };
}

export async function getTaxPolicies({ fiscalYearId = "" } = {}, connection = pool) {
  const params = [];
  const where = [];

  if (fiscalYearId) {
    where.push("tp.fiscal_year_id = ?");
    params.push(fiscalYearId);
  }

  const [rows] = await connection.query(
    `
      SELECT
        tp.id,
        tp.fiscal_year_id AS fiscalYearId,
        fy.name AS fiscalYearName,
        tp.name,
        tp.basis,
        tp.is_active AS isActive,
        tp.notes,
        tp.created_at AS createdAt,
        tp.updated_at AS updatedAt,
        COUNT(tsb.id) AS slabCount
      FROM tax_policies tp
      INNER JOIN fiscal_years fy ON fy.id = tp.fiscal_year_id
      LEFT JOIN tax_slab_brackets tsb ON tsb.tax_policy_id = tp.id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      GROUP BY tp.id, tp.fiscal_year_id, fy.name, tp.name, tp.basis, tp.is_active, tp.notes, tp.created_at, tp.updated_at
      ORDER BY tp.is_active DESC, fy.start_date DESC, tp.id DESC
    `,
    params
  );

  return rows;
}

export async function getTaxPolicyById(id, connection = pool) {
  const [rows] = await connection.query(
    `
      SELECT
        tp.id,
        tp.fiscal_year_id AS fiscalYearId,
        fy.name AS fiscalYearName,
        tp.name,
        tp.basis,
        tp.is_active AS isActive,
        tp.notes,
        tp.created_at AS createdAt,
        tp.updated_at AS updatedAt
      FROM tax_policies tp
      INNER JOIN fiscal_years fy ON fy.id = tp.fiscal_year_id
      WHERE tp.id = ?
      LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
}

export async function getActiveTaxPolicy(fiscalYearId, connection = pool) {
  const [[row]] = await connection.query(
    `
      SELECT
        tp.id,
        tp.fiscal_year_id AS fiscalYearId,
        fy.name AS fiscalYearName,
        tp.name,
        tp.basis,
        tp.is_active AS isActive,
        tp.notes,
        tp.created_at AS createdAt,
        tp.updated_at AS updatedAt
      FROM tax_policies tp
      INNER JOIN fiscal_years fy ON fy.id = tp.fiscal_year_id
      WHERE tp.fiscal_year_id = ?
        AND tp.is_active = 1
      ORDER BY tp.id DESC
      LIMIT 1
    `,
    [fiscalYearId]
  );

  return row || null;
}

export async function getTaxSlabs(policyId, connection = pool) {
  const [rows] = await connection.query(
    `
      SELECT
        id,
        tax_policy_id AS taxPolicyId,
        sr_no AS srNo,
        from_income AS fromIncome,
        to_income AS toIncome,
        rate,
        fixed_tax AS fixedTax,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM tax_slab_brackets
      WHERE tax_policy_id = ?
      ORDER BY sr_no ASC
    `,
    [policyId]
  );

  return rows;
}

export async function calculatePayrollTaxDeduction({ fiscalYearId, taxableIncome, connection = pool }) {
  const income = Number(taxableIncome || 0);

  if (!fiscalYearId || !Number.isFinite(income) || income <= 0) {
    return {
      amount: 0,
      annualAmount: 0,
      annualizedIncome: 0,
      effectiveTaxableIncome: 0,
      basis: null,
      taxableIncome: income,
      policy: null,
      slab: null
    };
  }

  const policy = await getActiveTaxPolicy(fiscalYearId, connection);

  if (!policy) {
    return {
      amount: 0,
      annualAmount: 0,
      annualizedIncome: 0,
      effectiveTaxableIncome: 0,
      basis: null,
      taxableIncome: income,
      policy: null,
      slab: null
    };
  }

  const slabs = await getTaxSlabs(policy.id, connection);

  if (!slabs.length) {
    return {
      amount: 0,
      annualAmount: 0,
      annualizedIncome: 0,
      effectiveTaxableIncome: 0,
      basis: policy.basis,
      taxableIncome: income,
      policy,
      slab: null
    };
  }

  const effectiveIncome = policy.basis === "annual" ? income * 12 : income;
  const { amount: annualAmount, slab } = calculateProgressiveTax(effectiveIncome, slabs);
  const amount = policy.basis === "annual" ? roundCurrency(annualAmount / 12) : annualAmount;
  const annualizedIncome = roundCurrency(income * 12);

  return {
    amount,
    annualAmount,
    annualizedIncome,
    effectiveTaxableIncome: effectiveIncome,
    basis: policy.basis,
    taxableIncome: income,
    policy,
    slab
  };
}

export async function getTaxPolicyDetails(policyId, connection = pool) {
  const policy = await getTaxPolicyById(policyId, connection);
  if (!policy) {
    return null;
  }

  const slabs = await getTaxSlabs(policyId, connection);
  return { ...policy, slabs };
}

export async function insertTaxPolicy(payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
        INSERT INTO tax_policies (fiscal_year_id, name, basis, is_active, notes)
        VALUES (?, ?, ?, 0, ?)
      `,
      [payload.fiscalYearId, payload.name, payload.basis, payload.notes || null]
    );

    if (payload.isActive) {
      await connection.query("UPDATE tax_policies SET is_active = 0 WHERE fiscal_year_id = ?", [payload.fiscalYearId]);
      await connection.query("UPDATE tax_policies SET is_active = 1 WHERE id = ?", [result.insertId]);
    } else {
      await ensureActivePolicyForFiscalYear(connection, payload.fiscalYearId);
    }

    await connection.commit();
    return getTaxPolicyDetails(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateTaxPolicyById(id, payload) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `
        UPDATE tax_policies
        SET fiscal_year_id = ?, name = ?, basis = ?, notes = ?
        WHERE id = ?
      `,
      [payload.fiscalYearId, payload.name, payload.basis, payload.notes || null, id]
    );

    if (!result.affectedRows) {
      await connection.rollback();
      return 0;
    }

    if (payload.isActive) {
      await connection.query("UPDATE tax_policies SET is_active = 0 WHERE fiscal_year_id = ?", [payload.fiscalYearId]);
      await connection.query("UPDATE tax_policies SET is_active = 1 WHERE id = ?", [id]);
    } else {
      await ensureActivePolicyForFiscalYear(connection, payload.fiscalYearId);
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

export async function deleteTaxPolicyById(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[policy]] = await connection.query(
      "SELECT id, fiscal_year_id AS fiscalYearId, is_active AS isActive FROM tax_policies WHERE id = ? LIMIT 1",
      [id]
    );

    if (!policy) {
      await connection.rollback();
      return 0;
    }

    await connection.query("DELETE FROM tax_policies WHERE id = ?", [id]);

    if (policy.isActive) {
      await ensureActivePolicyForFiscalYear(connection, policy.fiscalYearId);
    }

    await connection.commit();
    return 1;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function setActiveTaxPolicyById(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[policy]] = await connection.query(
      "SELECT id, fiscal_year_id AS fiscalYearId FROM tax_policies WHERE id = ? LIMIT 1",
      [id]
    );

    if (!policy) {
      await connection.rollback();
      return null;
    }

    await connection.query("UPDATE tax_policies SET is_active = 0 WHERE fiscal_year_id = ?", [policy.fiscalYearId]);
    await connection.query("UPDATE tax_policies SET is_active = 1 WHERE id = ?", [id]);
    await connection.commit();
    return getTaxPolicyDetails(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function insertTaxSlab(policyId, payload) {
  const [result] = await pool.query(
    `
      INSERT INTO tax_slab_brackets (tax_policy_id, sr_no, from_income, to_income, rate, fixed_tax)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [policyId, payload.srNo, payload.fromIncome, payload.toIncome, payload.rate, payload.fixedTax]
  );

  return result.insertId;
}

export async function updateTaxSlabById(policyId, slabId, payload) {
  const [result] = await pool.query(
    `
      UPDATE tax_slab_brackets
      SET sr_no = ?, from_income = ?, to_income = ?, rate = ?, fixed_tax = ?
      WHERE id = ? AND tax_policy_id = ?
    `,
    [payload.srNo, payload.fromIncome, payload.toIncome, payload.rate, payload.fixedTax, slabId, policyId]
  );

  return result.affectedRows;
}

export async function deleteTaxSlabById(policyId, slabId) {
  const [result] = await pool.query(
    "DELETE FROM tax_slab_brackets WHERE id = ? AND tax_policy_id = ?",
    [slabId, policyId]
  );

  return result.affectedRows;
}
