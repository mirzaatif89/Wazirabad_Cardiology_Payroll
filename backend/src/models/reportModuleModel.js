import { pool } from "../config/database.js";

function monthEndDate(month, year) {
  return `${year}-${String(month).padStart(2, "0")}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
}

function monthKey(month, year) {
  return `${String(month).padStart(2, "0")}/${year}`;
}

function monthRange(fromMonth, fromYear, toMonth, toYear) {
  const months = [];
  let month = Number(fromMonth);
  let year = Number(fromYear);
  const endMonth = Number(toMonth);
  const endYear = Number(toYear);

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push({ month, year, key: monthKey(month, year) });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return months;
}

function employeeFilter({ deptCode = "999", gazNg = "A", reportFor = "All", designationCode = "" } = {}) {
  const clauses = ["1 = 1"];
  const params = [];

  if (deptCode && String(deptCode) !== "999") {
    clauses.push("e.department_code = ?");
    params.push(String(deptCode));
  }
  if (designationCode && String(designationCode) !== "999") {
    clauses.push("e.designation_code = ?");
    params.push(String(designationCode));
  }
  if (gazNg === "G") clauses.push("(e.gaz_ng LIKE 'Gaz%' OR e.gaz_ng = 'G')");
  if (gazNg === "N") clauses.push("(e.gaz_ng LIKE 'Non%' OR e.gaz_ng = 'N')");
  if (reportFor && reportFor !== "All") {
    clauses.push("e.service_type = ?");
    params.push(reportFor);
  }

  return { where: clauses.join(" AND "), params };
}

async function runIdsForPeriod(month, year, deptCode = "") {
  const params = [month, year];
  let deptSql = "";
  if (deptCode && String(deptCode) !== "999") {
    deptSql = "AND dept_code = ?";
    params.push(String(deptCode));
  }
  const [runs] = await pool.query(
    `SELECT id FROM payroll_runs WHERE payment_month = ? AND payment_year = ? AND status IN ('processed','locked') ${deptSql}`,
    params
  );
  return runs.map((run) => run.id);
}

export async function getPayDedSchedule({ deptCode = "999", gazNg = "A", reportFor = "All", month, year, code }) {
  const runIds = await runIdsForPeriod(month, year, deptCode);
  if (!runIds.length || !code) return { rows: [], grandTotal: 0 };
  const { where, params } = employeeFilter({ deptCode, gazNg, reportFor });
  const [rows] = await pool.query(
    `
      SELECT
        pri.employee_code AS employee_code,
        e.name,
        e.department,
        e.designation,
        prid.amount AS tax_amount
      FROM payroll_run_item_details prid
      INNER JOIN payroll_run_items pri ON pri.id = prid.payroll_run_item_id
      INNER JOIN employees e ON e.employee_no = pri.employee_code
      WHERE pri.payroll_run_id IN (${runIds.map(() => "?").join(",")})
        AND prid.wage_code = ?
        AND ${where}
      ORDER BY CAST(pri.employee_code AS UNSIGNED), pri.employee_code
    `,
    [...runIds, code, ...params]
  );
  return {
    rows,
    grandTotal: rows.reduce((total, row) => total + Number(row.tax_amount || 0), 0)
  };
}

export async function getPayslipsForMonths({ employeeCode, fromMonth, toMonth, year }) {
  const months = monthRange(fromMonth, year, toMonth, year);
  const slips = [];

  for (const period of months) {
    const runIds = await runIdsForPeriod(period.month, period.year);
    if (!runIds.length) continue;
    const [items] = await pool.query(
      `
        SELECT
          pri.id,
          pri.employee_code AS employeeCode,
          e.name,
          e.department,
          e.designation,
          e.bps,
          e.gaz_ng AS gazNg,
          pri.gross_pay AS grossPay,
          pri.total_deductions AS totalDeductions,
          pri.net_pay AS netPay
        FROM payroll_run_items pri
        INNER JOIN employees e ON e.employee_no = pri.employee_code
        WHERE pri.employee_code = ?
          AND pri.payroll_run_id IN (${runIds.map(() => "?").join(",")})
        LIMIT 1
      `,
      [employeeCode, ...runIds]
    );
    if (!items.length) continue;
    const [details] = await pool.query(
      "SELECT wage_code AS wageCode, description, amount FROM payroll_run_item_details WHERE payroll_run_item_id = ? ORDER BY CAST(wage_code AS UNSIGNED)",
      [items[0].id]
    );
    slips.push({ ...items[0], period: period.key, details });
  }

  return { slips };
}

export async function getDesignationWiseList({ designationCode = "", reportFor = "All", month, year }) {
  const runIds = await runIdsForPeriod(month, year);
  if (!runIds.length) return { designations: [], grandTotal: 0 };
  const { where, params } = employeeFilter({ designationCode, reportFor });
  const [rows] = await pool.query(
    `
      SELECT
        e.designation_code AS designationCode,
        e.designation,
        pri.employee_code AS employeeCode,
        e.name,
        e.department,
        pri.net_pay AS netPay
      FROM payroll_run_items pri
      INNER JOIN employees e ON e.employee_no = pri.employee_code
      WHERE pri.payroll_run_id IN (${runIds.map(() => "?").join(",")})
        AND ${where}
      ORDER BY e.designation, CAST(pri.employee_code AS UNSIGNED)
    `,
    [...runIds, ...params]
  );
  const groups = Object.values(rows.reduce((result, row) => {
    const key = row.designation || "No Designation";
    if (!result[key]) result[key] = { designation: key, rows: [], subtotal: 0 };
    result[key].rows.push(row);
    result[key].subtotal += Number(row.netPay || 0);
    return result;
  }, {}));
  return { designations: groups, grandTotal: groups.reduce((total, group) => total + group.subtotal, 0) };
}

export async function getAnnualIncomeTaxSchedule({ fromMonth, fromYear, toMonth, toYear, code, reportFor = "All" }) {
  const months = monthRange(fromMonth, fromYear, toMonth, toYear);
  const employeeMap = new Map();

  for (const period of months) {
    const schedule = await getPayDedSchedule({ month: period.month, year: period.year, code, reportFor });
    schedule.rows.forEach((row) => {
      if (!employeeMap.has(row.employee_code)) {
        employeeMap.set(row.employee_code, { employee_code: row.employee_code, name: row.name, months: {}, annualTotal: 0 });
      }
      const employee = employeeMap.get(row.employee_code);
      employee.months[period.key] = Number(row.tax_amount || 0);
      employee.annualTotal += Number(row.tax_amount || 0);
    });
  }

  const rows = Array.from(employeeMap.values()).sort((a, b) => String(a.employee_code).localeCompare(String(b.employee_code), undefined, { numeric: true }));
  const totals = months.reduce((result, period) => {
    result[period.key] = rows.reduce((sum, row) => sum + Number(row.months[period.key] || 0), 0);
    return result;
  }, {});
  return { months: months.map((item) => item.key), rows, totals, grandTotal: rows.reduce((total, row) => total + row.annualTotal, 0) };
}

export async function getPostAudit({ employeeCode, fromMonth, fromYear }) {
  const months = monthRange(fromMonth, fromYear, Number(fromMonth) + 11 > 12 ? (Number(fromMonth) + 11) % 12 || 12 : Number(fromMonth) + 11, Number(fromYear) + Math.floor((Number(fromMonth) + 10) / 12));
  const wageMap = new Map();
  let employee = null;

  for (const period of months) {
    const slips = await getPayslipsForMonths({ employeeCode, fromMonth: period.month, toMonth: period.month, year: period.year });
    if (!slips.slips.length) continue;
    employee = slips.slips[0];
    slips.slips[0].details.forEach((detail) => {
      if (!wageMap.has(detail.wageCode)) {
        wageMap.set(detail.wageCode, { wageCode: detail.wageCode, description: detail.description, months: {}, total: 0 });
      }
      const row = wageMap.get(detail.wageCode);
      row.months[period.key] = Number(detail.amount || 0);
      row.total += Number(detail.amount || 0);
    });
  }
  const rows = Array.from(wageMap.values());
  const totals = months.reduce((result, period) => {
    result[period.key] = rows.reduce((sum, row) => sum + Number(row.months[period.key] || 0), 0);
    return result;
  }, {});
  return { employee, months: months.map((item) => item.key), rows, totals };
}

export async function getActiveInactiveComplete(filters = {}) {
  const { where, params } = employeeFilter(filters);
  const [rows] = await pool.query(
    `
      SELECT
        e.employee_no AS employee_code,
        e.name,
        e.department,
        e.designation,
        COALESCE(e.status, 'active') AS status
      FROM employees e
      WHERE ${where}
      ORDER BY CAST(e.employee_no AS UNSIGNED), e.employee_no
    `,
    params
  );
  return {
    rows,
    summary: {
      active: rows.filter((row) => row.status === "active").length,
      inactive: rows.filter((row) => row.status === "inactive").length
    }
  };
}

export async function getActiveInactiveMonthwise(filters = {}) {
  const complete = await getActiveInactiveComplete(filters);
  const runIds = await runIdsForPeriod(filters.month, filters.year, filters.deptCode);
  if (!runIds.length) return complete;
  const [activeRows] = await pool.query(
    `SELECT DISTINCT employee_code AS employeeCode FROM payroll_run_items WHERE payroll_run_id IN (${runIds.map(() => "?").join(",")})`,
    runIds
  );
  const activeSet = new Set(activeRows.map((row) => row.employeeCode));
  const rows = complete.rows.map((row) => ({ ...row, status: activeSet.has(row.employee_code) ? "active" : "inactive" }));
  return {
    rows,
    summary: {
      active: rows.filter((row) => row.status === "active").length,
      inactive: rows.filter((row) => row.status === "inactive").length
    }
  };
}

export async function getExportToExcel(filters = {}) {
  const runIds = await runIdsForPeriod(filters.month, filters.year, filters.deptCode);
  if (!runIds.length) return { rows: [] };
  const { where, params } = employeeFilter(filters);
  const [rows] = await pool.query(
    `
      SELECT
        pri.employee_code AS employee_code,
        e.name,
        e.department,
        e.designation,
        prid.wage_code AS wage_code,
        prid.description,
        prid.amount
      FROM payroll_run_item_details prid
      INNER JOIN payroll_run_items pri ON pri.id = prid.payroll_run_item_id
      INNER JOIN employees e ON e.employee_no = pri.employee_code
      WHERE pri.payroll_run_id IN (${runIds.map(() => "?").join(",")})
        AND ${where}
      ORDER BY CAST(pri.employee_code AS UNSIGNED), CAST(prid.wage_code AS UNSIGNED)
    `,
    [...runIds, ...params]
  );
  return { rows };
}
