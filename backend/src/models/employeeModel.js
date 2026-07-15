import { pool } from "../config/database.js";

export async function ensureEmployeesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_no VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(150) NOT NULL,
      father_name VARCHAR(150),
      email VARCHAR(150),
      address TEXT,
      contact_no VARCHAR(50),
      cnic_no VARCHAR(50),
      old_personnel_no VARCHAR(50),
      place_of_posting VARCHAR(150),
      designation_code VARCHAR(50),
      designation VARCHAR(150),
      bps VARCHAR(30),
      gaz_ng VARCHAR(30),
      date_of_birth DATE NULL,
      date_of_joining DATE NULL,
      department_code VARCHAR(50),
      department VARCHAR(150),
      service_type VARCHAR(100),
      bank_code VARCHAR(50),
      bank VARCHAR(150),
      bank_branch_code VARCHAR(50),
      bank_branch VARCHAR(150),
      account_no VARCHAR(100),
      gpf_account_no VARCHAR(100),
      ntn_no VARCHAR(100),
      pghsf_no VARCHAR(100),
      religion VARCHAR(80),
      sap_no VARCHAR(100),
      stop_date DATE NULL,
      special_designation VARCHAR(150),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [departmentCodeColumns] = await pool.query("SHOW COLUMNS FROM employees LIKE 'department_code'");

  if (!departmentCodeColumns.length) {
    await pool.query("ALTER TABLE employees ADD COLUMN department_code VARCHAR(50) NULL AFTER date_of_joining");
  }

  const [designationCodeColumns] = await pool.query("SHOW COLUMNS FROM employees LIKE 'designation_code'");

  if (!designationCodeColumns.length) {
    await pool.query("ALTER TABLE employees ADD COLUMN designation_code VARCHAR(50) NULL AFTER place_of_posting");
  }

  const [bankCodeColumns] = await pool.query("SHOW COLUMNS FROM employees LIKE 'bank_code'");

  if (!bankCodeColumns.length) {
    await pool.query("ALTER TABLE employees ADD COLUMN bank_code VARCHAR(50) NULL AFTER service_type");
  }

  const [bankBranchCodeColumns] = await pool.query("SHOW COLUMNS FROM employees LIKE 'bank_branch_code'");

  if (!bankBranchCodeColumns.length) {
    await pool.query("ALTER TABLE employees ADD COLUMN bank_branch_code VARCHAR(50) NULL AFTER bank");
  }

  const [bankBranchColumns] = await pool.query("SHOW COLUMNS FROM employees LIKE 'bank_branch'");

  if (!bankBranchColumns.length) {
    await pool.query("ALTER TABLE employees ADD COLUMN bank_branch VARCHAR(150) NULL AFTER bank_branch_code");
  }
}

export async function insertEmployee(employee) {
  const toNull = (value) => (value === "" || value === undefined ? null : value);

  const [result] = await pool.query(
    `
      INSERT INTO employees (
        employee_no,
        name,
        father_name,
        email,
        address,
        contact_no,
        cnic_no,
        old_personnel_no,
        place_of_posting,
        designation_code,
        designation,
        bps,
        gaz_ng,
        date_of_birth,
        date_of_joining,
        department_code,
        department,
        service_type,
        bank_code,
        bank,
        bank_branch_code,
        bank_branch,
        account_no,
        gpf_account_no,
        ntn_no,
        pghsf_no,
        religion,
        sap_no,
        stop_date,
        special_designation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      employee.employeeNo,
      employee.name,
      toNull(employee.fatherName),
      toNull(employee.email),
      toNull(employee.address),
      toNull(employee.contactNo),
      toNull(employee.cnicNo),
      toNull(employee.oldPersonnelNo),
      toNull(employee.placeOfPosting),
      toNull(employee.designationCode),
      toNull(employee.designation),
      toNull(employee.bps),
      toNull(employee.gazNg),
      toNull(employee.dateOfBirth),
      toNull(employee.dateOfJoining),
      toNull(employee.departmentCode),
      toNull(employee.department),
      toNull(employee.serviceType),
      toNull(employee.bankCode),
      toNull(employee.bank),
      toNull(employee.bankBranchCode),
      toNull(employee.bankBranch),
      toNull(employee.accountNo),
      toNull(employee.gpfAccountNo),
      toNull(employee.ntnNo),
      toNull(employee.pghsfNo),
      toNull(employee.religion),
      toNull(employee.sapNo),
      toNull(employee.stopDate),
      toNull(employee.specialDesignation)
    ]
  );

  return result.insertId;
}

export async function getEmployees() {
  const [rows] = await pool.query(`
    SELECT
      id,
      employee_no AS employeeNo,
      name,
      father_name AS fatherName,
      email,
      address,
      contact_no AS contactNo,
      cnic_no AS cnicNo,
      old_personnel_no AS oldPersonnelNo,
      place_of_posting AS placeOfPosting,
      designation_code AS designationCode,
      designation,
      bps,
      gaz_ng AS gazNg,
      DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS dateOfBirth,
      DATE_FORMAT(date_of_joining, '%Y-%m-%d') AS dateOfJoining,
      department_code AS departmentCode,
      department,
      service_type AS serviceType,
      bank_code AS bankCode,
      bank,
      bank_branch_code AS bankBranchCode,
      bank_branch AS bankBranch,
      account_no AS accountNo,
      gpf_account_no AS gpfAccountNo,
      ntn_no AS ntnNo,
      pghsf_no AS pghsfNo,
      religion,
      sap_no AS sapNo,
      DATE_FORMAT(stop_date, '%Y-%m-%d') AS stopDate,
      special_designation AS specialDesignation,
      created_at AS createdAt
    FROM employees
    ORDER BY id DESC
  `);

  return rows;
}

export async function getEmployeeByCode(employeeNo) {
  const [rows] = await pool.query(
    `
      SELECT
        id,
        employee_no AS employeeNo,
        name,
        father_name AS fatherName,
        email,
        address,
        contact_no AS contactNo,
        cnic_no AS cnicNo,
        old_personnel_no AS oldPersonnelNo,
        place_of_posting AS placeOfPosting,
        designation_code AS designationCode,
        designation,
        bps,
        gaz_ng AS gazNg,
        DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS dateOfBirth,
        DATE_FORMAT(date_of_joining, '%Y-%m-%d') AS dateOfJoining,
        department_code AS departmentCode,
        department,
        service_type AS serviceType,
        bank_code AS bankCode,
        bank,
        bank_branch_code AS bankBranchCode,
        bank_branch AS bankBranch,
        account_no AS accountNo,
        gpf_account_no AS gpfAccountNo,
        ntn_no AS ntnNo,
        pghsf_no AS pghsfNo,
        religion,
        sap_no AS sapNo,
        DATE_FORMAT(stop_date, '%Y-%m-%d') AS stopDate,
        special_designation AS specialDesignation
      FROM employees
      WHERE employee_no = ?
      LIMIT 1
    `,
    [employeeNo]
  );

  return rows[0] || null;
}

export async function updateEmployeeById(id, employee) {
  const toNull = (value) => (value === "" || value === undefined ? null : value);

  const [result] = await pool.query(
    `
      UPDATE employees SET
        employee_no = ?,
        name = ?,
        father_name = ?,
        email = ?,
        address = ?,
        contact_no = ?,
        cnic_no = ?,
        old_personnel_no = ?,
        place_of_posting = ?,
        designation_code = ?,
        designation = ?,
        bps = ?,
        gaz_ng = ?,
        date_of_birth = ?,
        date_of_joining = ?,
        department_code = ?,
        department = ?,
        service_type = ?,
        bank_code = ?,
        bank = ?,
        bank_branch_code = ?,
        bank_branch = ?,
        account_no = ?,
        gpf_account_no = ?,
        ntn_no = ?,
        pghsf_no = ?,
        religion = ?,
        sap_no = ?,
        stop_date = ?,
        special_designation = ?
      WHERE id = ?
    `,
    [
      employee.employeeNo,
      employee.name,
      toNull(employee.fatherName),
      toNull(employee.email),
      toNull(employee.address),
      toNull(employee.contactNo),
      toNull(employee.cnicNo),
      toNull(employee.oldPersonnelNo),
      toNull(employee.placeOfPosting),
      toNull(employee.designationCode),
      toNull(employee.designation),
      toNull(employee.bps),
      toNull(employee.gazNg),
      toNull(employee.dateOfBirth),
      toNull(employee.dateOfJoining),
      toNull(employee.departmentCode),
      toNull(employee.department),
      toNull(employee.serviceType),
      toNull(employee.bankCode),
      toNull(employee.bank),
      toNull(employee.bankBranchCode),
      toNull(employee.bankBranch),
      toNull(employee.accountNo),
      toNull(employee.gpfAccountNo),
      toNull(employee.ntnNo),
      toNull(employee.pghsfNo),
      toNull(employee.religion),
      toNull(employee.sapNo),
      toNull(employee.stopDate),
      toNull(employee.specialDesignation),
      id
    ]
  );

  return result.affectedRows;
}

export async function deleteEmployeeById(id) {
  const [result] = await pool.query("DELETE FROM employees WHERE id = ?", [id]);
  return result.affectedRows;
}
