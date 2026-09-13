import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { pool } from "../src/config/database.js";
import {
  buildPayrollMonthDifference,
  ensurePayrollTables,
  getAllowedPayrollProcessingPeriods,
  getPayrollMonthDifference,
  getPayslips,
  normalizeEmployeeCodes,
  normalizePayrollType,
  isPayrollProcessingPeriodAllowed,
  getSinglePayslip,
  validateSupplementaryPayrollInput
} from "../src/models/payrollModel.js";

before(async () => {
  await ensurePayrollTables();
});

after(async () => {
  await pool.end();
});

test("month comparison handles changed, added, removed, and unchanged employees", () => {
  const previous = [
    { employeeCode: "01", name: "Changed", grossPay: 100, totalDeductions: 10, netPay: 90 },
    { employeeCode: "02", name: "Removed", grossPay: 80, totalDeductions: 5, netPay: 75 },
    { employeeCode: "04", name: "Same", grossPay: 60, totalDeductions: 10, netPay: 50 }
  ];
  const current = [
    { employeeCode: "01", name: "Changed", grossPay: 120, totalDeductions: 15, netPay: 105 },
    { employeeCode: "03", name: "Added", grossPay: 70, totalDeductions: 5, netPay: 65 },
    { employeeCode: "04", name: "Same", grossPay: 60, totalDeductions: 10, netPay: 50 }
  ];

  const result = buildPayrollMonthDifference(previous, current);
  assert.deepEqual(result.rows.map((row) => [row.employeeCode, row.changeType, row.netDifference]), [
    ["01", "Changed", 15],
    ["02", "Removed", -75],
    ["03", "Added", 65],
    ["04", "Unchanged", 0]
  ]);
  assert.equal(result.totals.previousNet, 215);
  assert.equal(result.totals.currentNet, 220);
  assert.equal(result.totals.netDifference, 5);
});

test("payroll processing is allowed for current month and next two months only", () => {
  const referenceDate = new Date(2026, 8, 13);

  assert.deepEqual(getAllowedPayrollProcessingPeriods(referenceDate), [
    { month: 9, year: 2026 },
    { month: 10, year: 2026 },
    { month: 11, year: 2026 }
  ]);
  assert.equal(isPayrollProcessingPeriodAllowed(9, 2026, referenceDate), true);
  assert.equal(isPayrollProcessingPeriodAllowed(10, 2026, referenceDate), true);
  assert.equal(isPayrollProcessingPeriodAllowed(11, 2026, referenceDate), true);
  assert.equal(isPayrollProcessingPeriodAllowed(8, 2026, referenceDate), false);
  assert.equal(isPayrollProcessingPeriodAllowed(12, 2026, referenceDate), false);
});

test("supplementary payroll requires selected employees and a reason", () => {
  assert.equal(normalizePayrollType("SUPPLEMENTARY"), "supplementary");
  assert.equal(normalizePayrollType("regular"), "regular");
  assert.deepEqual(normalizeEmployeeCodes([" 01 ", "01", "03"]), ["01", "03"]);
  assert.deepEqual(normalizeEmployeeCodes("01, 02,,03"), ["01", "02", "03"]);

  assert.throws(
    () => validateSupplementaryPayrollInput({ payrollType: "supplementary", employeeCodes: ["01"], supplementaryReason: "" }),
    /requires a reason/
  );
  assert.throws(
    () => validateSupplementaryPayrollInput({ payrollType: "supplementary", employeeCodes: [], supplementaryReason: "Missed Employee" }),
    /requires at least one selected employee/
  );
  assert.doesNotThrow(() => validateSupplementaryPayrollInput({
    payrollType: "supplementary",
    employeeCodes: ["01"],
    supplementaryReason: "Missed Employee"
  }));
  assert.doesNotThrow(() => validateSupplementaryPayrollInput({ payrollType: "regular" }));
});

test("payslip model returns and reconciles a posted payroll snapshot", async (t) => {
  const [[run]] = await pool.query(`
    SELECT pr.payment_month AS month, pr.payment_year AS year, pr.dept_code AS deptCode
    FROM payroll_runs pr
    INNER JOIN payroll_run_items pri ON pri.payroll_run_id = pr.id
    WHERE pr.status IN ('processed', 'locked')
    ORDER BY pr.payment_year DESC, pr.payment_month DESC, pr.id DESC
    LIMIT 1
  `);
  if (!run) return t.skip("No posted payroll with employees exists in this database.");

  const report = await getPayslips({ month: run.month, year: run.year, deptCode: run.deptCode, gazNg: "A", reportFor: "All" });
  assert.ok(report.slips.length > 0);
  const slip = report.slips[0];
  const single = await getSinglePayslip({ employeeCode: slip.employeeCode, month: run.month, year: run.year });
  assert.ok(single);
  assert.equal(single.employeeCode, slip.employeeCode);
  assert.ok(["name", "department", "designation", "bps", "cnicNo", "dateOfJoining", "serviceType", "gpfAccountNo", "ntnNo", "pghsfNo", "sapNo", "bankCode", "branchName", "accountNo"].every((key) => Object.hasOwn(single, key)));

  const paymentTotal = single.details
    .filter((detail) => Number(detail.numericCode) < 4000)
    .reduce((sum, detail) => sum + Number(detail.amount || 0), 0);
  const deductionTotal = single.details
    .filter((detail) => Number(detail.numericCode) >= 4000)
    .reduce((sum, detail) => sum + Number(detail.amount || 0), 0);
  assert.equal(paymentTotal, Number(single.grossPay));
  assert.equal(deductionTotal, Number(single.totalDeductions));
  assert.equal(Number(single.grossPay) - Number(single.totalDeductions), Number(single.netPay));
});

test("draft or missing month is not treated as a real month difference", async () => {
  const result = await getPayrollMonthDifference({
    previous: { month: 1, year: 2099, deptCode: "999", gazNg: "A", reportFor: "All" },
    current: { month: 2, year: 2099, deptCode: "999", gazNg: "A", reportFor: "All" }
  });
  assert.equal(result.previousPeriod.available, false);
  assert.equal(result.currentPeriod.available, false);
  assert.deepEqual(result.rows, []);
  assert.equal(result.totals.netDifference, 0);
});

test("single payslip returns null for a period without posted payroll", async () => {
  const result = await getSinglePayslip({ employeeCode: "__missing__", month: 1, year: 2099 });
  assert.equal(result, null);
});
