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
      designation VARCHAR(150),
      bps VARCHAR(30),
      gaz_ng VARCHAR(30),
      date_of_birth DATE NULL,
      date_of_joining DATE NULL,
      department VARCHAR(150),
      service_type VARCHAR(100),
      bank VARCHAR(150),
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
        designation,
        bps,
        gaz_ng,
        date_of_birth,
        date_of_joining,
        department,
        service_type,
        bank,
        account_no,
        gpf_account_no,
        ntn_no,
        pghsf_no,
        religion,
        sap_no,
        stop_date,
        special_designation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      toNull(employee.designation),
      toNull(employee.bps),
      toNull(employee.gazNg),
      toNull(employee.dateOfBirth),
      toNull(employee.dateOfJoining),
      toNull(employee.department),
      toNull(employee.serviceType),
      toNull(employee.bank),
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
      designation,
      bps,
      gaz_ng AS gazNg,
      DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS dateOfBirth,
      DATE_FORMAT(date_of_joining, '%Y-%m-%d') AS dateOfJoining,
      department,
      service_type AS serviceType,
      bank,
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
        designation,
        bps,
        gaz_ng AS gazNg,
        DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS dateOfBirth,
        DATE_FORMAT(date_of_joining, '%Y-%m-%d') AS dateOfJoining,
        department,
        service_type AS serviceType,
        bank,
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
        designation = ?,
        bps = ?,
        gaz_ng = ?,
        date_of_birth = ?,
        date_of_joining = ?,
        department = ?,
        service_type = ?,
        bank = ?,
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
      toNull(employee.designation),
      toNull(employee.bps),
      toNull(employee.gazNg),
      toNull(employee.dateOfBirth),
      toNull(employee.dateOfJoining),
      toNull(employee.department),
      toNull(employee.serviceType),
      toNull(employee.bank),
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
