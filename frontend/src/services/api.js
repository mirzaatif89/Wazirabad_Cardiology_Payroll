const API_BASE_URL =
  window.PAYROLL_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.origin}/api`;

async function readJsonResponse(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const error = new Error("Backend API is not responding with JSON. Please check API URL/config.js.");
    error.status = response.status;
    throw error;
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || fallbackMessage);
    error.status = response.status;
    error.data = data.data;
    throw error;
  }

  return data;
}

export async function loginUser(credentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(credentials)
  });

  return readJsonResponse(response, "Login failed.");
}

export async function requestPasswordResetOtp(usernameOrEmail) {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ usernameOrEmail })
  });

  return readJsonResponse(response, "Password reset OTP failed.");
}

export async function verifyPasswordResetOtp(payload) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-reset-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return readJsonResponse(response, "OTP verification failed.");
}

export async function resetPasswordWithOtp(payload) {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return readJsonResponse(response, "Password reset failed.");
}

export async function resetSoftwareData(password) {
  const response = await fetch(`${API_BASE_URL}/admin/reset-data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ password })
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Reset data failed.");
  }

  return data;
}

export async function changeAdminPassword(passwords) {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(passwords)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Password change failed.");
  }

  return data;
}

export async function createEmployee(employee) {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(employee)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Employee save failed.");
  }

  return data;
}

export async function getEmployees() {
  const response = await fetch(`${API_BASE_URL}/employees`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Employee list failed.");
  }

  return data.employees;
}

export async function getNextEmployeeNo() {
  const response = await fetch(`${API_BASE_URL}/employees/next-no`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Next employee no failed.");
  }

  return data.employeeNo;
}

export async function getEmployeeByCode(employeeNo) {
  const response = await fetch(`${API_BASE_URL}/employees/code/${encodeURIComponent(employeeNo)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Employee lookup failed.");
  }

  return data.employee;
}

export async function updateEmployee(id, employee) {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(employee)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Employee update failed.");
  }

  return data;
}

export async function deleteEmployee(id) {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: "DELETE"
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Employee delete failed.");
  }

  return data;
}

export async function getDepartments() {
  const response = await fetch(`${API_BASE_URL}/departments`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Department list failed.");
  }

  return data.departments;
}

export async function createDepartment(department) {
  const response = await fetch(`${API_BASE_URL}/departments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(department)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Department save failed.");
  }

  return data;
}

export async function updateDepartment(id, department) {
  const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(department)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Department update failed.");
  }

  return data;
}

export async function deleteDepartment(id) {
  const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
    method: "DELETE"
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Department delete failed.");
  }

  return data;
}

export async function getDesignations() {
  const response = await fetch(`${API_BASE_URL}/designations`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Designation list failed.");
  }

  return data.designations;
}

export async function createDesignation(designation) {
  const response = await fetch(`${API_BASE_URL}/designations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(designation)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Designation save failed.");
  }

  return data;
}

export async function updateDesignation(id, designation) {
  const response = await fetch(`${API_BASE_URL}/designations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(designation)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Designation update failed.");
  }

  return data;
}

export async function deleteDesignation(id) {
  const response = await fetch(`${API_BASE_URL}/designations/${id}`, {
    method: "DELETE"
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Designation delete failed.");
  }

  return data;
}

export async function getBanks() {
  const response = await fetch(`${API_BASE_URL}/banks`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Bank list failed.");
  }

  return data.banks;
}

export async function createBank(bank) {
  const response = await fetch(`${API_BASE_URL}/banks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(bank)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Bank save failed.");
  }

  return data;
}

export async function updateBank(id, bank) {
  const response = await fetch(`${API_BASE_URL}/banks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(bank)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Bank update failed.");
  }

  return data;
}

export async function deleteBank(id) {
  const response = await fetch(`${API_BASE_URL}/banks/${id}`, {
    method: "DELETE"
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Bank delete failed.");
  }

  return data;
}

export async function getBankBranches() {
  const response = await fetch(`${API_BASE_URL}/bank-branches`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Bank branch list failed.");
  }

  return data.branches;
}

export async function createBankBranch(branch) {
  const response = await fetch(`${API_BASE_URL}/bank-branches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(branch)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Bank branch save failed.");
  }

  return data;
}

export async function updateBankBranch(id, branch) {
  const response = await fetch(`${API_BASE_URL}/bank-branches/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(branch)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Bank branch update failed.");
  }

  return data;
}

export async function deleteBankBranch(id) {
  const response = await fetch(`${API_BASE_URL}/bank-branches/${id}`, {
    method: "DELETE"
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Bank branch delete failed.");
  }

  return data;
}

export async function getAccountCodes() {
  const response = await fetch(`${API_BASE_URL}/account-codes`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Account code list failed.");
  }

  return data.accountCodes;
}

export async function createAccountCode(accountCode) {
  const response = await fetch(`${API_BASE_URL}/account-codes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(accountCode)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Account code save failed.");
  }

  return data;
}

export async function updateAccountCode(id, accountCode) {
  const response = await fetch(`${API_BASE_URL}/account-codes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(accountCode)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Account code update failed.");
  }

  return data;
}

export async function deleteAccountCode(id) {
  const response = await fetch(`${API_BASE_URL}/account-codes/${id}`, {
    method: "DELETE"
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Account code delete failed.");
  }

  return data;
}

export async function getChartOfAccounts(search = "") {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  const response = await fetch(`${API_BASE_URL}/chart-of-accounts?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Chart of accounts list failed.");
  }

  return data.data;
}

export async function getWageCodes(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.category) {
    params.set("category", filters.category);
  }

  const response = await fetch(`${API_BASE_URL}/wage-codes?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Wage code list failed.");
  }

  return data.data;
}

export async function createWageCode(wageCode) {
  const response = await fetch(`${API_BASE_URL}/wage-codes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(wageCode)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Wage code save failed.");
  }

  return data;
}

export async function updateWageCode(code, wageCode) {
  const response = await fetch(`${API_BASE_URL}/wage-codes/${encodeURIComponent(code)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(wageCode)
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Wage code update failed.");
  }

  return data;
}

export async function deleteWageCode(code) {
  const response = await fetch(`${API_BASE_URL}/wage-codes/${encodeURIComponent(code)}`, {
    method: "DELETE"
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Wage code delete failed.");
  }

  return data;
}

export async function getSpecialPay(employeeCode, filters = {}) {
  const params = new URLSearchParams();
  params.set("month", filters.month || "");
  params.set("year", filters.year || "");
  const response = await fetch(`${API_BASE_URL}/special-pay/${encodeURIComponent(employeeCode)}?${params.toString()}`);
  return readJsonResponse(response, "Special pay lookup failed.");
}

export async function saveSpecialPay(payload) {
  const response = await fetch(`${API_BASE_URL}/special-pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return readJsonResponse(response, "Special pay save failed.");
}

export async function deleteSpecialPayEntry(id) {
  const response = await fetch(`${API_BASE_URL}/special-pay/${id}`, { method: "DELETE" });
  return readJsonResponse(response, "Special pay delete failed.");
}

export async function printCheque(payload) {
  const response = await fetch(`${API_BASE_URL}/cheque-print`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return readJsonResponse(response, "Cheque print failed.");
}

export async function getAllowancesExport(filters = {}) {
  const params = new URLSearchParams();
  params.set("from_month", filters.fromMonth || "");
  params.set("from_year", filters.fromYear || "");
  params.set("to_month", filters.toMonth || "");
  params.set("to_year", filters.toYear || "");
  const response = await fetch(`${API_BASE_URL}/exports/allowances?${params.toString()}`);
  return readJsonResponse(response, "Allowances export failed.");
}

export async function getTaxScheduleExport(filters = {}) {
  const params = new URLSearchParams();
  params.set("from_month", filters.fromMonth || "");
  params.set("from_year", filters.fromYear || "");
  params.set("to_month", filters.toMonth || "");
  params.set("to_year", filters.toYear || "");
  const response = await fetch(`${API_BASE_URL}/exports/tax-schedule?${params.toString()}`);
  return readJsonResponse(response, "Tax schedule export failed.");
}

export async function getNextArrearDocumentNo() {
  const response = await fetch(`${API_BASE_URL}/arrear-bills/next-document-no`);
  return readJsonResponse(response, "Next arrear document number failed.");
}

export async function getArrearBills(filters = {}) {
  const params = new URLSearchParams();

  if (filters.employeeCode) {
    params.set("employee_code", filters.employeeCode);
  }

  if (filters.dateFrom) {
    params.set("date_from", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.set("date_to", filters.dateTo);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.documentNo) {
    params.set("document_no", filters.documentNo);
  }

  const response = await fetch(`${API_BASE_URL}/arrear-bills?${params.toString()}`);
  return readJsonResponse(response, "Arrear bill list failed.");
}

export async function getArrearBill(id) {
  const response = await fetch(`${API_BASE_URL}/arrear-bills/${id}`);
  return readJsonResponse(response, "Arrear bill lookup failed.");
}

export async function reopenArrearBill(id) {
  const response = await fetch(`${API_BASE_URL}/arrear-bills/${id}/reopen`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ performedBy: "Hospital Admin" })
  });
  return readJsonResponse(response, "Arrear bill reopen failed.");
}

export async function updateArrearBillStatus(id, status) {
  const response = await fetch(`${API_BASE_URL}/arrear-bills/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status, performedBy: "Hospital Admin" })
  });
  return readJsonResponse(response, "Arrear bill status update failed.");
}

export async function getArrearBillReport(filters = {}) {
  const params = new URLSearchParams();

  if (filters.employeeCode) {
    params.set("employee_code", filters.employeeCode);
  }

  if (filters.fromDate) {
    params.set("from_date", filters.fromDate);
  }

  if (filters.toDate) {
    params.set("to_date", filters.toDate);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  params.set("sort_by", filters.sortBy || "doc_no");

  const response = await fetch(`${API_BASE_URL}/arrear-bills/report?${params.toString()}`);
  return readJsonResponse(response, "Arrear bill report failed.");
}

export async function createArrearBill(bill) {
  const response = await fetch(`${API_BASE_URL}/arrear-bills`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(bill)
  });
  return readJsonResponse(response, "Arrear bill save failed.");
}

export async function updateArrearBill(id, bill) {
  const response = await fetch(`${API_BASE_URL}/arrear-bills/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(bill)
  });
  return readJsonResponse(response, "Arrear bill update failed.");
}

export async function deleteArrearBill(id) {
  const response = await fetch(`${API_BASE_URL}/arrear-bills/${id}`, {
    method: "DELETE"
  });
  return readJsonResponse(response, "Arrear bill delete failed.");
}

export async function finalizeArrearBill(id) {
  const response = await fetch(`${API_BASE_URL}/arrear-bills/${id}/finalize`, {
    method: "POST"
  });
  return readJsonResponse(response, "Arrear bill finalize failed.");
}

export async function getNextBudgetDocumentNo() {
  const response = await fetch(`${API_BASE_URL}/budget-transactions/next-document-no`);
  return readJsonResponse(response, "Next budget document number failed.");
}

export async function getBudgetTransactions(filters = {}) {
  const params = new URLSearchParams();

  if (filters.budgetType) {
    params.set("budget_type", filters.budgetType);
  }

  if (filters.dateFrom) {
    params.set("date_from", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.set("date_to", filters.dateTo);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.documentNo) {
    params.set("document_no", filters.documentNo);
  }

  const response = await fetch(`${API_BASE_URL}/budget-transactions?${params.toString()}`);
  return readJsonResponse(response, "Budget transaction list failed.");
}

export async function getBudgetTransaction(id) {
  const response = await fetch(`${API_BASE_URL}/budget-transactions/${id}`);
  return readJsonResponse(response, "Budget transaction lookup failed.");
}

export async function reopenBudgetTransaction(id) {
  const response = await fetch(`${API_BASE_URL}/budget-transactions/${id}/reopen`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ performedBy: "Hospital Admin" })
  });
  return readJsonResponse(response, "Budget transaction reopen failed.");
}

export async function updateBudgetTransactionStatus(id, status) {
  const response = await fetch(`${API_BASE_URL}/budget-transactions/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status, performedBy: "Hospital Admin" })
  });
  return readJsonResponse(response, "Budget transaction status update failed.");
}

export async function createBudgetTransaction(transaction) {
  const response = await fetch(`${API_BASE_URL}/budget-transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(transaction)
  });
  return readJsonResponse(response, "Budget transaction save failed.");
}

export async function updateBudgetTransaction(id, transaction) {
  const response = await fetch(`${API_BASE_URL}/budget-transactions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(transaction)
  });
  return readJsonResponse(response, "Budget transaction update failed.");
}

export async function deleteBudgetTransaction(id) {
  const response = await fetch(`${API_BASE_URL}/budget-transactions/${id}`, {
    method: "DELETE"
  });
  return readJsonResponse(response, "Budget transaction delete failed.");
}

export async function finalizeBudgetTransaction(id) {
  const response = await fetch(`${API_BASE_URL}/budget-transactions/${id}/finalize`, {
    method: "POST"
  });
  return readJsonResponse(response, "Budget transaction finalize failed.");
}

export async function getBudgetSummary() {
  const response = await fetch(`${API_BASE_URL}/budget-summary`);
  return readJsonResponse(response, "Budget summary failed.");
}

export async function getBudgetPosition(endingDate) {
  const params = new URLSearchParams({ ending_date: endingDate });
  const response = await fetch(`${API_BASE_URL}/budget-position?${params.toString()}`);
  return readJsonResponse(response, "Budget position failed.");
}

export async function getDocumentByNumber(documentNo, type = "") {
  const params = new URLSearchParams();

  if (type) {
    params.set("type", type);
  }

  const query = params.toString();
  const response = await fetch(`${API_BASE_URL}/documents/${encodeURIComponent(documentNo)}${query ? `?${query}` : ""}`);
  return readJsonResponse(response, "Document lookup failed.");
}

export async function getEmployeeAllowances(employeeId) {
  const response = await fetch(`${API_BASE_URL}/allowances/${employeeId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Allowance list failed.");
  }

  return data;
}

function buildProofReportParams(filters = {}) {
  const params = new URLSearchParams();
  params.set("dept_code", filters.deptCode || "999");
  params.set("gaz_ng", filters.gazNg || "A");
  params.set("report_for", filters.reportFor || "All");

  if (filters.bps) params.set("bps", filters.bps);
  if (filters.month) params.set("month", filters.month);
  if (filters.year) params.set("year", filters.year);

  return params;
}

export async function getProofReport(endpoint, filters = {}) {
  const params = buildProofReportParams(filters);
  const response = await fetch(`${API_BASE_URL}/reports/${endpoint}?${params.toString()}`);
  return readJsonResponse(response, "Proof report failed.");
}

export async function getReportModule(endpoint, filters = {}) {
  const params = new URLSearchParams();
  const mappings = {
    deptCode: "dept_code",
    gazNg: "gaz_ng",
    reportFor: "report_for",
    employeeCode: "employee_code",
    fromMonth: "from_month",
    toMonth: "to_month",
    fromYear: "from_year",
    toYear: "to_year",
    designationCode: "designation_code"
  };

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(mappings[key] || key, value);
    }
  });

  const response = await fetch(`${API_BASE_URL}/reports/${endpoint}?${params.toString()}`);
  return readJsonResponse(response, "Report failed.");
}

export async function getReportScheduleDefaults() {
  const response = await fetch(`${API_BASE_URL}/reports/schedule-defaults`);
  return readJsonResponse(response, "Report schedule defaults failed.");
}

function payrollParams(filters = {}) {
  const params = new URLSearchParams();
  params.set("dept_code", filters.deptCode || "999");
  params.set("gaz_ng", filters.gazNg || "A");
  params.set("report_for", filters.reportFor || "All");
  params.set("month", filters.month || "");
  params.set("year", filters.year || "");
  return params;
}

export async function processPayroll(payload) {
  const response = await fetch(`${API_BASE_URL}/payroll/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payment_month: Number(payload.month),
      payment_year: Number(payload.year),
      dept_code: payload.deptCode || "999",
      gaz_ng: payload.gazNg || "A",
      report_for: payload.reportFor || "All"
    })
  });
  return readJsonResponse(response, "Payroll processing failed.");
}

export async function getPayrollCurrentPeriod() {
  const response = await fetch(`${API_BASE_URL}/payroll/current-period`);
  return readJsonResponse(response, "Current payroll period failed.");
}

export async function getPayrollEmployeeCount(filters = {}) {
  const params = payrollParams(filters);
  const response = await fetch(`${API_BASE_URL}/payroll/employee-count?${params.toString()}`);
  return readJsonResponse(response, "Payroll employee count failed.");
}

export async function getPayrollRun(id) {
  const response = await fetch(`${API_BASE_URL}/payroll/runs/${encodeURIComponent(id)}`);
  return readJsonResponse(response, "Payroll run failed.");
}

export async function getPayrollReport(endpoint, filters = {}) {
  const params = payrollParams(filters);
  const response = await fetch(`${API_BASE_URL}/payroll/${endpoint}?${params.toString()}`);
  return readJsonResponse(response, "Payroll report failed.");
}

export async function getPayrollBudgetRequirement(endingDate) {
  const params = new URLSearchParams({ ending_date: endingDate });
  const response = await fetch(`${API_BASE_URL}/payroll/budget-requirement?${params.toString()}`);
  return readJsonResponse(response, "Budget requirement failed.");
}

export async function getSinglePayrollPayslip(employeeCode, filters = {}) {
  const params = new URLSearchParams({ month: filters.month || "", year: filters.year || "" });
  const response = await fetch(`${API_BASE_URL}/payroll/payslip/${encodeURIComponent(employeeCode)}?${params.toString()}`);
  return readJsonResponse(response, "Single pay slip failed.");
}

export async function getPayrollRuns(filters = {}) {
  const params = new URLSearchParams();
  if (filters.month) params.set("month", filters.month);
  if (filters.year) params.set("year", filters.year);
  if (filters.deptCode) params.set("dept_code", filters.deptCode);
  const response = await fetch(`${API_BASE_URL}/payroll/runs?${params.toString()}`);
  return readJsonResponse(response, "Payroll runs failed.");
}

export async function reopenPayrollRun(id) {
  const response = await fetch(`${API_BASE_URL}/payroll/runs/${id}/reopen`, { method: "POST" });
  return readJsonResponse(response, "Payroll reopen failed.");
}

async function postMprocess(endpoint, payload, fallbackMessage) {
  const response = await fetch(`${API_BASE_URL}/mprocess/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return readJsonResponse(response, fallbackMessage);
}

export async function previewPercentAllowance(payload) {
  return postMprocess("percent-allowance/preview", {
    source_wage_code: payload.sourceWageCode,
    percentage: Number(payload.percentage),
    target_wage_code: payload.targetWageCode,
    bps: payload.bps || "99",
    type: payload.type || "All",
    effective_upto: payload.effectiveUpto
  }, "Percentage allowance preview failed.");
}

export async function applyPercentAllowance(payload) {
  return postMprocess("percent-allowance/apply", {
    source_wage_code: payload.sourceWageCode,
    percentage: Number(payload.percentage),
    target_wage_code: payload.targetWageCode,
    bps: payload.bps || "99",
    type: payload.type || "All",
    effective_upto: payload.effectiveUpto
  }, "Percentage allowance apply failed.");
}

export async function previewFixedAllowance(payload) {
  return postMprocess("fixed-allowance/preview", {
    amount: Number(payload.amount),
    target_wage_code: payload.targetWageCode,
    designation_code: payload.designationCode || "999",
    type: payload.type || "All",
    effective_upto: payload.effectiveUpto
  }, "Fixed allowance preview failed.");
}

export async function applyFixedAllowance(payload) {
  return postMprocess("fixed-allowance/apply", {
    amount: Number(payload.amount),
    target_wage_code: payload.targetWageCode,
    designation_code: payload.designationCode || "999",
    type: payload.type || "All",
    effective_upto: payload.effectiveUpto
  }, "Fixed allowance apply failed.");
}

export async function previewAnnualIncrement(payload) {
  return postMprocess("annual-increment/preview", {
    increment_percentage: Number(payload.incrementPercentage),
    applies_to_wage_code: payload.appliesToWageCode,
    effective_date: payload.effectiveDate
  }, "Annual increment preview failed.");
}

export async function applyAnnualIncrement(payload) {
  return postMprocess("annual-increment/apply", {
    increment_percentage: Number(payload.incrementPercentage),
    applies_to_wage_code: payload.appliesToWageCode,
    effective_date: payload.effectiveDate
  }, "Annual increment apply failed.");
}

export async function saveEmployeeAllowances(employeeId, allowances) {
  const response = await fetch(`${API_BASE_URL}/allowances/${employeeId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ allowances })
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Allowance save failed.");
  }

  return data;
}
