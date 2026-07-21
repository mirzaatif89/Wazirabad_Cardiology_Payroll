import { pool } from "../config/database.js";

function buildEmployeeFilters({ deptCode = "999", gazNg = "A", reportFor = "All", bps = "" } = {}) {
  const clauses = ["1 = 1"];
  const params = [];

  if (deptCode && deptCode !== "999") {
    clauses.push("e.department_code = ?");
    params.push(deptCode);
  }

  if (gazNg === "G") {
    clauses.push("(e.gaz_ng LIKE 'Gaz%' OR e.gaz_ng = 'G')");
  }

  if (gazNg === "N") {
    clauses.push("(e.gaz_ng LIKE 'Non%' OR e.gaz_ng = 'N')");
  }

  if (reportFor && reportFor !== "All") {
    clauses.push("e.service_type = ?");
    params.push(reportFor);
  }

  if (bps && bps !== "99") {
    clauses.push("e.bps = ?");
    params.push(String(bps));
  }

  return { where: clauses.join(" AND "), params };
}

async function getFilteredEmployees(filters = {}) {
  const { where, params } = buildEmployeeFilters(filters);
  const [rows] = await pool.query(
    `
      SELECT
        e.id,
        e.employee_no AS employeeCode,
        e.name,
        e.department_code AS departmentCode,
        e.department,
        e.designation,
        e.bps,
        e.gaz_ng AS gazNg,
        e.service_type AS serviceType,
        e.status,
        DATE_FORMAT(e.stop_date, '%Y-%m-%d') AS stopDate
      FROM employees e
      WHERE ${where}
        AND COALESCE(e.status, 'active') = 'active'
        AND (e.stop_date IS NULL OR e.stop_date > CURDATE())
      ORDER BY CAST(e.employee_no AS UNSIGNED), e.employee_no
    `,
    params
  );
  return rows;
}

async function getAllowanceRowsForEmployees(employeeIds, { allowanceOnly = false } = {}) {
  if (!employeeIds.length) return [];

  const [rows] = await pool.query(
    `
      SELECT
        ea.employee_id AS employeeId,
        ea.allowance_code AS code,
        COALESCE(NULLIF(ea.description, ''), wc.description) AS description,
        ea.amount,
        DATE_FORMAT(ea.upto, '%Y-%m-%d') AS validUpto,
        CAST(ea.allowance_code AS UNSIGNED) AS numericCode
      FROM employee_allowances ea
      LEFT JOIN wage_codes wc ON wc.code = LPAD(ea.allowance_code, 4, '0')
      WHERE ea.employee_id IN (${employeeIds.map(() => "?").join(",")})
        AND (ea.upto IS NULL OR ea.upto >= CURDATE())
        ${allowanceOnly ? "AND CAST(ea.allowance_code AS UNSIGNED) BETWEEN 1001 AND 1999" : ""}
      ORDER BY ea.employee_id ASC, CAST(ea.allowance_code AS UNSIGNED) ASC, ea.sr_no ASC
    `,
    employeeIds
  );

  return rows;
}

function summarizePayroll(rows) {
  return rows.reduce((summary, row) => {
    const code = Number(row.numericCode || row.code || 0);
    const amount = Number(row.amount || 0);

    if (code >= 1 && code <= 999) summary.basicPay += amount;
    if (code >= 1000 && code <= 3999) summary.allowances += amount;
    if (code >= 4001 && code <= 6999) summary.deductions += Math.abs(amount);

    return summary;
  }, { basicPay: 0, allowances: 0, deductions: 0 });
}

export async function getSalaryProofList(filters = {}) {
  const employees = await getFilteredEmployees(filters);
  const allowanceRows = await getAllowanceRowsForEmployees(employees.map((employee) => employee.id));
  const rowsByEmployee = allowanceRows.reduce((map, row) => {
    if (!map.has(row.employeeId)) map.set(row.employeeId, []);
    map.get(row.employeeId).push(row);
    return map;
  }, new Map());

  const rows = employees.map((employee) => {
    const summary = summarizePayroll(rowsByEmployee.get(employee.id) || []);
    const gross = summary.basicPay + summary.allowances;
    const netPay = gross - summary.deductions;
    return {
      employee_code: employee.employeeCode,
      name: employee.name,
      department: employee.department,
      designation: employee.designation,
      bps: employee.bps,
      gaz_ng: employee.gazNg,
      basic_pay: summary.basicPay,
      gross,
      deductions: summary.deductions,
      net_pay: netPay
    };
  });

  const totals = rows.reduce((sum, row) => ({
    basic_pay: sum.basic_pay + row.basic_pay,
    gross: sum.gross + row.gross,
    deductions: sum.deductions + row.deductions,
    net_pay: sum.net_pay + row.net_pay
  }), { basic_pay: 0, gross: 0, deductions: 0, net_pay: 0 });

  return { rows, totals };
}

export async function getSalaryProofListDetailed(filters = {}) {
  const employees = await getFilteredEmployees(filters);
  const allowanceRows = await getAllowanceRowsForEmployees(employees.map((employee) => employee.id));
  const rowsByEmployee = allowanceRows.reduce((map, row) => {
    if (!map.has(row.employeeId)) map.set(row.employeeId, []);
    map.get(row.employeeId).push(row);
    return map;
  }, new Map());

  const data = employees.map((employee) => {
    const items = (rowsByEmployee.get(employee.id) || []).map((row) => ({
      code: row.code,
      description: row.description,
      amount: Number(row.amount || 0)
    }));
    const summary = summarizePayroll(rowsByEmployee.get(employee.id) || []);
    const pay = summary.basicPay + summary.allowances;
    const net = pay - summary.deductions;

    return {
      employee_code: employee.employeeCode,
      name: employee.name,
      department: employee.department,
      designation: employee.designation,
      bps: employee.bps,
      gaz_ng: employee.gazNg,
      items,
      subtotal: { pay, deductions: summary.deductions, net }
    };
  });

  const grandTotal = data.reduce((sum, employee) => ({
    pay: sum.pay + employee.subtotal.pay,
    deductions: sum.deductions + employee.subtotal.deductions,
    net: sum.net + employee.subtotal.net
  }), { pay: 0, deductions: 0, net: 0 });

  return { employees: data, grandTotal };
}

export async function getAllowanceProofList(filters = {}) {
  const employees = await getFilteredEmployees(filters);
  const allowanceRows = await getAllowanceRowsForEmployees(employees.map((employee) => employee.id), { allowanceOnly: true });
  const rowsByEmployee = allowanceRows.reduce((map, row) => {
    if (!map.has(row.employeeId)) map.set(row.employeeId, []);
    map.get(row.employeeId).push(row);
    return map;
  }, new Map());

  const data = employees
    .map((employee) => {
      const items = (rowsByEmployee.get(employee.id) || []).map((row) => ({
        code: row.code,
        description: row.description,
        amount: Number(row.amount || 0),
        valid_upto: row.validUpto
      }));
      const subtotal = items.reduce((total, row) => total + row.amount, 0);
      return {
        employee_code: employee.employeeCode,
        name: employee.name,
        items,
        subtotal
      };
    })
    .filter((employee) => employee.items.length);

  const grandTotal = data.reduce((total, employee) => total + employee.subtotal, 0);
  return { employees: data, grandTotal };
}

export async function getInactiveProofList(filters = {}) {
  const { where, params } = buildEmployeeFilters(filters);
  const month = Number(filters.month || 1);
  const year = Number(filters.year || new Date().getFullYear());
  const endingDate = `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;

  const [rows] = await pool.query(
    `
      SELECT
        e.employee_no AS employee_code,
        e.name,
        e.department,
        e.designation,
        e.status,
        DATE_FORMAT(e.stop_date, '%Y-%m-%d') AS date_inactive
      FROM employees e
      WHERE ${where}
        AND e.status = 'inactive'
        AND (e.stop_date IS NULL OR e.stop_date <= ?)
      ORDER BY CAST(e.employee_no AS UNSIGNED), e.employee_no
    `,
    [...params, endingDate]
  );

  return { rows, endingDate };
}

export async function getScaleAuditRegister(filters = {}) {
  const { where, params } = buildEmployeeFilters(filters);
  const [rows] = await pool.query(
    `
      SELECT
        esh.employee_code AS employee_code,
        e.name,
        e.department,
        e.designation,
        esh.old_bps,
        esh.new_bps,
        DATE_FORMAT(esh.effective_date, '%Y-%m-%d') AS effective_date,
        esh.changed_by
      FROM employee_scale_history esh
      INNER JOIN employees e ON e.employee_no = esh.employee_code
      WHERE ${where}
      ORDER BY CAST(esh.employee_code AS UNSIGNED), esh.employee_code, esh.effective_date
    `,
    params
  );

  return { rows };
}
