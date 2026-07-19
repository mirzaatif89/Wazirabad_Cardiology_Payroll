import { pool } from "../config/database.js";

const toNull = (value) => (value === "" || value === undefined ? null : value);

const DEFAULT_DESIGNATIONS = [
  { code: "11", designation: "Naib Qasid" },
  { code: "12", designation: "Ward Attendent" },
  { code: "13", designation: "Mali" },
  { code: "14", designation: "Dhobi" },
  { code: "15", designation: "Aya" },
  { code: "16", designation: "Sewer Man" },
  { code: "17", designation: "Chowkidar" },
  { code: "18", designation: "Sanitary Worker" },
  { code: "21", designation: "Lab Attendent" },
  { code: "31", designation: "Plumber" },
  { code: "32", designation: "Tubewell Operator" },
  { code: "41", designation: "Driver" },
  { code: "51", designation: "Electric Mechanic" },
  { code: "52", designation: "Lab Assistant" },
  { code: "53", designation: "Receptionist" },
  { code: "54", designation: "Record Keeper" },
  { code: "61", designation: "Radiographer" },
  { code: "62", designation: "Store Keeper" },
  { code: "71", designation: "Telephone Operator" },
  { code: "91", designation: "ECG Technician" },
  { code: "92", designation: "Lab Technician" },
  { code: "93", designation: "Laundry Manager" },
  { code: "94", designation: "X Ray Technician" },
  { code: "95", designation: "Dispener / Junior Technic" },
  { code: "111", designation: "Junior Clerk" },
  { code: "121", designation: "Computer Operator" },
  { code: "161", designation: "Charge Nurse" },
  { code: "171", designation: "Account Officer" },
  { code: "172", designation: "Bio Chemist" },
  { code: "173", designation: "MO/WMO" },
  { code: "174", designation: "Pharmacist" },
  { code: "175", designation: "Office Suprintendent" },
  { code: "181", designation: "Deputy Medical Superitend" },
  { code: "182", designation: "Assistant Professor Of Ca" },
  { code: "183", designation: "Senior Registrar" },
  { code: "184", designation: "Pathologist" },
  { code: "185", designation: "Radiologist" },
  { code: "186", designation: "SENIOR MEDICAL OFFICER" },
  { code: "191", designation: "Additional Medical Suprin" },
  { code: "192", designation: "Associate Professor Of Ca" },
  { code: "201", designation: "Medical Suprintendent" },
  { code: "202", designation: "Professor of Cardiology" }
];

export async function ensureDesignationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS designation_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      designation VARCHAR(150) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  if (DEFAULT_DESIGNATIONS.length) {
    await pool.query(
      `
        INSERT INTO designation_codes (code, designation)
        VALUES ${DEFAULT_DESIGNATIONS.map(() => "(?, ?)").join(", ")}
        ON DUPLICATE KEY UPDATE designation = VALUES(designation)
      `,
      DEFAULT_DESIGNATIONS.flatMap((designation) => [designation.code, designation.designation])
    );
  }
}

export async function getDesignations() {
  const [rows] = await pool.query(`
    SELECT
      id,
      code,
      designation,
      created_at AS createdAt
    FROM designation_codes
    ORDER BY designation ASC, code ASC
  `);

  return rows;
}

export async function getDesignationByCode(code) {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        code,
        designation,
        created_at AS createdAt
      FROM designation_codes
      WHERE code = ?
      LIMIT 1
    `,
    [code]
  );

  return rows[0] || null;
}

export async function insertDesignation(designation) {
  const [result] = await pool.query(
    `
      INSERT INTO designation_codes (code, designation)
      VALUES (?, ?)
    `,
    [designation.code, designation.designation]
  );

  return result.insertId;
}

export async function updateDesignationById(id, designation) {
  const [result] = await pool.query(
    `
      UPDATE designation_codes
      SET code = ?, designation = ?
      WHERE id = ?
    `,
    [designation.code, designation.designation, id]
  );

  return result.affectedRows;
}

export async function deleteDesignationById(id) {
  const [result] = await pool.query("DELETE FROM designation_codes WHERE id = ?", [id]);
  return result.affectedRows;
}

export function normalizeDesignationPayload(payload) {
  return {
    code: String(toNull(payload.code) || "").trim(),
    designation: String(toNull(payload.designation) || "").trim()
  };
}
