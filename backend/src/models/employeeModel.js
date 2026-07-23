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
      prior_employer_tax_credit DECIMAL(12, 2) NOT NULL DEFAULT 0,
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
      status ENUM('active','inactive') DEFAULT 'active',
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

  const [priorEmployerTaxCreditColumns] = await pool.query("SHOW COLUMNS FROM employees LIKE 'prior_employer_tax_credit'");

  if (!priorEmployerTaxCreditColumns.length) {
    await pool.query("ALTER TABLE employees ADD COLUMN prior_employer_tax_credit DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER date_of_joining");
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

  const [statusColumns] = await pool.query("SHOW COLUMNS FROM employees LIKE 'status'");

  if (!statusColumns.length) {
    await pool.query("ALTER TABLE employees ADD COLUMN status ENUM('active','inactive') DEFAULT 'active' AFTER sap_no");
  }
}

export async function ensureEmployeeScaleHistoryTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_scale_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_code VARCHAR(50) NOT NULL,
      old_bps INT,
      new_bps INT NOT NULL,
      effective_date DATE NOT NULL,
      changed_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_scale_history_employee
        FOREIGN KEY (employee_code) REFERENCES employees(employee_no)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    )
  `);
}

export async function ensureEmployeeStatusHistoryTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employee_status_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_code VARCHAR(50) NOT NULL,
      status ENUM('active','inactive') NOT NULL,
      effective_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_status_history_employee
        FOREIGN KEY (employee_code) REFERENCES employees(employee_no)
        ON UPDATE CASCADE
        ON DELETE CASCADE
    )
  `);
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
        prior_employer_tax_credit,
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
        status,
        stop_date,
        special_designation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      Number(employee.priorEmployerTaxCredit || 0),
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
      employee.status || "active",
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
      prior_employer_tax_credit AS priorEmployerTaxCredit,
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
      status,
      DATE_FORMAT(stop_date, '%Y-%m-%d') AS stopDate,
      special_designation AS specialDesignation,
      created_at AS createdAt
    FROM employees
    ORDER BY id DESC
  `);

  return rows;
}

export async function getNextEmployeeNo() {
  const [[row]] = await pool.query(`
    SELECT
      COALESCE(MAX(CAST(employee_no AS UNSIGNED)), 0) AS maxEmployeeNo,
      COALESCE(MAX(CHAR_LENGTH(employee_no)), 2) AS maxEmployeeNoLength
    FROM employees
    WHERE employee_no REGEXP '^[0-9]+$'
  `);

  const nextNumber = Number(row.maxEmployeeNo || 0) + 1;
  const width = Math.max(2, Number(row.maxEmployeeNoLength || 2));

  return String(nextNumber).padStart(width, "0");
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
        prior_employer_tax_credit AS priorEmployerTaxCredit,
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
        status,
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
  const [[existingEmployee]] = await pool.query(
    "SELECT employee_no AS employeeNo, bps, status FROM employees WHERE id = ? LIMIT 1",
    [id]
  );

  if (!existingEmployee) {
    return 0;
  }

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
        prior_employer_tax_credit = ?,
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
        status = ?,
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
      Number(employee.priorEmployerTaxCredit || 0),
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
      employee.status || "active",
      toNull(employee.stopDate),
      toNull(employee.specialDesignation),
      id
    ]
  );

  if (result.affectedRows && String(existingEmployee.bps || "") !== String(employee.bps || "")) {
    const newBps = Number(employee.bps || 0);

    if (newBps > 0) {
      await pool.query(
        `
          INSERT INTO employee_scale_history (
            employee_code,
            old_bps,
            new_bps,
            effective_date,
            changed_by
          ) VALUES (?, ?, ?, CURDATE(), ?)
        `,
        [existingEmployee.employeeNo, Number(existingEmployee.bps || 0) || null, newBps, employee.changedBy || "Hospital Admin"]
      );
    }
  }

  if (result.affectedRows && String(existingEmployee.status || "active") !== String(employee.status || "active")) {
    await pool.query(
      `
        INSERT INTO employee_status_history (
          employee_code,
          status,
          effective_date
        ) VALUES (?, ?, CURDATE())
      `,
      [existingEmployee.employeeNo, employee.status || "active"]
    );
  }

  return result.affectedRows || 1;
}

export async function deleteEmployeeById(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[employee]] = await connection.query(
      "SELECT id, employee_no AS employeeNo FROM employees WHERE id = ? LIMIT 1",
      [id]
    );

    if (!employee) {
      await connection.rollback();
      return 0;
    }

    await connection.query(
      `
        DELETE prid FROM payroll_run_item_details prid
        INNER JOIN payroll_run_items pri ON pri.id = prid.payroll_run_item_id
        WHERE pri.employee_code = ?
      `,
      [employee.employeeNo]
    );
    await connection.query("DELETE FROM payroll_run_items WHERE employee_code = ?", [employee.employeeNo]);

    await connection.query(
      `
        DELETE abi FROM arrear_bill_items abi
        INNER JOIN arrear_bills ab ON ab.id = abi.arrear_bill_id
        WHERE ab.employee_code = ?
      `,
      [employee.employeeNo]
    );
    await connection.query("DELETE FROM arrear_bills WHERE employee_code = ?", [employee.employeeNo]);

    await connection.query("DELETE FROM employee_allowances WHERE employee_id = ?", [employee.id]);
    await connection.query("DELETE FROM special_pay_entries WHERE employee_code = ?", [employee.employeeNo]);
    await connection.query("DELETE FROM employee_scale_history WHERE employee_code = ?", [employee.employeeNo]);
    await connection.query("DELETE FROM employee_status_history WHERE employee_code = ?", [employee.employeeNo]);

    const [result] = await connection.query("DELETE FROM employees WHERE id = ?", [id]);

    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
