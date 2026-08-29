import {
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Home,
  LogOut,
  Pencil,
  ReceiptText,
  ShieldCheck,
  Trash2,
  Users
} from "lucide-react";
import React from "react";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { getPageSlug, sidebarSections as navigationSections } from "../navigation.js";
import {
  changeAdminPassword,
  createArrearBill,
  createAccountCode,
  createBank,
  createBankBranch,
  createBudgetTransaction,
  createDepartment,
  createDesignation,
  createEmployee,
  createWageCode,
  deleteArrearBill,
  deleteAccountCode,
  deleteBank,
  deleteBankBranch,
  deleteBudgetTransaction,
  deleteDepartment,
  deleteDesignation,
  deleteEmployee,
  deleteSpecialPayEntry,
  deleteWageCode,
  finalizeArrearBill,
  finalizeBudgetTransaction,
  closeEmployeeAdvance,
  createEmployeeAdvance,
  deleteEmployeeAdvance,
  getArrearBill,
  getArrearBillReport,
  getArrearBills,
  getArrearPayments,
  getAccountCodes,
  getBudgetSummary,
  getBudgetTransaction,
  getBudgetTransactions,
  getBudgetPosition,
  getBankBranches,
  getBanks,
  getChartOfAccounts,
  getEmployeeAllowances,
  getEmployeeByCode,
  getEmployees,
  getNextEmployeeNo,
  getNextArrearPaymentNo,
  getDepartments,
  getDesignations,
  getAllowancesExport,
  getEmployeeAdvances,
  getNextEmployeeAdvanceNo,
  getWageCodes,
  getPayableArrearBills,
  getNextArrearDocumentNo,
  getNextBudgetDocumentNo,
  getDocumentByNumber,
  getProofReport,
  getPayrollBudgetRequirement,
  getPayrollCurrentPeriod,
  getPayrollReport,
  getPayrollRun,
  getPayrollRuns,
  getSinglePayrollPayslip,
  getReportModule,
  getReportScheduleDefaults,
  getSpecialPay,
  getTaxScheduleExport,
  printCheque,
  createArrearPayment,
  reverseArrearPayment,
  applyAnnualIncrement,
  applyFixedAllowance,
  applyPercentAllowance,
  previewAnnualIncrement,
  previewFixedAllowance,
  previewPercentAllowance,
  previewPayroll,
  processPayroll,
  activateFiscalYear,
  createFiscalYear,
  deleteFiscalYear,
  getFiscalYears,
  activateTaxPolicy,
  createTaxPolicy,
  createTaxSlab,
  deleteTaxPolicy,
  deleteTaxSlab,
  generateStoredTaxDeductions,
  getTaxPolicies,
  getTaxSlabs,
  getTaxGenerationHistory,
  getTaxGenerationBatchDetails,
  reopenPayrollRun,
  voidPayrollRun,
  reopenArrearBill,
  reopenBudgetTransaction,
  resetSoftwareData,
  saveEmployeeAllowances,
  saveSpecialPay,
  updateAccountCode,
  updateArrearBill,
  updateArrearBillStatus,
  updateBank,
  updateBankBranch,
  updateBudgetTransaction,
  updateBudgetTransactionStatus,
  updateDepartment,
  updateDesignation,
  updateEmployee,
  updateFiscalYear,
  updateEmployeeAdvance,
  updateTaxPolicy,
  updateTaxSlab,
  updateWageCode
} from "../services/api.js";

const sectionIcons = {
  Dashboard: Home,
  Transactions: ReceiptText,
  "Arrear Bill": FileText,
  Proofs: FileCheck2,
  Payroll: Banknote,
  Reports: BarChart3,
  "M.Process": CircleDollarSign,
  Management: BriefcaseBusiness
};

const sidebarSections = navigationSections.map((section) => ({
  ...section,
  icon: sectionIcons[section.title] || Home
}));

const newEmployeeFields = [
  { label: "Employee No.", name: "employeeNo" },
  { label: "Name", name: "name" },
  { label: "Father Name", name: "fatherName" },
  { label: "Email", name: "email", type: "email" },
  { label: "Address", name: "address", wide: true },
  { label: "Contact No.", name: "contactNo" },
  { label: "CNIC No.", name: "cnicNo" },
  { label: "Old P. No.", name: "oldPersonnelNo" },
  { label: "Place Of Posting", name: "placeOfPosting" },
  { label: "Designation Code", name: "designationCode" },
  { label: "Designation", name: "designation", readOnly: true },
  { label: "BPS", name: "bps" },
  { label: "Gaz/NG", name: "gazNg", type: "select", options: ["Gazetted", "Non Gazetted"] },
  { label: "D.O.B.", name: "dateOfBirth", type: "date" },
  { label: "Date Of Joining", name: "dateOfJoining", type: "date" },
  { label: "Prior Employer Tax Credit", name: "priorEmployerTaxCredit", type: "number" },
  { label: "Department Code", name: "departmentCode" },
  { label: "Department", name: "department", readOnly: true },
  { label: "Service Type", name: "serviceType", type: "select", options: ["Regular", "Contract", "Adhoc"] },
  { label: "Bank Code", name: "bankCode" },
  { label: "Bank", name: "bank", readOnly: true },
  { label: "Branch Code", name: "bankBranchCode" },
  { label: "Bank Branch", name: "bankBranch", readOnly: true },
  { label: "Account No.", name: "accountNo" },
  { label: "GPF A/C No.", name: "gpfAccountNo" },
  { label: "NTN No.", name: "ntnNo" },
  { label: "PGHSF No.", name: "pghsfNo" },
  { label: "Religion", name: "religion", type: "select", options: ["Muslim", "Non-Muslim"] },
  { label: "SAP #", name: "sapNo" },
  { label: "Stop Date", name: "stopDate", type: "date" }
];

const newEmployeeFieldMap = Object.fromEntries(newEmployeeFields.map((field) => [field.name, field]));

const employeeFormSections = [
  {
    title: "Personal Details",
    description: "Identity and contact information for the employee record.",
    fields: ["employeeNo", "name", "fatherName", "dateOfBirth", "email", "contactNo", "cnicNo", "address", "oldPersonnelNo", "placeOfPosting"]
  },
  {
    title: "Employment Details",
    description: "Current designation, grade, department, and pay status.",
    fields: ["designationCode", "designation", "bps", "gazNg", "dateOfJoining", "departmentCode", "department", "serviceType", "stopDate"]
  },
  {
    title: "Employee Tax Panel",
    description: "Maintain tax onboarding fields here so payroll calculations can use one consistent source.",
    fields: ["priorEmployerTaxCredit", "ntnNo"]
  },
  {
    title: "Banking And Payroll References",
    description: "Bank, account, and payroll reference details used during salary processing.",
    fields: ["bankCode", "bank", "bankBranchCode", "bankBranch", "accountNo", "gpfAccountNo", "pghsfNo", "religion", "sapNo"]
  }
];

function EmployeeFormField({ field, value, onChange, onKeyDown, onGenerateEmployeeNo, required = false, className = "", children }) {
  const wrapperClassName = [field.wide ? "wide-field" : "", className].filter(Boolean).join(" ");

  return (
    <label className={wrapperClassName}>
      <span>{field.label}</span>
      {field.type === "select" ? (
        <select name={field.name} value={value} onChange={onChange}>
          <option value="">Select</option>
          {field.options.map((option) => (
            <option value={option} key={option}>{option}</option>
          ))}
        </select>
      ) : field.name === "employeeNo" && onGenerateEmployeeNo ? (
        <div className="employee-no-row">
          <input
            name={field.name}
            type={field.type || "text"}
            value={value}
            onChange={onChange}
            readOnly={field.readOnly}
            required={required}
          />
          <button type="button" onClick={onGenerateEmployeeNo}>
            Generate
          </button>
        </div>
      ) : (
        <input
          name={field.name}
          type={field.type || "text"}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          readOnly={field.readOnly}
          required={required}
          placeholder={employeeCodeLookupFieldNames.has(field.name) ? "F1" : undefined}
        />
      )}
      {children}
    </label>
  );
}

function findDepartmentByCode(departments, code) {
  const cleanCode = code.trim().toLowerCase();

  if (!cleanCode) {
    return null;
  }

  return departments.find((department) => department.code.toLowerCase() === cleanCode) || null;
}

function findDesignationByCode(designations, code) {
  const cleanCode = code.trim().toLowerCase();

  if (!cleanCode) {
    return null;
  }

  return designations.find((designation) => designation.code.toLowerCase() === cleanCode) || null;
}

function findBankByCode(banks, code) {
  const cleanCode = code.trim().toLowerCase();

  if (!cleanCode) {
    return null;
  }

  return banks.find((bank) => bank.code.toLowerCase() === cleanCode) || null;
}

function findBankBranchByCode(branches, code) {
  const cleanCode = code.trim().toLowerCase();

  if (!cleanCode) {
    return null;
  }

  const normalizedCode = cleanCode.replace(/^0+(?=\d)/, "");

  return branches.find((branch) => {
    const branchCode = String(branch.code || "").trim().toLowerCase();
    const normalizedBranchCode = branchCode.replace(/^0+(?=\d)/, "");

    return branchCode === cleanCode || normalizedBranchCode === normalizedCode;
  }) || null;
}

const employeeCodeLookupFieldNames = new Set([
  "designationCode",
  "departmentCode",
  "bankCode",
  "bankBranchCode"
]);

function getEmployeeCodeLookupConfig(fieldName, sources) {
  const {
    departments = [],
    designations = [],
    accountCodes = [],
    banks = [],
    bankBranches = []
  } = sources;

  if (fieldName === "designationCode") {
    return {
      fieldName,
      eyebrow: "Designation Code",
      title: "Designation Code Lookup",
      emptyMessage: "No designation code found.",
      rows: [...designations, ...accountCodes].map((item, index) => ({
        key: `designation-${item.code}-${index}`,
        code: item.code || "",
        description: item.designation || ""
      }))
    };
  }

  if (fieldName === "departmentCode") {
    return {
      fieldName,
      eyebrow: "Department Code",
      title: "Department Code Lookup",
      emptyMessage: "No department code found.",
      rows: departments.map((item, index) => ({
        key: `department-${item.code}-${index}`,
        code: item.code || "",
        description: item.department || ""
      }))
    };
  }

  if (fieldName === "bankCode") {
    return {
      fieldName,
      eyebrow: "Bank Code",
      title: "Bank Code Lookup",
      emptyMessage: "No bank code found.",
      rows: banks.map((item, index) => ({
        key: `bank-${item.code}-${index}`,
        code: item.code || "",
        description: item.bank || ""
      }))
    };
  }

  if (fieldName === "bankBranchCode") {
    return {
      fieldName,
      eyebrow: "Branch Code",
      title: "Branch Code Lookup",
      emptyMessage: "No branch code found.",
      rows: bankBranches.map((item, index) => ({
        key: `branch-${item.code}-${index}`,
        code: item.code || "",
        description: item.branch || ""
      }))
    };
  }

  return null;
}

function filterEmployeeCodeLookupRows(rows, search) {
  const query = search.trim().toLowerCase();

  if (!query) {
    return rows;
  }

  return rows.filter((row) =>
    [row.code, row.description].some((value) =>
      String(value || "").toLowerCase().includes(query)
    )
  );
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getActiveFiscalYearRecord() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.PAYROLL_ACTIVE_FISCAL_YEAR || null;
}

function getActiveFiscalYearLabel() {
  const fiscalYear = getActiveFiscalYearRecord();
  return fiscalYear?.name || "Not configured";
}

function getActiveFiscalYearRange() {
  const fiscalYear = getActiveFiscalYearRecord();

  if (!fiscalYear?.startDate || !fiscalYear?.endDate) {
    return null;
  }

  const startDate = new Date(fiscalYear.startDate);
  const endDate = new Date(fiscalYear.endDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  return {
    name: fiscalYear.name || getActiveFiscalYearLabel(),
    startMonth: String(startDate.getMonth() + 1),
    startYear: String(startDate.getFullYear()),
    endMonth: String(endDate.getMonth() + 1),
    endYear: String(endDate.getFullYear())
  };
}

function getFiscalYearRangeFields(fiscalYear) {
  if (!fiscalYear?.startDate || !fiscalYear?.endDate) {
    return null;
  }

  const startDate = new Date(fiscalYear.startDate);
  const endDate = new Date(fiscalYear.endDate);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  return {
    fromMonth: String(startDate.getMonth() + 1),
    fromYear: String(startDate.getFullYear()),
    toMonth: String(endDate.getMonth() + 1),
    toYear: String(endDate.getFullYear())
  };
}

function EmployeeCodeLookupModal({ lookup, search, onSearch, onClose, onSelect }) {
  const [showHelp, setShowHelp] = useState(false);

  if (!lookup) {
    return null;
  }

  const isBranchLookup = lookup.fieldName === "bankBranchCode";
  const filteredRows = filterEmployeeCodeLookupRows(lookup.rows, search);

  return (
    <div className="modal-backdrop soft-modal-backdrop no-print" role="dialog" aria-modal="true" aria-label={lookup.title}>
      <div className="wage-code-lookup-modal">
        <div className="wage-code-lookup-head">
          <div>
            <p>{lookup.eyebrow}</p>
            <h3>{lookup.title}</h3>
          </div>
          <div className="lookup-head-actions">
            {isBranchLookup ? (
              <button
                type="button"
                className="lookup-help-button"
                aria-label="Show bank account and branch code setup steps"
                aria-expanded={showHelp}
                onClick={() => setShowHelp((current) => !current)}
              >
                ?
              </button>
            ) : null}
            <button type="button" onClick={onClose}>Close</button>
          </div>
        </div>
        {isBranchLookup && showHelp ? (
          <aside className="lookup-help-card" aria-label="Bank account setup steps">
            <strong>Where to add bank account details</strong>
            <ol>
              <li>Open Management then Bank Code Making/Edit and add the bank code/name.</li>
              <li>Open Management then Bank Branch Code Making/Edit and add the branch code/name.</li>
              <li>Open New Employee Entry or Employee List edit, select Bank Code and Branch Code, then enter Account No.</li>
              <li>Save the employee. Payroll and bank reports will read the saved bank details from the employee record.</li>
            </ol>
          </aside>
        ) : null}
        <input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search code or description"
          autoFocus
        />
        <div className="wage-code-lookup-table-wrap">
          <table className="wage-code-lookup-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.key}
                  onClick={() => onSelect(row)}
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onSelect(row);
                    }
                  }}
                >
                  <td>{row.code}</td>
                  <td>{row.description || "-"}</td>
                </tr>
              ))}
              {!filteredRows.length ? (
                <tr>
                  <td colSpan="2">{lookup.emptyMessage}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NewEmployeeEntryForm({ onSaved }) {
  const initialForm = Object.fromEntries(
    newEmployeeFields.map((field) => [field.name, field.defaultValue || ""])
  );
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [departmentStatus, setDepartmentStatus] = useState("");
  const [designationStatus, setDesignationStatus] = useState("");
  const [bankStatus, setBankStatus] = useState("");
  const [branchStatus, setBranchStatus] = useState("");
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [accountCodes, setAccountCodes] = useState([]);
  const [banks, setBanks] = useState([]);
  const [bankBranches, setBankBranches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [codeLookup, setCodeLookup] = useState(null);
  const [codeLookupSearch, setCodeLookupSearch] = useState("");

  const employeeCodeLookupSources = {
    departments,
    designations,
    accountCodes,
    banks,
    bankBranches
  };

  const loadNextEmployeeNo = async () => {
    const employeeNo = await getNextEmployeeNo();
    setForm((current) => ({ ...current, employeeNo }));
    return employeeNo;
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    if (name === "departmentCode") {
      const matchedDepartment = findDepartmentByCode(departments, value);

      setDepartmentStatus(
        value.trim() && !matchedDepartment ? "Department code not found." : ""
      );
      setForm((current) => ({
        ...current,
        departmentCode: value,
        department: matchedDepartment ? matchedDepartment.department : ""
      }));
      return;
    }

    if (name === "designationCode") {
      const matchedDesignation = findDesignationByCode(
        [...designations, ...accountCodes],
        value
      );

      setDesignationStatus(
        value.trim() && !matchedDesignation ? "Designation code not found." : ""
      );
      setForm((current) => ({
        ...current,
        designationCode: value,
        designation: matchedDesignation ? matchedDesignation.designation : ""
      }));
      return;
    }

    if (name === "bankCode") {
      const matchedBank = findBankByCode(banks, value);

      setBankStatus(value.trim() && !matchedBank ? "Bank code not found." : "");
      setForm((current) => ({
        ...current,
        bankCode: value,
        bank: matchedBank ? matchedBank.bank : ""
      }));
      return;
    }

    if (name === "bankBranchCode") {
      const matchedBranch = findBankBranchByCode(bankBranches, value);

      setBranchStatus(value.trim() && !matchedBranch ? "Branch code not found." : "");
      setForm((current) => ({
        ...current,
        bankBranchCode: value,
        bankBranch: matchedBranch ? matchedBranch.branch : ""
      }));
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
  };

  const openCodeLookup = (fieldName) => {
    const lookup = getEmployeeCodeLookupConfig(fieldName, employeeCodeLookupSources);

    if (!lookup) {
      return;
    }

    setCodeLookup(lookup);
    setCodeLookupSearch("");
  };

  const handleCodeFieldKeyDown = (event, fieldName) => {
    if (event.key !== "F1" || !employeeCodeLookupFieldNames.has(fieldName)) {
      return;
    }

    event.preventDefault();
    openCodeLookup(fieldName);
  };

  const applyCodeLookupRow = (row) => {
    if (!codeLookup) {
      return;
    }

    updateField({ target: { name: codeLookup.fieldName, value: row.code } });
    setCodeLookup(null);
    setCodeLookupSearch("");
  };

  const handleGenerateEmployeeNo = async () => {
    setStatus({ type: "", message: "" });

    try {
      await loadNextEmployeeNo();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleReset = async () => {
    setForm(initialForm);
    setStatus({ type: "", message: "" });
    setDepartmentStatus("");
    setDesignationStatus("");
    setBankStatus("");
    setBranchStatus("");

    try {
      await loadNextEmployeeNo();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (event.nativeEvent?.submitter?.name !== "saveEmployee") {
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await createEmployee(form);
      setStatus({ type: "success", message: result.message });
      setForm(initialForm);
      await loadNextEmployeeNo();
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    async function loadDepartments() {
      try {
        const [
          departmentRecords,
          designationRecords,
          accountCodeRecords,
          bankRecords,
          branchRecords
        ] = await Promise.all([
          getDepartments(),
          getDesignations(),
          getAccountCodes(),
          getBanks(),
          getBankBranches()
        ]);
        setDepartments(departmentRecords);
        setDesignations(designationRecords);
        setAccountCodes(accountCodeRecords);
        setBanks(bankRecords);
        setBankBranches(branchRecords);
      } catch (error) {
        setDepartmentStatus(error.message);
      }
    }

    loadDepartments();
  }, []);

  useEffect(() => {
    handleGenerateEmployeeNo();
  }, []);

  return (
    <section className="employee-entry-panel" aria-label="New employee entry form">
      <div className="form-title-row">
        <div>
          <p>Transactions</p>
          <h2>New Staff Entry</h2>
        </div>
        <span>Employee registration</span>
      </div>

      <form className="employee-form" onSubmit={handleSubmit} onReset={handleReset}>
        {employeeFormSections.map((section) => (
          <fieldset className="employee-form-section" key={section.title}>
            <legend>{section.title}</legend>
            {section.description ? <p className="employee-form-section-note">{section.description}</p> : null}
            <div className="employee-form-grid">
              {section.fields.map((fieldName) => {
                const field = newEmployeeFieldMap[fieldName];
                if (!field) {
                  return null;
                }

                return (
                  <EmployeeFormField
                    key={field.name}
                    field={field}
                    value={form[field.name]}
                    onChange={updateField}
                    onKeyDown={(event) => handleCodeFieldKeyDown(event, field.name)}
                    onGenerateEmployeeNo={field.name === "employeeNo" ? handleGenerateEmployeeNo : null}
                    required={field.name === "employeeNo" || field.name === "name"}
                  />
                );
              })}
            </div>
          </fieldset>
        ))}

        {departmentStatus ? (
          <p className="form-status neutral">{departmentStatus}</p>
        ) : null}

        {designationStatus ? (
          <p className="form-status neutral">{designationStatus}</p>
        ) : null}

        {bankStatus ? (
          <p className="form-status neutral">{bankStatus}</p>
        ) : null}

        {branchStatus ? (
          <p className="form-status neutral">{branchStatus}</p>
        ) : null}

        {status.message ? (
          <p className={`form-status ${status.type}`}>{status.message}</p>
        ) : null}

        <div className="form-actions">
          <button type="reset">Clear</button>
          <button type="submit" name="saveEmployee" disabled={saving}>
            {saving ? "Saving..." : "Save Employee"}
          </button>
        </div>
      </form>

      <EmployeeCodeLookupModal
        lookup={codeLookup}
        search={codeLookupSearch}
        onSearch={setCodeLookupSearch}
        onClose={() => setCodeLookup(null)}
        onSelect={applyCodeLookupRow}
      />
    </section>
  );
}

function EmployeeBasicDataInquiry({ onAddEmployee }) {
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "Loading employees..." });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [accountCodes, setAccountCodes] = useState([]);
  const [banks, setBanks] = useState([]);
  const [bankBranches, setBankBranches] = useState([]);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [pendingDeleteEmployee, setPendingDeleteEmployee] = useState(null);
  const [editCodeLookup, setEditCodeLookup] = useState(null);
  const [editCodeLookupSearch, setEditCodeLookupSearch] = useState("");

  const employeeCodeLookupSources = {
    departments,
    designations,
    accountCodes,
    banks,
    bankBranches
  };

  const searchableEmployees = employees.filter((employee) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return Object.values(employee).some((value) =>
      String(value || "").toLowerCase().includes(query)
    );
  });
  const displayedEmployees =
    quickFilter === "bps"
      ? [...searchableEmployees].sort((first, second) => {
          const firstBps = Number(first.bps) || 0;
          const secondBps = Number(second.bps) || 0;
          return firstBps - secondBps || String(first.name).localeCompare(String(second.name));
        })
      : searchableEmployees;
  const selectedEmployees = employees.filter((employee) =>
    selectedEmployeeIds.includes(employee.id)
  );

  const loadEmployees = async () => {
    setLoading(true);
    setStatus({ type: "", message: "Loading employees..." });

    try {
      const [
        records,
        departmentRecords,
        designationRecords,
        accountCodeRecords,
        bankRecords,
        branchRecords
      ] = await Promise.all([
        getEmployees(),
        getDepartments(),
        getDesignations(),
        getAccountCodes(),
        getBanks(),
        getBankBranches()
      ]);
      setEmployees(records);
      setDepartments(departmentRecords);
      setDesignations(designationRecords);
      setAccountCodes(accountCodeRecords);
      setBanks(bankRecords);
      setBankBranches(branchRecords);
      setSelectedEmployeeIds((current) =>
        current.filter((id) => records.some((employee) => employee.id === id))
      );
      setStatus({
        type: "success",
        message: records.length ? `${records.length} employee record(s) found.` : "No employee records found."
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployeeIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId]
    );
  };

  const toggleAllDisplayed = () => {
    const displayedIds = displayedEmployees.map((employee) => employee.id);
    const allDisplayedSelected = displayedIds.every((id) => selectedEmployeeIds.includes(id));

    setSelectedEmployeeIds((current) => {
      if (allDisplayedSelected) {
        return current.filter((id) => !displayedIds.includes(id));
      }

      return Array.from(new Set([...current, ...displayedIds]));
    });
  };

  const formatEmployeeStatusDate = (value) => {
    if (!value) {
      return "";
    }

    const [year, month, day] = String(value).slice(0, 10).split("-");

    if (!year || !month || !day) {
      return String(value);
    }

    return `${day}/${month}/${year}`;
  };

  const getEmployeeListStatus = (employee) => {
    if (employee.stopDate && employee.stopDate <= new Date().toISOString().slice(0, 10)) {
      return {
        label: `Stop: ${formatEmployeeStatusDate(employee.stopDate)}`,
        tone: "stopped"
      };
    }

    const status = String(employee.status || "active").toLowerCase();

    return {
      label: status === "inactive" ? "Inactive" : "Active",
      tone: status === "inactive" ? "inactive" : "active"
    };
  };

  const printSelectedEmployees = () => {
    if (!selectedEmployees.length) {
      setStatus({ type: "error", message: "Please select at least one employee to print." });
      return;
    }

    const rows = selectedEmployees
      .map(
        (employee) => `
          <tr>
            <td>${employee.employeeNo || ""}</td>
            <td>${employee.name || ""}</td>
            <td>${employee.fatherName || ""}</td>
            <td>${employee.email || ""}</td>
            <td>${employee.contactNo || ""}</td>
            <td>${employee.cnicNo || ""}</td>
            <td>${employee.designation || ""}</td>
            <td>${employee.department || ""}</td>
            <td>${employee.bps || ""}</td>
            <td>${employee.placeOfPosting || ""}</td>
            <td>${getEmployeeListStatus(employee).label}</td>
          </tr>
        `
      )
      .join("");
    const printWindow = window.open("", "_blank", "width=1100,height=700");

    exportRowsToExcel(
      selectedEmployees.map((employee) => ({
        "Employee No.": employee.employeeNo || "",
        Name: employee.name || "",
        "Father Name": employee.fatherName || "",
        Email: employee.email || "",
        "Contact No.": employee.contactNo || "",
        "CNIC No.": employee.cnicNo || "",
        Designation: employee.designation || "",
        Department: employee.department || "",
        BPS: employee.bps || "",
        "Place Of Posting": employee.placeOfPosting || "",
        Status: getEmployeeListStatus(employee).label
      })),
      `${quickFilter === "bps" ? "bps-wise-staff-list" : "all-staff-list"}.xlsx`
    );

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Staff List</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #102a2f; }
            h1 { margin: 0 0 18px; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #b9c9c7; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #123438; color: #fff; }
          </style>
        </head>
        <body>
          <h1>${quickFilter === "bps" ? "BPS Wise Staff List" : "All Staff List"}</h1>
          <table>
            <thead>
              <tr>
                <th>Employee No.</th>
                <th>Name</th>
                <th>Father Name</th>
                <th>Email</th>
                <th>Contact No.</th>
                <th>CNIC No.</th>
                <th>Designation</th>
                <th>Department</th>
                <th>BPS</th>
                <th>Place Of Posting</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const startEdit = (employee) => {
    const formData = {
      ...Object.fromEntries(
        newEmployeeFields.map((field) => [field.name, employee[field.name] || ""])
      ),
      status: employee.status || "active"
    };

    setEditingEmployee(employee);
    setEditForm(formData);
    setStatus({ type: "", message: "" });
  };

  const cancelEdit = () => {
    setEditingEmployee(null);
    setEditForm(null);
    setEditCodeLookup(null);
    setEditCodeLookupSearch("");
  };

  const updateEditField = (event) => {
    const { name, value } = event.target;

    if (name === "departmentCode") {
      const matchedDepartment = findDepartmentByCode(departments, value);

      setEditForm((current) => ({
        ...current,
        departmentCode: value,
        department: matchedDepartment ? matchedDepartment.department : ""
      }));
      return;
    }

    if (name === "designationCode") {
      const matchedDesignation = findDesignationByCode(
        [...designations, ...accountCodes],
        value
      );

      setEditForm((current) => ({
        ...current,
        designationCode: value,
        designation: matchedDesignation ? matchedDesignation.designation : ""
      }));
      return;
    }

    if (name === "bankCode") {
      const matchedBank = findBankByCode(banks, value);

      setEditForm((current) => ({
        ...current,
        bankCode: value,
        bank: matchedBank ? matchedBank.bank : ""
      }));
      return;
    }

    if (name === "bankBranchCode") {
      const matchedBranch = findBankBranchByCode(bankBranches, value);

      setEditForm((current) => ({
        ...current,
        bankBranchCode: value,
        bankBranch: matchedBranch ? matchedBranch.branch : ""
      }));
      return;
    }

    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const updateEditPayStatus = (nextStatus) => {
    setEditForm((current) => ({
      ...current,
      status: nextStatus,
      stopDate: nextStatus === "active" ? "" : current.stopDate || todayIsoDate()
    }));
  };

  const openEditCodeLookup = (fieldName) => {
    const lookup = getEmployeeCodeLookupConfig(fieldName, employeeCodeLookupSources);

    if (!lookup) {
      return;
    }

    setEditCodeLookup(lookup);
    setEditCodeLookupSearch("");
  };

  const handleEditCodeFieldKeyDown = (event, fieldName) => {
    if (event.key !== "F1" || !employeeCodeLookupFieldNames.has(fieldName)) {
      return;
    }

    event.preventDefault();
    openEditCodeLookup(fieldName);
  };

  const applyEditCodeLookupRow = (row) => {
    if (!editCodeLookup) {
      return;
    }

    updateEditField({ target: { name: editCodeLookup.fieldName, value: row.code } });
    setEditCodeLookup(null);
    setEditCodeLookupSearch("");
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setSavingEdit(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await updateEmployee(editingEmployee.id, editForm);
      if (result.employee) {
        setEmployees((current) =>
          current.map((employee) =>
            employee.id === result.employee.id ? result.employee : employee
          )
        );
      }
      cancelEdit();
      await loadEmployees();
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteEmployee = async () => {
    if (!pendingDeleteEmployee) {
      return;
    }

    setStatus({ type: "", message: "" });

    try {
      const result = await deleteEmployee(pendingDeleteEmployee.id);
      setStatus({ type: "success", message: result.message });
      setPendingDeleteEmployee(null);
      await loadEmployees();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  return (
    <section className="employee-entry-panel" aria-label="Employee list">
      <div className="form-title-row">
        <div>
          <p>Transactions</p>
          <h2>Employee List</h2>
        </div>
        <button className="refresh-button" type="button" onClick={onAddEmployee}>
          New Add Employee
        </button>
      </div>

      <div className="table-toolbar">
        <label>
          <span>Search Employee</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by name, employee no, email, CNIC, department..."
          />
        </label>
        <label>
          <span>Quick Filter</span>
          <select value={quickFilter} onChange={(event) => setQuickFilter(event.target.value)}>
            <option value="all">All Staff List</option>
            <option value="bps">BPS Wise Staff List</option>
          </select>
        </label>
        <button className="print-button" type="button" onClick={printSelectedEmployees}>
          Print Selected ({selectedEmployeeIds.length})
        </button>
      </div>

      {status.message ? (
        <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p>
      ) : null}

      {editingEmployee && editForm ? (
        <form className="employee-form edit-form" onSubmit={saveEdit}>
          <div className="edit-form-title">
            <h3>Edit Employee Information</h3>
            <button type="button" onClick={cancelEdit}>Close</button>
          </div>
          {employeeFormSections.map((section) => (
            <fieldset className="employee-form-section" key={section.title}>
              <legend>{section.title}</legend>
              {section.description ? <p className="employee-form-section-note">{section.description}</p> : null}
              <div className="employee-form-grid">
                {section.fields.map((fieldName) => {
                  const field = newEmployeeFieldMap[fieldName];
                  if (!field) {
                    return null;
                  }

                  return (
                    <EmployeeFormField
                      key={field.name}
                      field={field}
                      value={editForm[field.name]}
                      onChange={updateEditField}
                      onKeyDown={(event) => handleEditCodeFieldKeyDown(event, field.name)}
                      required={field.name === "employeeNo" || field.name === "name"}
                      className={field.name === "stopDate" ? "stop-date-pay-field" : ""}
                    >
                      {field.name === "stopDate" ? (
                        <fieldset className="pay-status-toggle">
                          <legend>Pay Status</legend>
                          <label>
                            <input
                              type="radio"
                              name="payStatus"
                              value="active"
                              checked={(editForm.status || "active") === "active"}
                              onChange={() => updateEditPayStatus("active")}
                            />
                            <span>Pay Active</span>
                          </label>
                          <label>
                            <input
                              type="radio"
                              name="payStatus"
                              value="inactive"
                              checked={(editForm.status || "active") === "inactive"}
                              onChange={() => updateEditPayStatus("inactive")}
                            />
                            <span>Pay Stop</span>
                          </label>
                        </fieldset>
                      ) : null}
                    </EmployeeFormField>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <div className="form-actions">
            <button type="button" onClick={cancelEdit}>Cancel</button>
            <button type="submit" disabled={savingEdit}>
              {savingEdit ? "Updating..." : "Update Employee"}
            </button>
          </div>
        </form>
      ) : null}

      <EmployeeCodeLookupModal
        lookup={editCodeLookup}
        search={editCodeLookupSearch}
        onSearch={setEditCodeLookupSearch}
        onClose={() => setEditCodeLookup(null)}
        onSelect={applyEditCodeLookupRow}
      />

      <div className="table-wrap">
        <table className="employee-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={
                    displayedEmployees.length > 0 &&
                    displayedEmployees.every((employee) =>
                      selectedEmployeeIds.includes(employee.id)
                    )
                  }
                  onChange={toggleAllDisplayed}
                  aria-label="Select all displayed employees"
                />
              </th>
              <th>Employee No.</th>
              <th>Name</th>
              <th>Father Name</th>
              <th>Email</th>
              <th>Contact No.</th>
              <th>CNIC No.</th>
              <th>Designation</th>
              <th>Department</th>
              <th>BPS</th>
              <th>Place Of Posting</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedEmployees.map((employee) => {
              const employeeStatus = getEmployeeListStatus(employee);

              return (
                <tr key={employee.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedEmployeeIds.includes(employee.id)}
                      onChange={() => toggleEmployeeSelection(employee.id)}
                      aria-label={`Select ${employee.name}`}
                    />
                  </td>
                  <td>{employee.employeeNo}</td>
                  <td>{employee.name}</td>
                  <td>{employee.fatherName || "-"}</td>
                  <td>{employee.email || "-"}</td>
                  <td>{employee.contactNo || "-"}</td>
                  <td>{employee.cnicNo || "-"}</td>
                  <td>{employee.designation || "-"}</td>
                  <td>{employee.department || "-"}</td>
                  <td>{employee.bps || "-"}</td>
                  <td>{employee.placeOfPosting || "-"}</td>
                  <td>
                    <span className={`employee-status-pill ${employeeStatus.tone}`}>
                      {employeeStatus.label}
                    </span>
                  </td>
                  <td>
                    <select
                      className="employee-action-select"
                      value=""
                      aria-label={`Actions for employee ${employee.employeeNo}`}
                      onChange={(event) => {
                        if (event.target.value === "edit") {
                          startEdit(employee);
                        }

                        if (event.target.value === "delete") {
                          setPendingDeleteEmployee(employee);
                        }
                      }}
                    >
                      <option value="">Action</option>
                      <option value="edit">Edit</option>
                      <option value="delete">Delete</option>
                    </select>
                  </td>
                </tr>
              );
            })}

            {!displayedEmployees.length && !loading ? (
              <tr>
                <td colSpan="13">No matching employees found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pendingDeleteEmployee ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Delete confirmation">
          <div className="delete-modal">
            <img src="/logo.png" alt="Wazirabad Cardiology Hospital" />
            <div>
              <p>Wazirabad Cardiology Hospital</p>
              <h3>Do you want to delete this entry?</h3>
              <span>
                {pendingDeleteEmployee.employeeNo} - {pendingDeleteEmployee.name}
              </span>
            </div>
            <div className="delete-modal-actions">
              <button type="button" onClick={() => setPendingDeleteEmployee(null)}>
                Cancel
              </button>
              <button type="button" onClick={confirmDeleteEmployee}>
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DepartmentCodeManagement() {
  const emptyDepartmentForm = { code: "", department: "" };
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyDepartmentForm);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "Loading department codes..." });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDepartments = async () => {
    setLoading(true);
    setStatus({ type: "", message: "Loading department codes..." });

    try {
      const records = await getDepartments();
      setDepartments(records);
      setStatus({
        type: "success",
        message: records.length ? `${records.length} department code(s) found.` : "No department codes found."
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyDepartmentForm);
    setEditingDepartment(null);
  };

  const saveDepartment = async (event) => {
    event.preventDefault();

    const cleanCode = form.code.trim().toLowerCase();
    const duplicateDepartment = departments.find(
      (department) =>
        department.code.trim().toLowerCase() === cleanCode &&
        department.id !== editingDepartment?.id
    );

    if (duplicateDepartment) {
      setStatus({ type: "error", message: "Duplicate entry of department code." });
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const payload = {
        code: form.code.trim(),
        department: form.department.trim()
      };
      const result = editingDepartment
        ? await updateDepartment(editingDepartment.id, payload)
        : await createDepartment(payload);

      setStatus({ type: "success", message: result.message });
      resetForm();
      await loadDepartments();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (department) => {
    setEditingDepartment(department);
    setForm({ code: department.code, department: department.department });
    setStatus({ type: "", message: "" });
  };

  const removeDepartment = async (department) => {
    const shouldDelete = window.confirm(
      `Delete department code ${department.code} - ${department.department}?`
    );

    if (!shouldDelete) {
      return;
    }

    setStatus({ type: "", message: "" });

    try {
      const result = await deleteDepartment(department.id);
      setStatus({ type: "success", message: result.message });
      if (editingDepartment?.id === department.id) {
        resetForm();
      }
      await loadDepartments();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  return (
    <section className="employee-entry-panel" aria-label="Department code making edit">
      <div className="form-title-row">
        <div>
          <p>Management</p>
          <h2>Department Code Making/Edit</h2>
        </div>
        <span>{editingDepartment ? "Editing code" : "New code"}</span>
      </div>

      <form className="department-code-form" onSubmit={saveDepartment}>
        <label>
          <span>Department Code</span>
          <input
            name="code"
            type="text"
            value={form.code}
            onChange={updateField}
            placeholder="Enter code"
            required
          />
        </label>
        <label>
          <span>Department Name</span>
          <input
            name="department"
            type="text"
            value={form.department}
            onChange={updateField}
            placeholder="Enter department"
            required
          />
        </label>
        <div className="department-form-actions">
          <button type="button" onClick={resetForm}>Clear</button>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingDepartment ? "Update Department" : "Save Department"}
          </button>
        </div>
      </form>

      {status.message ? (
        <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p>
      ) : null}

      <div className="table-wrap">
        <table className="department-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((department) => (
              <tr key={department.id}>
                <td>{department.code}</td>
                <td>{department.department}</td>
                <td>
                  <select
                    className="account-action-select"
                    value=""
                    aria-label={`Actions for department code ${department.code}`}
                    onChange={(event) => {
                      if (event.target.value === "edit") {
                        startEdit(department);
                      }

                      if (event.target.value === "delete") {
                        removeDepartment(department);
                      }
                    }}
                  >
                    <option value="">Action</option>
                    <option value="edit">Edit</option>
                    <option value="delete">Delete</option>
                  </select>
                </td>
              </tr>
            ))}

            {!departments.length && !loading ? (
              <tr>
                <td colSpan="3">No department codes found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DesignationCodeManagement() {
  const emptyDesignationForm = { code: "", designation: "" };
  const [designations, setDesignations] = useState([]);
  const [form, setForm] = useState(emptyDesignationForm);
  const [editingDesignation, setEditingDesignation] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "Loading designation codes..." });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDesignations = async () => {
    setLoading(true);
    setStatus({ type: "", message: "Loading designation codes..." });

    try {
      const records = await getDesignations();
      setDesignations(records);
      setStatus({
        type: "success",
        message: records.length ? `${records.length} designation code(s) found.` : "No designation codes found."
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyDesignationForm);
    setEditingDesignation(null);
  };

  const saveDesignation = async (event) => {
    event.preventDefault();

    const cleanCode = form.code.trim().toLowerCase();
    const duplicateDesignation = designations.find(
      (designation) =>
        designation.code.trim().toLowerCase() === cleanCode &&
        designation.id !== editingDesignation?.id
    );

    if (duplicateDesignation) {
      setStatus({ type: "error", message: "Duplicate entry of designation code." });
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const payload = {
        code: form.code.trim(),
        designation: form.designation.trim()
      };
      const result = editingDesignation
        ? await updateDesignation(editingDesignation.id, payload)
        : await createDesignation(payload);

      setStatus({ type: "success", message: result.message });
      resetForm();
      await loadDesignations();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (designation) => {
    setEditingDesignation(designation);
    setForm({ code: designation.code, designation: designation.designation });
    setStatus({ type: "", message: "" });
  };

  const removeDesignation = async (designation) => {
    const shouldDelete = window.confirm(
      `Delete designation code ${designation.code} - ${designation.designation}?`
    );

    if (!shouldDelete) {
      return;
    }

    setStatus({ type: "", message: "" });

    try {
      const result = await deleteDesignation(designation.id);
      setStatus({ type: "success", message: result.message });
      if (editingDesignation?.id === designation.id) {
        resetForm();
      }
      await loadDesignations();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    loadDesignations();
  }, []);

  return (
    <section className="employee-entry-panel" aria-label="Designation code making edit">
      <div className="form-title-row">
        <div>
          <p>Management</p>
          <h2>Designation Code Making/Edit</h2>
        </div>
        <span>{editingDesignation ? "Editing code" : "New code"}</span>
      </div>

      <form className="department-code-form" onSubmit={saveDesignation}>
        <label>
          <span>Designation Code</span>
          <input
            name="code"
            type="text"
            value={form.code}
            onChange={updateField}
            placeholder="Enter code"
            required
          />
        </label>
        <label>
          <span>Designation Name</span>
          <input
            name="designation"
            type="text"
            value={form.designation}
            onChange={updateField}
            placeholder="Enter designation"
            required
          />
        </label>
        <div className="department-form-actions">
          <button type="button" onClick={resetForm}>Clear</button>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingDesignation ? "Update Designation" : "Save Designation"}
          </button>
        </div>
      </form>

      {status.message ? (
        <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p>
      ) : null}

      <div className="table-wrap">
        <table className="department-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Designation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {designations.map((designation) => (
              <tr key={designation.id}>
                <td>{designation.code}</td>
                <td>{designation.designation}</td>
                <td>
                  <select
                    className="account-action-select"
                    value=""
                    aria-label={`Actions for designation code ${designation.code}`}
                    onChange={(event) => {
                      if (event.target.value === "edit") {
                        startEdit(designation);
                      }

                      if (event.target.value === "delete") {
                        removeDesignation(designation);
                      }
                    }}
                  >
                    <option value="">Action</option>
                    <option value="edit">Edit</option>
                    <option value="delete">Delete</option>
                  </select>
                </td>
              </tr>
            ))}

            {!designations.length && !loading ? (
              <tr>
                <td colSpan="3">No designation codes found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BankCodeManagement() {
  const emptyBankForm = { code: "", bank: "" };
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState(emptyBankForm);
  const [editingBank, setEditingBank] = useState(null);
  const [bankSearchTerm, setBankSearchTerm] = useState("");
  const [status, setStatus] = useState({ type: "", message: "Loading bank codes..." });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const normalizedBankSearch = bankSearchTerm.trim().toLowerCase();
  const displayedBanks = normalizedBankSearch
    ? banks.filter((bank) =>
        [bank.code, bank.bank].some((value) => String(value || "").toLowerCase().includes(normalizedBankSearch))
      )
    : banks;

  const loadBanks = async () => {
    setLoading(true);
    setStatus({ type: "", message: "Loading bank codes..." });

    try {
      const records = await getBanks();
      setBanks(records);
      setStatus({
        type: "success",
        message: records.length ? `${records.length} bank code(s) found.` : "No bank codes found."
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyBankForm);
    setEditingBank(null);
  };

  const saveBank = async (event) => {
    event.preventDefault();
    const cleanCode = form.code.trim().toLowerCase();
    const duplicateBank = banks.find(
      (bank) => bank.code.trim().toLowerCase() === cleanCode && bank.id !== editingBank?.id
    );

    if (duplicateBank) {
      setStatus({ type: "error", message: "Duplicate entry of bank code." });
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const payload = { code: form.code.trim(), bank: form.bank.trim() };
      const result = editingBank
        ? await updateBank(editingBank.id, payload)
        : await createBank(payload);
      setStatus({ type: "success", message: result.message });
      resetForm();
      await loadBanks();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const removeBank = async (bank) => {
    if (!window.confirm(`Delete bank code ${bank.code} - ${bank.bank}?`)) {
      return;
    }

    try {
      const result = await deleteBank(bank.id);
      setStatus({ type: "success", message: result.message });
      if (editingBank?.id === bank.id) {
        resetForm();
      }
      await loadBanks();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    loadBanks();
  }, []);

  return (
    <section className="employee-entry-panel" aria-label="Bank code making edit">
      <div className="form-title-row">
        <div>
          <p>Management</p>
          <h2>Bank Code Making/Edit</h2>
        </div>
        <span>{editingBank ? "Editing code" : "New code"}</span>
      </div>

      <form className="department-code-form" onSubmit={saveBank}>
        <label>
          <span>Bank Code</span>
          <input
            name="code"
            type="text"
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            placeholder="Enter code"
            required
          />
        </label>
        <label>
          <span>Bank Name</span>
          <input
            name="bank"
            type="text"
            value={form.bank}
            onChange={(event) => setForm((current) => ({ ...current, bank: event.target.value }))}
            placeholder="Enter bank"
            required
          />
        </label>
        <div className="department-form-actions">
          <button type="button" onClick={resetForm}>Clear</button>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingBank ? "Update Bank" : "Save Bank"}
          </button>
        </div>
      </form>

      {status.message ? (
        <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p>
      ) : null}

      <div className="account-code-search-row">
        <label>
          <span>Search Bank Code</span>
          <input
            type="search"
            value={bankSearchTerm}
            onChange={(event) => setBankSearchTerm(event.target.value)}
            placeholder="Search by code or bank name"
          />
        </label>
        <span>
          {displayedBanks.length} of {banks.length} shown
        </span>
      </div>

      <div className="table-wrap">
        <table className="department-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Bank</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedBanks.map((bank) => (
              <tr key={bank.id}>
                <td>{bank.code}</td>
                <td>{bank.bank}</td>
                <td>
                  <select
                    className="account-action-select"
                    value=""
                    aria-label={`Actions for bank code ${bank.code}`}
                    onChange={(event) => {
                      if (event.target.value === "edit") {
                        setEditingBank(bank);
                        setForm({ code: bank.code, bank: bank.bank });
                        setStatus({ type: "", message: "" });
                      }

                      if (event.target.value === "delete") {
                        removeBank(bank);
                      }
                    }}
                  >
                    <option value="">Action</option>
                    <option value="edit">Edit</option>
                    <option value="delete">Delete</option>
                  </select>
                </td>
              </tr>
            ))}

            {!displayedBanks.length && !loading ? (
              <tr>
                <td colSpan="3">{bankSearchTerm ? "No matching bank codes found." : "No bank codes found."}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BankBranchCodeManagement() {
  const emptyBranchForm = { code: "", branch: "" };
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState(emptyBranchForm);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchSearchTerm, setBranchSearchTerm] = useState("");
  const [status, setStatus] = useState({ type: "", message: "Loading bank branch codes..." });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const normalizedBranchSearch = branchSearchTerm.trim().toLowerCase();
  const displayedBranches = normalizedBranchSearch
    ? branches.filter((branch) =>
        [branch.code, branch.branch].some((value) => String(value || "").toLowerCase().includes(normalizedBranchSearch))
      )
    : branches;

  const loadBranches = async () => {
    setLoading(true);
    setStatus({ type: "", message: "Loading bank branch codes..." });

    try {
      const records = await getBankBranches();
      setBranches(records);
      setStatus({
        type: "success",
        message: records.length ? `${records.length} branch code(s) found.` : "No branch codes found."
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyBranchForm);
    setEditingBranch(null);
  };

  const saveBranch = async (event) => {
    event.preventDefault();
    const cleanCode = form.code.trim().toLowerCase();
    const duplicateBranch = branches.find(
      (branch) => branch.code.trim().toLowerCase() === cleanCode && branch.id !== editingBranch?.id
    );

    if (duplicateBranch) {
      setStatus({ type: "error", message: "Duplicate entry of branch code." });
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const payload = { code: form.code.trim(), branch: form.branch.trim() };
      const result = editingBranch
        ? await updateBankBranch(editingBranch.id, payload)
        : await createBankBranch(payload);
      setStatus({ type: "success", message: result.message });
      resetForm();
      await loadBranches();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const removeBranch = async (branch) => {
    if (!window.confirm(`Delete branch code ${branch.code} - ${branch.branch}?`)) {
      return;
    }

    try {
      const result = await deleteBankBranch(branch.id);
      setStatus({ type: "success", message: result.message });
      if (editingBranch?.id === branch.id) {
        resetForm();
      }
      await loadBranches();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  return (
    <section className="employee-entry-panel" aria-label="Bank branch code making edit">
      <div className="form-title-row">
        <div>
          <p>Management</p>
          <h2>Bank Branch Code Making/Edit</h2>
        </div>
        <span>{editingBranch ? "Editing code" : "New code"}</span>
      </div>

      <form className="department-code-form" onSubmit={saveBranch}>
        <label>
          <span>Branch Code</span>
          <input
            name="code"
            type="text"
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            placeholder="Enter code"
            required
          />
        </label>
        <label>
          <span>Branch Name</span>
          <input
            name="branch"
            type="text"
            value={form.branch}
            onChange={(event) => setForm((current) => ({ ...current, branch: event.target.value }))}
            placeholder="Enter branch"
            required
          />
        </label>
        <div className="department-form-actions">
          <button type="button" onClick={resetForm}>Clear</button>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingBranch ? "Update Branch" : "Save Branch"}
          </button>
        </div>
      </form>

      {status.message ? (
        <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p>
      ) : null}

      <div className="account-code-search-row">
        <label>
          <span>Search Branch Code</span>
          <input
            type="search"
            value={branchSearchTerm}
            onChange={(event) => setBranchSearchTerm(event.target.value)}
            placeholder="Search by code or branch name"
          />
        </label>
        <span>
          {displayedBranches.length} of {branches.length} shown
        </span>
      </div>

      <div className="table-wrap">
        <table className="department-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Branch</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedBranches.map((branch) => (
              <tr key={branch.id}>
                <td>{branch.code}</td>
                <td>{branch.branch}</td>
                <td>
                  <select
                    className="account-action-select"
                    value=""
                    aria-label={`Actions for branch code ${branch.code}`}
                    onChange={(event) => {
                      if (event.target.value === "edit") {
                        setEditingBranch(branch);
                        setForm({ code: branch.code, branch: branch.branch });
                        setStatus({ type: "", message: "" });
                      }

                      if (event.target.value === "delete") {
                        removeBranch(branch);
                      }
                    }}
                  >
                    <option value="">Action</option>
                    <option value="edit">Edit</option>
                    <option value="delete">Delete</option>
                  </select>
                </td>
              </tr>
            ))}

            {!displayedBranches.length && !loading ? (
              <tr>
                <td colSpan="3">{branchSearchTerm ? "No matching branch codes found." : "No branch codes found."}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AccountCodeManagement() {
  const emptyAccountForm = { code: "", designation: "" };
  const [accountCodes, setAccountCodes] = useState([]);
  const [form, setForm] = useState(emptyAccountForm);
  const [editingAccountCode, setEditingAccountCode] = useState(null);
  const [accountSearchTerm, setAccountSearchTerm] = useState("");
  const [status, setStatus] = useState({ type: "", message: "Loading account codes..." });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const normalizedAccountSearch = accountSearchTerm.trim().toLowerCase();
  const displayedAccountCodes = normalizedAccountSearch
    ? accountCodes.filter((accountCode) =>
        [accountCode.code, accountCode.designation]
          .some((value) => String(value || "").toLowerCase().includes(normalizedAccountSearch))
      )
    : accountCodes;

  const loadAccountCodes = async () => {
    setLoading(true);
    setStatus({ type: "", message: "Loading account codes..." });

    try {
      const records = await getAccountCodes();
      setAccountCodes(records);
      setStatus({
        type: "success",
        message: records.length ? `${records.length} account code(s) loaded.` : "No account codes found."
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyAccountForm);
    setEditingAccountCode(null);
  };

  const saveAccountCode = async (event) => {
    event.preventDefault();

    const cleanCode = form.code.trim().toLowerCase();
    const duplicateAccountCode = accountCodes.find(
      (accountCode) =>
        accountCode.code.trim().toLowerCase() === cleanCode &&
        accountCode.id !== editingAccountCode?.id
    );

    if (duplicateAccountCode) {
      setStatus({ type: "error", message: "Duplicate entry of account code." });
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const payload = {
        code: form.code.trim(),
        designation: form.designation.trim()
      };
      const result = editingAccountCode
        ? await updateAccountCode(editingAccountCode.id, payload)
        : await createAccountCode(payload);

      setStatus({ type: "success", message: result.message });
      resetForm();
      await loadAccountCodes();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const removeAccountCode = async (accountCode) => {
    if (!window.confirm(`Delete account code ${accountCode.code} - ${accountCode.designation}?`)) {
      return;
    }

    try {
      const result = await deleteAccountCode(accountCode.id);
      setStatus({ type: "success", message: result.message });
      if (editingAccountCode?.id === accountCode.id) {
        resetForm();
      }
      await loadAccountCodes();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    loadAccountCodes();
  }, []);

  return (
    <section className="employee-entry-panel" aria-label="Account code making edit">
      <div className="form-title-row">
        <div>
          <p>Management</p>
          <h2>Accounts Code Making</h2>
        </div>
        <span>{editingAccountCode ? "Editing code" : "New code"}</span>
      </div>

      <form className="department-code-form" onSubmit={saveAccountCode}>
        <label>
          <span>Account Code</span>
          <input
            name="code"
            type="text"
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
            placeholder="Enter code"
            required
          />
        </label>
        <label>
          <span>Designation Name</span>
          <input
            name="designation"
            type="text"
            value={form.designation}
            onChange={(event) => setForm((current) => ({ ...current, designation: event.target.value }))}
            placeholder="Doctor, Account Officer..."
            required
          />
        </label>
        <div className="department-form-actions">
          <button type="button" onClick={resetForm}>Clear</button>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingAccountCode ? "Update Account Code" : "Save Account Code"}
          </button>
        </div>
      </form>

      {status.message ? (
        <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p>
      ) : null}

      <div className="account-code-search-row">
        <label>
          <span>Search Account Code</span>
          <input
            type="search"
            value={accountSearchTerm}
            onChange={(event) => setAccountSearchTerm(event.target.value)}
            placeholder="Search by code or name"
          />
        </label>
        <span>
          {displayedAccountCodes.length} of {accountCodes.length} shown
        </span>
      </div>

      <div className="table-wrap">
        <table className="department-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Designation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedAccountCodes.map((accountCode) => (
              <tr key={accountCode.id}>
                <td>{accountCode.code}</td>
                <td>{accountCode.designation}</td>
                <td>
                  <select
                    className="account-action-select"
                    value=""
                    aria-label={`Actions for account code ${accountCode.code}`}
                    onChange={(event) => {
                      if (event.target.value === "edit") {
                        setEditingAccountCode(accountCode);
                        setForm({ code: accountCode.code, designation: accountCode.designation });
                        setStatus({ type: "", message: "" });
                      }

                      if (event.target.value === "delete") {
                        removeAccountCode(accountCode);
                      }
                    }}
                  >
                    <option value="">Action</option>
                    <option value="edit">Edit</option>
                    <option value="delete">Delete</option>
                  </select>
                </td>
              </tr>
            ))}

            {!displayedAccountCodes.length && !loading ? (
              <tr>
                <td colSpan="3">{accountSearchTerm ? "No matching account codes found." : "No account codes found."}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const wageCategoryRanges = [
  { min: 1, max: 999, category: "Pay Codes", label: "0001-0999 Pay" },
  { min: 1001, max: 1999, category: "Allowance Codes", label: "1001-1999 Allowances" },
  {
    min: 2001,
    max: 2999,
    category: "Pay & Allowance Adjustment Codes",
    label: "2001-2999 Pay/Allow Adjustment"
  },
  {
    min: 4001,
    max: 4999,
    category: "Deduction Codes (Public Fund)",
    label: "4001-4999 Deduction (Public Fund)"
  },
  {
    min: 5001,
    max: 5999,
    category: "Deduction Codes (Other)",
    label: "5001-5999 Deduction (Other)"
  },
  {
    min: 6001,
    max: 6999,
    category: "Deduction Adjustment Codes",
    label: "6001-6999 Deduction Adjustment"
  }
];

function deriveWageCategory(code) {
  if (!/^\d{4}$/.test(code)) {
    return "";
  }

  const numericCode = Number(code);
  return wageCategoryRanges.find((range) => numericCode >= range.min && numericCode <= range.max)?.category || "";
}

function WageCodeMaster() {
  const emptyWageForm = { code: "", description: "", attachedAccountCode: "" };
  const [wageCodes, setWageCodes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(emptyWageForm);
  const [editingCode, setEditingCode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "code", direction: "asc" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", message: "Loading wage codes..." });
  const [toast, setToast] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const derivedCategory = deriveWageCategory(form.code);
  const isEditMode = Boolean(editingCode);

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast({ type: "", message: "" }), 2600);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!/^\d{4}$/.test(form.code)) {
      nextErrors.code = "Wage code must be 4 digits.";
    } else if (!derivedCategory) {
      nextErrors.code = "Code is outside allowed payroll ranges.";
    }

    if (!form.description.trim()) {
      nextErrors.description = "Description is required.";
    }

    setErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  };

  const loadWageCodes = async () => {
    try {
      const records = await getWageCodes({ search: searchTerm, category: categoryFilter });
      setWageCodes(records);
      setStatus({
        type: "success",
        message: records.length ? `${records.length} wage code(s) found.` : "No wage codes found."
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      showToast("error", error.message);
    }
  };

  const loadAccounts = async () => {
    try {
      setAccounts(await getChartOfAccounts());
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const updateForm = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "code" ? value.replace(/\D/g, "").slice(0, 4) : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const normalizeCode = () => {
    if (form.code && /^\d+$/.test(form.code)) {
      setForm((current) => ({ ...current, code: String(Number(current.code)).padStart(4, "0") }));
    }
  };

  const resetForm = () => {
    setForm(emptyWageForm);
    setEditingCode("");
    setErrors({});
  };

  const saveWageCode = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      showToast("error", "Please fix the highlighted fields.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        description: form.description.trim(),
        attachedAccountCode: form.attachedAccountCode || null
      };
      const result = isEditMode
        ? await updateWageCode(editingCode, payload)
        : await createWageCode({ ...payload, code: form.code });

      showToast("success", result.message);
      resetForm();
      await loadWageCodes();
    } catch (error) {
      showToast("error", error.message);
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (wageCode) => {
    setEditingCode(wageCode.code);
    setForm({
      code: wageCode.code,
      description: wageCode.description || "",
      attachedAccountCode: wageCode.attachedAccountCode || ""
    });
    setErrors({});
  };

  const removeWageCode = async (code) => {
    if (!window.confirm(`Delete wage code ${code}?`)) {
      return;
    }

    try {
      const result = await deleteWageCode(code);
      showToast("success", result.message);
      if (editingCode === code) {
        resetForm();
      }
      await loadWageCodes();
    } catch (error) {
      showToast("error", error.message);
      setStatus({ type: "error", message: error.message });
    }
  };

  const changeSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const sortedWageCodes = [...wageCodes].sort((first, second) => {
    const firstValue = String(first[sortConfig.key] || "");
    const secondValue = String(second[sortConfig.key] || "");
    const compareResult = firstValue.localeCompare(secondValue, undefined, { numeric: true });
    return sortConfig.direction === "asc" ? compareResult : -compareResult;
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    loadWageCodes();
  }, [searchTerm, categoryFilter]);

  return (
    <section className="employee-entry-panel wage-master-panel" aria-label="Wage Code Master">
      <div className="form-title-row">
        <div>
          <p>Management</p>
          <h2>Wage Code Master</h2>
        </div>
        <span>{isEditMode ? "Editing wage" : "New wage code"}</span>
      </div>

      {toast.message ? (
        <div className={`toast-notice ${toast.type}`} role="status">
          {toast.message}
        </div>
      ) : null}

      {wageCodes.length ? (
        <div className="wage-range-legend" aria-label="Wage code category ranges">
          {wageCategoryRanges.map((range) => (
            <span key={range.category}>{range.label}</span>
          ))}
        </div>
      ) : null}

      <form className="wage-master-form" onSubmit={saveWageCode}>
        <label>
          <span>Wage Code</span>
          <input
            name="code"
            type="text"
            inputMode="numeric"
            maxLength="4"
            value={form.code}
            onBlur={normalizeCode}
            onChange={updateForm}
            disabled={isEditMode}
            placeholder="0001"
            required
          />
          {errors.code ? <small>{errors.code}</small> : null}
        </label>

        <label className="wide-field">
          <span>Description</span>
          <input
            name="description"
            type="text"
            maxLength="100"
            value={form.description}
            onChange={updateForm}
            placeholder="Basic Pay, Medical Allowance..."
            required
          />
          {errors.description ? <small>{errors.description}</small> : null}
        </label>

        <label>
          <span>Attached Account Code</span>
          <input
            name="attachedAccountCode"
            type="text"
            value={form.attachedAccountCode}
            onChange={updateForm}
            list="chart-account-options"
            placeholder="Optional"
          />
          <datalist id="chart-account-options">
            {accounts.map((account) => (
              <option value={account.code} key={account.code}>
                {account.name}
              </option>
            ))}
          </datalist>
        </label>

        <div className="wage-category-preview">
          <span>Derived Category</span>
          <strong className={derivedCategory ? "valid" : "invalid"}>
            {derivedCategory || "Invalid / not in range"}
          </strong>
        </div>

        <div className="department-form-actions wage-actions">
          <button type="button" onClick={resetForm}>Cancel</button>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : isEditMode ? "Update Wage Code" : "Save Wage Code"}
          </button>
          <button type="button" disabled={!isEditMode} onClick={() => removeWageCode(editingCode)}>
            Delete
          </button>
        </div>
      </form>

      <div className="wage-filter-row">
        <label>
          <span>Search</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search code or description"
          />
        </label>
        <label>
          <span>Category</span>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="">All Categories</option>
            {wageCategoryRanges.map((range) => (
              <option value={range.category} key={range.category}>{range.category}</option>
            ))}
          </select>
        </label>
      </div>

      {status.message ? (
        <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p>
      ) : null}

      <div className="table-wrap">
        <table className="wage-code-table">
          <thead>
            <tr>
              <th><button type="button" onClick={() => changeSort("code")}>Code</button></th>
              <th><button type="button" onClick={() => changeSort("description")}>Description</button></th>
              <th><button type="button" onClick={() => changeSort("category")}>Category</button></th>
              <th>Attached Account</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedWageCodes.map((wageCode) => (
              <tr key={wageCode.code}>
                <td>{wageCode.code}</td>
                <td>{wageCode.description}</td>
                <td>{wageCode.category}</td>
                <td>
                  {wageCode.attachedAccountCode
                    ? `${wageCode.attachedAccountCode}${wageCode.attachedAccountName ? ` - ${wageCode.attachedAccountName}` : ""}`
                    : "-"}
                </td>
                <td>
                  <select
                    className="wage-action-select"
                    value=""
                    aria-label={`Actions for wage code ${wageCode.code}`}
                    onChange={(event) => {
                      if (event.target.value === "edit") {
                        startEdit(wageCode);
                      }

                      if (event.target.value === "delete") {
                        removeWageCode(wageCode.code);
                      }
                    }}
                  >
                    <option value="">Action</option>
                    <option value="edit">Edit</option>
                    <option value="delete">Delete</option>
                  </select>
                </td>
              </tr>
            ))}

            {!sortedWageCodes.length ? (
              <tr>
                <td colSpan="5">No wage codes found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FiscalYearManagement() {
  const emptyFiscalYearForm = { name: "", startDate: "", endDate: "" };
  const [fiscalYears, setFiscalYears] = useState([]);
  const [form, setForm] = useState(emptyFiscalYearForm);
  const [editingFiscalYear, setEditingFiscalYear] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "Loading fiscal years..." });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const syncActiveFiscalYear = (records) => {
    if (typeof window === "undefined") {
      return;
    }

    const activeRecord = records.find((record) => Number(record.isActive) === 1) || records[0] || null;
    window.dispatchEvent(new CustomEvent("payroll-fiscal-year-updated", { detail: activeRecord }));
  };

  const loadFiscalYears = async () => {
    setLoading(true);
    setStatus({ type: "", message: "Loading fiscal years..." });

    try {
      const records = await getFiscalYears();
      setFiscalYears(records);
      setStatus({
        type: "success",
        message: records.length ? `${records.length} fiscal year(s) found.` : "No fiscal years found."
      });
      syncActiveFiscalYear(records);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyFiscalYearForm);
    setEditingFiscalYear(null);
  };

  const saveFiscalYear = async (event) => {
    event.preventDefault();

    const cleanName = form.name.trim().toLowerCase();
    const duplicateFiscalYear = fiscalYears.find(
      (fiscalYear) =>
        String(fiscalYear.name || "").trim().toLowerCase() === cleanName &&
        fiscalYear.id !== editingFiscalYear?.id
    );

    if (duplicateFiscalYear) {
      setStatus({ type: "error", message: "Duplicate entry of fiscal year." });
      return;
    }

    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      setStatus({ type: "error", message: "Fiscal year start date cannot be after the end date." });
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const payload = {
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate
      };

      const result = editingFiscalYear
        ? await updateFiscalYear(editingFiscalYear.id, payload)
        : await createFiscalYear(payload);

      setStatus({ type: "success", message: result.message });
      resetForm();
      await loadFiscalYears();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (fiscalYear) => {
    setEditingFiscalYear(fiscalYear);
    setForm({
      name: fiscalYear.name || "",
      startDate: fiscalYear.startDate || "",
      endDate: fiscalYear.endDate || ""
    });
    setStatus({ type: "", message: "" });
  };

  const removeFiscalYear = async (fiscalYear) => {
    const shouldDelete = window.confirm(`Delete fiscal year ${fiscalYear.name}?`);

    if (!shouldDelete) {
      return;
    }

    setStatus({ type: "", message: "" });

    try {
      const result = await deleteFiscalYear(fiscalYear.id);
      setStatus({ type: "success", message: result.message });
      if (editingFiscalYear?.id === fiscalYear.id) {
        resetForm();
      }
      await loadFiscalYears();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const setActive = async (fiscalYear) => {
    setStatus({ type: "", message: "" });

    try {
      const result = await activateFiscalYear(fiscalYear.id);
      setStatus({ type: "success", message: result.message });
      await loadFiscalYears();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    loadFiscalYears();
  }, []);

  return (
    <section className="employee-entry-panel" aria-label="Fiscal year settings">
      <div className="form-title-row">
        <div>
          <p>Management</p>
          <h2>Fiscal Year Settings</h2>
        </div>
        <span>{editingFiscalYear ? "Editing year" : "New year"}</span>
      </div>

      <form className="department-code-form" onSubmit={saveFiscalYear}>
        <label>
          <span>Fiscal Year Name</span>
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={updateField}
            placeholder="2026-2027"
            required
          />
        </label>
        <label>
          <span>Start Date</span>
          <input
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={updateField}
            required
          />
        </label>
        <label>
          <span>End Date</span>
          <input
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={updateField}
            required
          />
        </label>
        <div className="department-form-actions">
          <button type="button" onClick={resetForm}>Clear</button>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingFiscalYear ? "Update Fiscal Year" : "Save Fiscal Year"}
          </button>
        </div>
      </form>

      {status.message ? (
        <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p>
      ) : null}

      <div className="table-wrap">
        <table className="department-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fiscalYears.map((fiscalYear) => (
              <tr key={fiscalYear.id}>
                <td>{fiscalYear.name}</td>
                <td>{fiscalYear.startDate}</td>
                <td>{fiscalYear.endDate}</td>
                <td>
                  <span className={`allowance-status ${Number(fiscalYear.isActive) === 1 ? "active" : "expired"}`}>
                    {Number(fiscalYear.isActive) === 1 ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <select
                    className="account-action-select"
                    value=""
                    aria-label={`Actions for fiscal year ${fiscalYear.name}`}
                    onChange={(event) => {
                      if (event.target.value === "edit") {
                        startEdit(fiscalYear);
                      }

                      if (event.target.value === "activate") {
                        setActive(fiscalYear);
                      }

                      if (event.target.value === "delete") {
                        removeFiscalYear(fiscalYear);
                      }
                    }}
                  >
                    <option value="">Action</option>
                    <option value="edit">Edit</option>
                    <option value="activate">Set Active</option>
                    <option value="delete">Delete</option>
                  </select>
                </td>
              </tr>
            ))}

            {!fiscalYears.length && !loading ? (
              <tr>
                <td colSpan="5">No fiscal years found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TaxSlabManagement() {
  const currentFiscalYear = getActiveFiscalYearRecord();
  const today = new Date();
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState(String(currentFiscalYear?.id || ""));
  const [policies, setPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [policyForm, setPolicyForm] = useState({
    fiscalYearId: String(currentFiscalYear?.id || ""),
    name: "",
    basis: "annual",
    notes: "",
    isActive: true
  });
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [slabs, setSlabs] = useState([]);
  const [slabForm, setSlabForm] = useState({
    srNo: "",
    fromIncome: "",
    toIncome: "",
    rate: "",
    fixedTax: ""
  });
  const [editingSlab, setEditingSlab] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "Loading tax slabs..." });
  const [loading, setLoading] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [savingSlab, setSavingSlab] = useState(false);
  const [generatingTax, setGeneratingTax] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [taxHistory, setTaxHistory] = useState([]);
  const [selectedHistoryBatch, setSelectedHistoryBatch] = useState(null);
  const [loadingHistoryBatch, setLoadingHistoryBatch] = useState(false);
  const [taxGenerationForm, setTaxGenerationForm] = useState({
    paymentMonth: String(today.getMonth() + 1),
    paymentYear: String(today.getFullYear())
  });

  const loadFiscalYears = async () => {
    const records = await getFiscalYears();
    setFiscalYears(records);

    if (!selectedFiscalYearId && records.length) {
      const activeFiscalYear = records.find((record) => Number(record.isActive) === 1) || records[0];
      setSelectedFiscalYearId(String(activeFiscalYear.id));
    }
  };

  const loadPolicies = async (fiscalYearId) => {
    if (!fiscalYearId) {
      setPolicies([]);
      setSelectedPolicyId("");
      setSlabs([]);
      return;
    }

    const records = await getTaxPolicies({ fiscalYearId });
    setPolicies(records);

    const nextPolicy =
      records.find((record) => Number(record.isActive) === 1) ||
      records.find((record) => String(record.id) === String(selectedPolicyId)) ||
      records[0] ||
      null;

    setSelectedPolicyId(nextPolicy ? String(nextPolicy.id) : "");
    if (nextPolicy) {
      const slabRows = await getTaxSlabs(nextPolicy.id);
      setSlabs(slabRows);
    } else {
      setSlabs([]);
    }
  };

  const loadSelectedPolicySlabs = async (policyId) => {
    if (!policyId) {
      setSlabs([]);
      return;
    }

    const slabRows = await getTaxSlabs(policyId);
    setSlabs(slabRows);
  };

  const loadTaxHistory = async (fiscalYearId) => {
    if (!fiscalYearId) {
      setTaxHistory([]);
      return;
    }

    setLoadingHistory(true);
    try {
      const rows = await getTaxGenerationHistory({ fiscalYearId, limit: 25 });
      setTaxHistory(rows || []);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      setTaxHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistoryBatch = async (batchId) => {
    setLoadingHistoryBatch(true);
    setSelectedHistoryBatch({
      batch: { id: batchId },
      snapshots: []
    });
    try {
      const details = await getTaxGenerationBatchDetails(batchId);
      setSelectedHistoryBatch(details);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoadingHistoryBatch(false);
    }
  };

  const closeHistoryBatch = () => {
    setSelectedHistoryBatch(null);
  };

  const refreshAll = async () => {
    setLoading(true);
    setStatus({ type: "", message: "Loading tax slabs..." });

    try {
      await loadFiscalYears();
      const fiscalYearId = selectedFiscalYearId || String(currentFiscalYear?.id || "");
      await loadPolicies(fiscalYearId);
      await loadTaxHistory(fiscalYearId);
      setStatus({ type: "success", message: "Tax policies loaded." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (!selectedFiscalYearId) {
      return;
    }

    let cancelled = false;

    async function syncPolicies() {
      setLoading(true);
      try {
        const records = await getTaxPolicies({ fiscalYearId: selectedFiscalYearId });
        if (cancelled) return;

        setPolicies(records);

        const nextPolicy =
          records.find((record) => Number(record.isActive) === 1) ||
          records[0] ||
          null;

        setSelectedPolicyId(nextPolicy ? String(nextPolicy.id) : "");
        setSlabs(nextPolicy ? await getTaxSlabs(nextPolicy.id) : []);
        await loadTaxHistory(selectedFiscalYearId);
      } catch (error) {
        if (!cancelled) {
          setStatus({ type: "error", message: error.message });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    syncPolicies();

    return () => {
      cancelled = true;
    };
  }, [selectedFiscalYearId]);

  useEffect(() => {
    if (!selectedPolicyId) {
      setSlabs([]);
      return undefined;
    }

    let cancelled = false;

    loadSelectedPolicySlabs(selectedPolicyId).catch((error) => {
      if (!cancelled) {
        setStatus({ type: "error", message: error.message });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedPolicyId]);

  const updatePolicyField = (event) => {
    const { name, value, type, checked } = event.target;
    setPolicyForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const updateSlabField = (event) => {
    const { name, value } = event.target;
    setSlabForm((current) => ({ ...current, [name]: value }));
  };

  const resetPolicyForm = () => {
    setPolicyForm({
      fiscalYearId: selectedFiscalYearId || String(currentFiscalYear?.id || ""),
      name: "",
      basis: "annual",
      notes: "",
      isActive: true
    });
    setEditingPolicy(null);
  };

  const resetSlabForm = () => {
    setSlabForm({ srNo: "", fromIncome: "", toIncome: "", rate: "", fixedTax: "" });
    setEditingSlab(null);
  };

  const updateTaxGenerationField = (event) => {
    const { name, value } = event.target;
    setTaxGenerationForm((current) => ({ ...current, [name]: value }));
  };

  const generateTaxSnapshots = async () => {
    if (!selectedFiscalYearId) {
      setStatus({ type: "error", message: "Select a fiscal year first." });
      return;
    }

    if (!taxGenerationForm.paymentMonth || !taxGenerationForm.paymentYear) {
      setStatus({ type: "error", message: "Month and year are required for tax generation." });
      return;
    }

    setGeneratingTax(true);
    setStatus({ type: "", message: "Generating stored tax deductions..." });

    try {
      const result = await generateStoredTaxDeductions({
        fiscalYearId: selectedFiscalYearId,
        paymentMonth: taxGenerationForm.paymentMonth,
        paymentYear: taxGenerationForm.paymentYear,
        deptCode: "999",
        gazNg: "A",
        reportFor: "All",
        generatedBy: "Hospital Admin"
      });

      setStatus({
        type: "success",
        message: `Stored tax deductions generated for ${result.data.generatedCount} employee(s). Total tax PKR ${formatCurrency(result.data.totalTax || 0)}.`
      });
      await loadTaxHistory(selectedFiscalYearId);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setGeneratingTax(false);
    }
  };

  const savePolicy = async (event) => {
    event.preventDefault();

    const fiscalYearId = String(policyForm.fiscalYearId || selectedFiscalYearId || "").trim();
    if (!fiscalYearId) {
      setStatus({ type: "error", message: "Fiscal year is required." });
      return;
    }

    if (!policyForm.name.trim()) {
      setStatus({ type: "error", message: "Tax policy name is required." });
      return;
    }

    setSavingPolicy(true);
    setStatus({ type: "", message: "" });

    try {
      const payload = {
        fiscalYearId,
        name: policyForm.name.trim(),
        basis: policyForm.basis,
        notes: policyForm.notes.trim(),
        isActive: policyForm.isActive
      };

      const result = editingPolicy
        ? await updateTaxPolicy(editingPolicy.id, payload)
        : await createTaxPolicy(payload);

      setStatus({ type: "success", message: result.message });
      resetPolicyForm();
      await loadPolicies(fiscalYearId);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSavingPolicy(false);
    }
  };

  const startEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setPolicyForm({
      fiscalYearId: String(policy.fiscalYearId || selectedFiscalYearId || ""),
      name: policy.name || "",
      basis: policy.basis || "annual",
      notes: policy.notes || "",
      isActive: Boolean(policy.isActive)
    });
    setSelectedFiscalYearId(String(policy.fiscalYearId || selectedFiscalYearId || ""));
    setStatus({ type: "", message: "" });
  };

  const setActivePolicy = async (policy) => {
    setStatus({ type: "", message: "" });

    try {
      const result = await activateTaxPolicy(policy.id);
      setStatus({ type: "success", message: result.message });
      await loadPolicies(selectedFiscalYearId);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const removePolicy = async (policy) => {
    if (!window.confirm(`Delete tax policy ${policy.name}?`)) {
      return;
    }

    try {
      const result = await deleteTaxPolicy(policy.id);
      setStatus({ type: "success", message: result.message });
      if (editingPolicy?.id === policy.id) {
        resetPolicyForm();
      }
      await loadPolicies(selectedFiscalYearId);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const saveSlab = async (event) => {
    event.preventDefault();

    if (!selectedPolicyId) {
      setStatus({ type: "error", message: "Select a tax policy first." });
      return;
    }

    if (slabForm.fromIncome === "" || slabForm.rate === "") {
      setStatus({ type: "error", message: "From income and tax rate are required." });
      return;
    }

    setSavingSlab(true);
    setStatus({ type: "", message: "" });

    try {
      const payload = {
        srNo: slabForm.srNo,
        fromIncome: slabForm.fromIncome,
        toIncome: slabForm.toIncome,
        rate: slabForm.rate,
        fixedTax: slabForm.fixedTax
      };

      const result = editingSlab
        ? await updateTaxSlab(selectedPolicyId, editingSlab.id, payload)
        : await createTaxSlab(selectedPolicyId, payload);

      setStatus({ type: "success", message: result.message });
      resetSlabForm();
      await loadSelectedPolicySlabs(selectedPolicyId);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSavingSlab(false);
    }
  };

  const startEditSlab = (slab) => {
    setEditingSlab(slab);
    setSlabForm({
      srNo: slab.srNo || "",
      fromIncome: slab.fromIncome ?? "",
      toIncome: slab.toIncome ?? "",
      rate: slab.rate ?? "",
      fixedTax: slab.fixedTax ?? ""
    });
    setStatus({ type: "", message: "" });
  };

  const removeSlab = async (slab) => {
    if (!window.confirm(`Delete tax slab ${slab.srNo}?`)) {
      return;
    }

    try {
      const result = await deleteTaxSlab(selectedPolicyId, slab.id);
      setStatus({ type: "success", message: result.message });
      if (editingSlab?.id === slab.id) {
        resetSlabForm();
      }
      await loadSelectedPolicySlabs(selectedPolicyId);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <section className="employee-entry-panel" aria-label="Tax slab settings">
      <div className="form-title-row">
        <div>
          <p>Management</p>
          <h2>Tax Slab Settings</h2>
        </div>
        <span>{currentFiscalYear?.name || "Fiscal year required"}</span>
      </div>

      <div className="report-filter-panel proof-filter-panel no-print">
        <label>
          <span>Fiscal Year</span>
          <select value={selectedFiscalYearId} onChange={(event) => setSelectedFiscalYearId(event.target.value)}>
            <option value="">Select fiscal year</option>
            {fiscalYears.map((fiscalYear) => (
              <option key={fiscalYear.id} value={fiscalYear.id}>
                {fiscalYear.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="report-filter-panel proof-filter-panel no-print">
        <label>
          <span>Tax Month</span>
          <select name="paymentMonth" value={taxGenerationForm.paymentMonth} onChange={updateTaxGenerationField}>
            {payrollMonthOptions.map((monthName, index) => (
              <option key={monthName} value={String(index + 1)}>
                {index + 1} - {monthName}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Tax Year</span>
          <input
            name="paymentYear"
            type="number"
            value={taxGenerationForm.paymentYear}
            onChange={updateTaxGenerationField}
          />
        </label>
        <div className="report-filter-actions">
          <button type="button" onClick={generateTaxSnapshots} disabled={generatingTax}>
            {generatingTax ? "Generating..." : "Generate Stored Tax"}
          </button>
        </div>
      </div>

      <div className="table-wrap no-print" style={{ marginBottom: "1.5rem" }}>
        <table className="department-table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Period</th>
              <th>Dept</th>
              <th>Employees</th>
              <th>Total Tax</th>
              <th>Generated By</th>
              <th>Generated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {taxHistory.map((row) => (
              <tr key={row.id}>
                <td>#{row.id}</td>
                <td>{String(row.paymentMonth).padStart(2, "0")}/{row.paymentYear}</td>
                <td>{row.deptCode || "999"}</td>
                <td>{row.generatedCount || 0}</td>
                <td>{formatCurrency(row.totalTax || 0)}</td>
                <td>{row.generatedBy || "-"}</td>
                <td>{row.generatedAt ? new Date(row.generatedAt).toLocaleString() : "-"}</td>
                <td>
                  <button type="button" onClick={() => openHistoryBatch(row.id)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {!taxHistory.length && !loadingHistory ? (
              <tr>
                <td colSpan="8">No tax generation history found for this fiscal year.</td>
              </tr>
            ) : null}
            {loadingHistory ? (
              <tr>
                <td colSpan="8">Loading history...</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selectedHistoryBatch ? (
        <div className="modal-backdrop soft-modal-backdrop no-print" role="dialog" aria-modal="true" aria-label="Tax generation batch details">
          <div className="confirm-modal salary-preview-modal">
            <div>
              <p>Tax Generation Batch</p>
              <h3>Batch #{selectedHistoryBatch.batch?.id || selectedHistoryBatch.id}</h3>
              <span>
                {selectedHistoryBatch.batch?.fiscalYearName || "-"} |{" "}
                {String(selectedHistoryBatch.batch?.paymentMonth || "").padStart(2, "0")}/{selectedHistoryBatch.batch?.paymentYear || ""} |{" "}
                {selectedHistoryBatch.batch?.generatedCount || 0} employee(s)
              </span>
            </div>

            {loadingHistoryBatch ? (
              <p>Loading batch details...</p>
            ) : (
              <div className="table-wrap">
                <table className="department-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Name</th>
                      <th>Gross</th>
                      <th>Annualized</th>
                      <th>Slab</th>
                      <th>Credit</th>
                      <th>Tax</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedHistoryBatch.snapshots || []).map((row) => (
                      <tr key={row.id}>
                        <td>{row.employeeCode}</td>
                        <td>{row.employeeName || "-"}</td>
                        <td>{formatCurrency(row.grossPay || 0)}</td>
                        <td>{formatCurrency(row.annualizedIncome || 0)}</td>
                        <td>{formatTaxSlabRange(row.slab)}</td>
                        <td>{formatCurrency((row.priorEmployerTaxCredit || 0) + (row.companyTaxPaidYTD || 0))}</td>
                        <td>{formatCurrency(row.taxAmount || 0)}</td>
                      </tr>
                    ))}
                    {!selectedHistoryBatch.snapshots?.length ? (
                      <tr>
                        <td colSpan="7">No employee snapshots found for this batch.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}

            <div className="confirm-modal-actions">
              <button type="button" onClick={closeHistoryBatch}>Close</button>
            </div>
          </div>
        </div>
      ) : null}

      <form className="department-code-form" onSubmit={savePolicy}>
        <label>
          <span>Policy Name</span>
          <input
            name="name"
            type="text"
            value={policyForm.name}
            onChange={updatePolicyField}
            placeholder="Pakistan Tax 2026"
            required
          />
        </label>
        <label>
          <span>Basis</span>
          <select name="basis" value={policyForm.basis} onChange={updatePolicyField}>
            <option value="annual">Annual</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <label>
          <span>Notes</span>
          <input
            name="notes"
            type="text"
            value={policyForm.notes}
            onChange={updatePolicyField}
            placeholder="Optional notes"
          />
        </label>
        <label className="reset-confirm-row">
          <input
            name="isActive"
            type="checkbox"
            checked={policyForm.isActive}
            onChange={updatePolicyField}
          />
          <span>Set as active policy for this fiscal year</span>
        </label>
        <div className="department-form-actions">
          <button type="button" onClick={resetPolicyForm}>Clear</button>
          <button type="submit" disabled={savingPolicy}>
            {savingPolicy ? "Saving..." : editingPolicy ? "Update Policy" : "Save Policy"}
          </button>
        </div>
      </form>

      {status.message ? <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p> : null}

      <div className="table-wrap">
        <table className="department-table">
          <thead>
            <tr>
              <th>Policy</th>
              <th>Fiscal Year</th>
              <th>Basis</th>
              <th>Status</th>
              <th>Slabs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.id}>
                <td>{policy.name}</td>
                <td>{policy.fiscalYearName}</td>
                <td>{policy.basis}</td>
                <td>
                  <span className={`allowance-status ${Number(policy.isActive) === 1 ? "active" : "expired"}`}>
                    {Number(policy.isActive) === 1 ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{policy.slabCount || 0}</td>
                <td>
                  <select
                    className="account-action-select"
                    value=""
                    aria-label={`Actions for tax policy ${policy.name}`}
                    onChange={(event) => {
                      if (event.target.value === "open") {
                        setSelectedPolicyId(String(policy.id));
                      }

                      if (event.target.value === "edit") {
                        startEditPolicy(policy);
                      }

                      if (event.target.value === "activate") {
                        setActivePolicy(policy);
                      }

                      if (event.target.value === "delete") {
                        removePolicy(policy);
                      }
                    }}
                  >
                    <option value="">Action</option>
                    <option value="open">Open Slabs</option>
                    <option value="edit">Edit</option>
                    <option value="activate">Set Active</option>
                    <option value="delete">Delete</option>
                  </select>
                </td>
              </tr>
            ))}
            {!policies.length && !loading ? (
              <tr>
                <td colSpan="6">No tax policies found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="form-title-row" style={{ marginTop: "2rem" }}>
        <div>
          <p>Tax Slabs</p>
          <h2>{selectedPolicyId ? "Slab Maintenance" : "Select a policy first"}</h2>
        </div>
        <span>{slabs.length} slab(s)</span>
      </div>

      <form className="department-code-form" onSubmit={saveSlab}>
        <label>
          <span>Sr No</span>
          <input
            name="srNo"
            type="number"
            value={slabForm.srNo}
            onChange={updateSlabField}
            placeholder="Auto"
          />
        </label>
        <label>
          <span>From Income</span>
          <input
            name="fromIncome"
            type="number"
            step="0.01"
            value={slabForm.fromIncome}
            onChange={updateSlabField}
            required
          />
        </label>
        <label>
          <span>To Income</span>
          <input
            name="toIncome"
            type="number"
            step="0.01"
            value={slabForm.toIncome}
            onChange={updateSlabField}
            placeholder="Leave blank for last slab"
          />
        </label>
        <label>
          <span>Rate %</span>
          <input
            name="rate"
            type="number"
            step="0.01"
            value={slabForm.rate}
            onChange={updateSlabField}
            required
          />
        </label>
        <label>
          <span>Fixed Tax</span>
          <input
            name="fixedTax"
            type="number"
            step="0.01"
            value={slabForm.fixedTax}
            onChange={updateSlabField}
            placeholder="Optional fixed amount"
          />
        </label>
        <div className="department-form-actions">
          <button type="button" onClick={resetSlabForm}>Clear</button>
          <button type="submit" disabled={savingSlab || !selectedPolicyId}>
            {savingSlab ? "Saving..." : editingSlab ? "Update Slab" : "Save Slab"}
          </button>
        </div>
      </form>

      <div className="table-wrap">
        <table className="department-table">
          <thead>
            <tr>
              <th>Sr</th>
              <th>From</th>
              <th>To</th>
              <th>Rate %</th>
              <th>Fixed Tax</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slabs.map((slab) => (
              <tr key={slab.id}>
                <td>{slab.srNo}</td>
                <td>{slab.fromIncome}</td>
                <td>{slab.toIncome ?? "-"}</td>
                <td>{slab.rate}</td>
                <td>{slab.fixedTax}</td>
                <td>
                  <select
                    className="account-action-select"
                    value=""
                    aria-label={`Actions for tax slab ${slab.srNo}`}
                    onChange={(event) => {
                      if (event.target.value === "edit") {
                        startEditSlab(slab);
                      }

                      if (event.target.value === "delete") {
                        removeSlab(slab);
                      }
                    }}
                  >
                    <option value="">Action</option>
                    <option value="edit">Edit</option>
                    <option value="delete">Delete</option>
                  </select>
                </td>
              </tr>
            ))}
            {!slabs.length && selectedPolicyId && !loading ? (
              <tr>
                <td colSpan="6">No slabs found for this policy.</td>
              </tr>
            ) : null}
            {!selectedPolicyId ? (
              <tr>
                <td colSpan="6">Select a tax policy to manage its slabs.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ResetDataPanel() {
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [resetting, setResetting] = useState(false);

  const handleReset = async (event) => {
    event.preventDefault();

    if (!password.trim()) {
      setStatus({ type: "error", message: "Admin password is required." });
      return;
    }

    if (!confirmed) {
      setStatus({ type: "error", message: "Please confirm that you want to reset software data." });
      return;
    }

    if (!window.confirm("This will delete saved payroll, employee, arrear, and budget data. Management code lists will be kept. Continue?")) {
      return;
    }

    setResetting(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await resetSoftwareData(password);
      setPassword("");
      setConfirmed(false);
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setResetting(false);
    }
  };

  return (
    <section className="employee-entry-panel reset-data-panel" aria-label="Reset data">
      <div className="form-title-row">
        <div>
          <p>Management</p>
          <h2>Reset Data</h2>
        </div>
        <span>Admin password required</span>
      </div>

      <form className="reset-data-form" onSubmit={handleReset}>
        <p>
          This will clear saved employees, allowances, payroll runs, arrear bills,
          budget transactions, special pay, and cheque print records. Management code lists will not be reset.
        </p>

        <label>
          <span>Admin Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter admin password"
            autoComplete="current-password"
          />
        </label>

        <label className="reset-confirm-row">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>I understand this will reset saved software data.</span>
        </label>

        {status.message ? (
          <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p>
        ) : null}

        <div className="form-actions">
          <button type="button" onClick={() => {
            setPassword("");
            setConfirmed(false);
            setStatus({ type: "", message: "" });
          }}>
            Cancel
          </button>
          <button type="submit" disabled={resetting}>
            {resetting ? "Resetting..." : "Reset Data"}
          </button>
        </div>
      </form>
    </section>
  );
}

function PasswordChangePanel() {
  const emptyForm = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setStatus({ type: "error", message: "All password fields are required." });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setStatus({ type: "error", message: "New password and confirm password do not match." });
      return;
    }

    if (form.newPassword.length < 6) {
      setStatus({ type: "error", message: "New password must be at least 6 characters." });
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await changeAdminPassword(form);
      setForm(emptyForm);
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="employee-entry-panel password-change-panel" aria-label="Password change">
      <div className="form-title-row">
        <div>
          <p>Management</p>
          <h2>Password Change</h2>
        </div>
        <span>Admin account</span>
      </div>

      <form className="password-change-form" onSubmit={handleSubmit}>
        <label>
          <span>Current Password</span>
          <input
            name="currentPassword"
            type="password"
            value={form.currentPassword}
            onChange={updateField}
            placeholder="Enter current password"
            autoComplete="current-password"
          />
        </label>
        <label>
          <span>New Password</span>
          <input
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={updateField}
            placeholder="Enter new password"
            autoComplete="new-password"
          />
        </label>
        <label>
          <span>Confirm Password</span>
          <input
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={updateField}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
        </label>

        {status.message ? (
          <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p>
        ) : null}

        <div className="form-actions">
          <button type="button" onClick={() => {
            setForm(emptyForm);
            setStatus({ type: "", message: "" });
          }}>
            Cancel
          </button>
          <button type="submit" disabled={saving}>
            {saving ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>
    </section>
  );
}

const defaultAllowanceRows = Array.from({ length: 5 }, (_, index) => ({
  srNo: index + 1,
  allowanceCode: index === 0 ? "0000" : "",
  description: "",
  amount: index === 0 ? "0" : "",
  upto: "2099-12-31"
}));

function PayAllowancesEntry() {
  const [employeeCode, setEmployeeCode] = useState("");
  const [employee, setEmployee] = useState(null);
  const [allowances, setAllowances] = useState(defaultAllowanceRows);
  const [allowanceCodes, setAllowanceCodes] = useState([]);
  const [activeAllowanceRowIndex, setActiveAllowanceRowIndex] = useState(0);
  const [wageCodeSearch, setWageCodeSearch] = useState("");
  const [isWageCodeLookupOpen, setIsWageCodeLookupOpen] = useState(false);
  const [showAllowanceSaved, setShowAllowanceSaved] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const isEmployeeStopped = Boolean(employee?.stopDate && employee.stopDate <= today);
  const formatAllowanceStopDate = (value) => {
    const [year, month, day] = String(value || "").slice(0, 10).split("-");
    return year && month && day ? `${day}/${month}/${year}` : String(value || "");
  };
  const isAllowanceActive = (row) => !row.upto || row.upto >= today;
  const isDeductionAllowanceCode = (code) => {
    const numericCode = Number(String(code || "").replace(/^0+(?=\d)/, ""));
    return numericCode >= 4001 && numericCode <= 6999;
  };
  const isGrossAllowanceCode = (code) => {
    const numericCode = Number(String(code || "").replace(/^0+(?=\d)/, ""));
    return numericCode >= 1 && numericCode <= 3999;
  };
  const activeSalarySummary = allowances.reduce((summary, row) => {
    if (isEmployeeStopped) {
      return summary;
    }

    if (!isAllowanceActive(row)) {
      return summary;
    }

    const amount = Number(row.amount || 0);

    if (isDeductionAllowanceCode(row.allowanceCode)) {
      return { ...summary, deductions: summary.deductions + Math.abs(amount) };
    }

    if (isGrossAllowanceCode(row.allowanceCode)) {
      return { ...summary, grossPay: summary.grossPay + amount };
    }

    return summary;
  }, { grossPay: 0, deductions: 0 });
  const totalAfterDeduction = activeSalarySummary.grossPay - activeSalarySummary.deductions;
  const filteredAllowanceCodes = wageCodeSearch.trim()
    ? allowanceCodes.filter((wageCode) =>
        [wageCode.code, wageCode.description, wageCode.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(wageCodeSearch.trim().toLowerCase()))
      )
    : allowanceCodes;

  const findAllowanceCode = (value) => {
    const cleanValue = String(value || "").trim().toLowerCase();
    const normalizedValue = cleanValue.replace(/^0+(?=\d)/, "");

    if (!cleanValue) {
      return null;
    }

    return allowanceCodes.find((wageCode) => {
      const code = String(wageCode.code || "").trim().toLowerCase();
      return code === cleanValue || code.replace(/^0+(?=\d)/, "") === normalizedValue;
    }) || null;
  };

  const loadEmployee = async () => {
    if (!employeeCode.trim()) {
      setStatus({ type: "error", message: "Please enter employee code." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const foundEmployee = await getEmployeeByCode(employeeCode.trim());
      const allowanceData = await getEmployeeAllowances(foundEmployee.id);
      setEmployee(foundEmployee);
      setAllowances(
        allowanceData.allowances.length
          ? allowanceData.allowances.map((allowance) => ({ ...allowance, upto: allowance.upto || "2099-12-31" }))
          : defaultAllowanceRows
      );
      setStatus({ type: "success", message: "Employee detail loaded." });
    } catch (error) {
      setEmployee(null);
      setAllowances(defaultAllowanceRows);
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeCodeKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      loadEmployee();
    }
  };

  const loadAllowanceCodes = async () => {
    try {
      const result = await getWageCodes();
      setAllowanceCodes(result);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const applyAllowanceCode = (rowIndex, wageCode) => {
    setAllowances((current) =>
      current.map((row, index) =>
        index === rowIndex
          ? { ...row, allowanceCode: wageCode.code, description: wageCode.description || "" }
          : row
      )
    );
    setActiveAllowanceRowIndex(rowIndex);
    setIsWageCodeLookupOpen(false);
    setWageCodeSearch("");
  };

  const openWageCodeLookup = (rowIndex = activeAllowanceRowIndex) => {
    setActiveAllowanceRowIndex(rowIndex);
    setIsWageCodeLookupOpen(true);
  };

  const updateAllowance = (rowIndex, field, value) => {
    setAllowances((current) =>
      current.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        const nextRow = { ...row, [field]: value };

        if (field === "allowanceCode") {
          const matchedCode = findAllowanceCode(value);
          nextRow.allowanceCode = matchedCode ? matchedCode.code : value;
          nextRow.description = matchedCode ? matchedCode.description : row.description;
        }

        return nextRow;
      })
    );
  };

  const handleAllowanceCodeKeyDown = (event, rowIndex) => {
    if (event.key === "F1") {
      event.preventDefault();
      openWageCodeLookup(rowIndex);
    }
  };

  const addAllowanceRow = () => {
    setAllowances((current) => [
      ...current,
      {
        srNo: current.length + 1,
        allowanceCode: "",
        description: "",
        amount: "",
        upto: "2099-12-31"
      }
    ]);
    setActiveAllowanceRowIndex(allowances.length);
  };

  const removeAllowanceRow = (rowIndex) => {
    setAllowances((current) =>
      current
        .filter((_row, index) => index !== rowIndex)
        .map((row, index) => ({ ...row, srNo: index + 1 }))
    );
    setActiveAllowanceRowIndex((current) => Math.max(0, Math.min(current, allowances.length - 2)));
  };

  const saveAllowances = async () => {
    if (!employee) {
      setStatus({ type: "error", message: "Load an employee before saving allowances." });
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      await saveEmployeeAllowances(employee.id, allowances);
      setStatus({ type: "", message: "" });
      setShowAllowanceSaved(true);
      window.setTimeout(() => setShowAllowanceSaved(false), 2200);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadAllowanceCodes();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "F1") {
        event.preventDefault();
        openWageCodeLookup();
      }

      if (event.key === "Escape" && isWageCodeLookupOpen) {
        setIsWageCodeLookupOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeAllowanceRowIndex, isWageCodeLookupOpen]);

  return (
    <section className="allowance-entry-panel" aria-label="Pay allowances entry">
      <div className="allowance-title">Allowance Entry</div>

      <div className="allowance-lookup">
        <label>
          <span>Employee Code</span>
          <input
            type="text"
            value={employeeCode}
            onChange={(event) => setEmployeeCode(event.target.value)}
            onKeyDown={handleEmployeeCodeKeyDown}
            placeholder="Enter employee code and press Enter"
          />
        </label>
        <button type="button" onClick={loadEmployee} disabled={loading}>
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {status.message ? (
        <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p>
      ) : null}

      <div className="allowance-details">
        <label>
          <span>Name</span>
          <input readOnly value={employee?.name || ""} />
        </label>
        <label>
          <span>Place Of Posting</span>
          <input readOnly value={employee?.placeOfPosting || ""} />
        </label>
        <label>
          <span>Service Type</span>
          <input readOnly value={employee?.serviceType || ""} />
        </label>
        <label>
          <span>Designation</span>
          <input readOnly value={employee?.designation || ""} />
        </label>
        <label>
          <span>BPS</span>
          <input readOnly value={employee?.bps || ""} />
        </label>
        <label>
          <span>Department</span>
          <input readOnly value={employee?.department || ""} />
        </label>
        <label>
          <span>Gaz/NG</span>
          <input readOnly value={employee?.gazNg || ""} />
        </label>
      </div>

      <div className="allowance-summary">
        <div>
          <span>Gross Pay</span>
          <strong>PKR {activeSalarySummary.grossPay.toLocaleString()}</strong>
        </div>
        <div>
          <span>Deduction</span>
          <strong>PKR {activeSalarySummary.deductions.toLocaleString()}</strong>
        </div>
        <div>
          <span>Total After Deduction</span>
          <strong>PKR {totalAfterDeduction.toLocaleString()}</strong>
        </div>
        <p>Expired allowance rows are not included in employee salary.</p>
        {isEmployeeStopped ? (
          <p>Employee stopped on {formatAllowanceStopDate(employee.stopDate)}; salary and allowances are stopped.</p>
        ) : null}
      </div>

      <div className="allowance-table-wrap">
        <table className="allowance-table">
          <thead>
            <tr>
              <th>Sr #</th>
              <th>Code</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Upto</th>
              <th>Status</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {allowances.map((row, index) => (
              <tr className={!isAllowanceActive(row) ? "expired-allowance" : ""} key={`${row.srNo}-${index}`}>
                <td>{index + 1}</td>
                <td>
                  <input
                    value={row.allowanceCode}
                    onFocus={() => setActiveAllowanceRowIndex(index)}
                    onKeyDown={(event) => handleAllowanceCodeKeyDown(event, index)}
                    onChange={(event) => updateAllowance(index, "allowanceCode", event.target.value)}
                    placeholder="F1"
                  />
                </td>
                <td>
                  <input
                    value={row.description || ""}
                    onChange={(event) => updateAllowance(index, "description", event.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.amount}
                    onChange={(event) => updateAllowance(index, "amount", event.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={row.upto || ""}
                    onChange={(event) => updateAllowance(index, "upto", event.target.value)}
                  />
                </td>
                <td>
                  <span className={isAllowanceActive(row) ? "allowance-status active" : "allowance-status expired"}>
                    {isAllowanceActive(row) ? "Active" : "Expired"}
                  </span>
                </td>
                <td>
                  <button
                    className="allowance-delete-button"
                    type="button"
                    onClick={() => removeAllowanceRow(index)}
                    title="Delete allowance row"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="allowance-actions">
        <button type="button" onClick={addAllowanceRow}>Add Record</button>
        <button type="button" onClick={saveAllowances} disabled={saving}>
          {saving ? "Saving..." : "Save Allowances"}
        </button>
      </div>

      {isWageCodeLookupOpen ? (
        <div className="modal-backdrop soft-modal-backdrop no-print" role="dialog" aria-modal="true" aria-label="Wage code lookup">
          <div className="wage-code-lookup-modal">
            <div className="wage-code-lookup-head">
              <div>
                <p>Row {activeAllowanceRowIndex + 1}</p>
                <h3>Wage Code Lookup</h3>
              </div>
              <button type="button" onClick={() => setIsWageCodeLookupOpen(false)}>Close</button>
            </div>
            <input
              type="search"
              value={wageCodeSearch}
              onChange={(event) => setWageCodeSearch(event.target.value)}
              placeholder="Search code or description"
              autoFocus
            />
            <div className="wage-code-lookup-table-wrap">
              <table className="wage-code-lookup-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllowanceCodes.map((wageCode) => (
                    <tr
                      key={wageCode.code}
                      onClick={() => applyAllowanceCode(activeAllowanceRowIndex, wageCode)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          applyAllowanceCode(activeAllowanceRowIndex, wageCode);
                        }
                      }}
                    >
                      <td>{wageCode.code}</td>
                      <td>{wageCode.description}</td>
                      <td>{wageCode.category || "-"}</td>
                    </tr>
                  ))}
                  {!filteredAllowanceCodes.length ? (
                    <tr>
                      <td colSpan="3">No wage code found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {showAllowanceSaved ? (
        <div className="allowance-save-toast" role="status" aria-live="polite">
          <div>
            <span>OK</span>
            <strong>Allowances Saved</strong>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const emptySpecialPayRow = (index = 0) => ({
  id: null,
  srNo: index + 1,
  wageCode: "",
  description: "",
  amount: ""
});

function SpecialPayEdit() {
  const today = new Date();
  const [employeeCode, setEmployeeCode] = useState("");
  const [period, setPeriod] = useState({ month: String(today.getMonth() + 1), year: String(today.getFullYear()) });
  const [employee, setEmployee] = useState(null);
  const [rows, setRows] = useState([emptySpecialPayRow()]);
  const [wageCodes, setWageCodes] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  useEffect(() => {
    getWageCodes()
      .then(setWageCodes)
      .catch((error) => setStatus({ type: "error", message: error.message }));
  }, []);

  const loadSpecialPay = async () => {
    if (!employeeCode.trim() || !period.month || !period.year) {
      setStatus({ type: "error", message: "Employee code, month, and year are required." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await getSpecialPay(employeeCode.trim(), period);
      setEmployee(result.data.employee);
      setRows(result.data.entries.length ? result.data.entries.map((entry, index) => ({
        id: entry.id,
        srNo: index + 1,
        wageCode: entry.wageCode,
        description: entry.description || "",
        amount: entry.amount
      })) : [emptySpecialPayRow()]);
      setStatus({ type: "success", message: "Special pay loaded." });
    } catch (error) {
      setEmployee(null);
      setRows([emptySpecialPayRow()]);
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (rowIndex, field, value) => {
    setRows((current) => current.map((row, index) => {
      if (index !== rowIndex) return row;
      const next = { ...row, [field]: value };
      if (field === "wageCode") {
        const matched = wageCodes.find((wageCode) => wageCode.code === value);
        next.description = matched ? matched.description : row.description;
      }
      return next;
    }));
  };

  const addRow = () => setRows((current) => [...current, emptySpecialPayRow(current.length)]);

  const removeRow = async (rowIndex) => {
    const row = rows[rowIndex];

    if (row.id) {
      try {
        await deleteSpecialPayEntry(row.id);
        setStatus({ type: "success", message: "Special pay row deleted." });
      } catch (error) {
        setStatus({ type: "error", message: error.message });
        return;
      }
    }

    setRows((current) => {
      const next = current.filter((_row, index) => index !== rowIndex).map((item, index) => ({ ...item, srNo: index + 1 }));
      return next.length ? next : [emptySpecialPayRow()];
    });
  };

  const saveRows = async () => {
    if (!employee) {
      setStatus({ type: "error", message: "Load employee before saving special pay." });
      return;
    }

    const cleanRows = rows.filter((row) => row.wageCode || row.amount);
    const invalidRow = cleanRows.find((row) => !row.wageCode || Number(row.amount || 0) === 0);

    if (invalidRow) {
      setStatus({ type: "error", message: "Each row needs code and non-zero amount." });
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await saveSpecialPay({
        employeeCode: employee.employeeCode,
        month: period.month,
        year: period.year,
        entries: cleanRows
      });
      setRows(result.data.entries.length ? result.data.entries.map((entry, index) => ({
        id: entry.id,
        srNo: index + 1,
        wageCode: entry.wageCode,
        description: entry.description || "",
        amount: entry.amount
      })) : [emptySpecialPayRow()]);
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="allowance-entry-panel special-pay-panel" aria-label="Special pay edit">
      <div className="allowance-title">Special Pay Edit</div>
      <div className="allowance-lookup">
        <label><span>Employee Code</span><input value={employeeCode} onChange={(event) => setEmployeeCode(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); loadSpecialPay(); } }} /></label>
        <label><span>Pay Month</span><input type="number" min="1" max="12" value={period.month} onChange={(event) => setPeriod((current) => ({ ...current, month: event.target.value }))} /></label>
        <label><span>Pay Year</span><input type="number" value={period.year} onChange={(event) => setPeriod((current) => ({ ...current, year: event.target.value }))} /></label>
        <button type="button" onClick={loadSpecialPay} disabled={loading}>{loading ? "Loading..." : "Load"}</button>
      </div>
      {status.message ? <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p> : null}
      <div className="allowance-details">
        <label><span>Name</span><input readOnly value={employee?.name || ""} /></label>
        <label><span>Place Of Posting</span><input readOnly value={employee?.placeOfPosting || ""} /></label>
        <label><span>Service Type</span><input readOnly value={employee?.serviceType || ""} /></label>
        <label><span>Designation</span><input readOnly value={employee?.designation || ""} /></label>
        <label><span>BPS</span><input readOnly value={employee?.bps || ""} /></label>
        <label><span>Department</span><input readOnly value={employee?.department || ""} /></label>
        <label><span>Gaz/NG</span><input readOnly value={employee?.gazNg || ""} /></label>
      </div>
      <div className="allowance-table-wrap">
        <table className="allowance-table">
          <thead><tr><th>Sr #</th><th>Code</th><th>Description</th><th>Amount</th><th>Delete</th></tr></thead>
          <tbody>{rows.map((row, index) => (
            <tr key={`${row.id || "new"}-${index}`}>
              <td>{index + 1}</td>
              <td><input list="special-pay-wage-codes" value={row.wageCode} onChange={(event) => updateRow(index, "wageCode", event.target.value)} /></td>
              <td><input value={row.description || ""} onChange={(event) => updateRow(index, "description", event.target.value)} /></td>
              <td><input type="number" step="0.01" value={row.amount} onChange={(event) => updateRow(index, "amount", event.target.value)} /></td>
              <td><button className="allowance-delete-button" type="button" onClick={() => removeRow(index)}><Trash2 size={16} /></button></td>
            </tr>
          ))}</tbody>
        </table>
        <datalist id="special-pay-wage-codes">
          {wageCodes.map((wageCode) => <option key={wageCode.code} value={wageCode.code}>{wageCode.description}</option>)}
        </datalist>
      </div>
      <div className="allowance-actions">
        <strong>Total: PKR {total.toLocaleString()}</strong>
        <button type="button" onClick={addRow}>Add Row</button>
        <button type="button" onClick={saveRows} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
      </div>
    </section>
  );
}

function ChequePrintPage({ bankType }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ chequeDate: today, payeeName: "", amount: "" });
  const [cheque, setCheque] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const title = bankType === "BOP" ? "Cheque Printing BOP" : "Cheque Printing SDA";

  const submit = async () => {
    if (!form.chequeDate || !form.payeeName || Number(form.amount || 0) <= 0) {
      setStatus({ type: "error", message: "Date, payee name, and amount are required." });
      return;
    }

    try {
      const result = await printCheque({ ...form, bankType });
      setCheque(result.data);
      setStatus({ type: "success", message: result.message });
      window.setTimeout(() => printCurrentDocumentAsExcel(title), 150);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <section className="employee-entry-panel cheque-print-panel">
      <div className="form-title-row"><div><p>Transactions</p><h2>{title}</h2></div></div>
      <div className="report-filter-panel no-print">
        <label><span>Date</span><input type="date" value={form.chequeDate} onChange={(event) => setForm((current) => ({ ...current, chequeDate: event.target.value }))} /></label>
        <label><span>Payee Name</span><input value={form.payeeName} onChange={(event) => setForm((current) => ({ ...current, payeeName: event.target.value }))} /></label>
        <label><span>Amount</span><input type="number" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} /></label>
        <div className="report-filter-actions"><button type="button" onClick={submit}>Print Cheque</button><button type="button" onClick={() => { setCheque(null); setForm({ chequeDate: today, payeeName: "", amount: "" }); }}>Go Back</button></div>
      </div>
      {status.message ? <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p> : null}
      {cheque ? (
        <div className="cheque-print-layout">
          <div className="cheque-bank">{cheque.bankType === "BOP" ? "Bank of Punjab" : "SDA"}</div>
          <div className="cheque-date">Date: {cheque.chequeDate}</div>
          <div className="cheque-payee">Pay to: <strong>{cheque.payeeName}</strong></div>
          <div className="cheque-amount">PKR {formatCurrency(cheque.amount)}</div>
          <div className="cheque-no">Cheque #: {cheque.chequeNo}</div>
        </div>
      ) : null}
    </section>
  );
}

function MonthRangeExportPage({ type }) {
  const today = new Date();
  const [filters, setFilters] = useState({ fromMonth: "1", fromYear: String(today.getFullYear()), toMonth: String(today.getMonth() + 1), toYear: String(today.getFullYear()), outputSelection: "screen" });
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const isTax = type === "tax";
  const title = isTax ? "Income Tax Schedule" : "Complete Allowances";

  const loadReport = async (excel = false) => {
    try {
      const result = isTax ? await getTaxScheduleExport(filters) : await getAllowancesExport(filters);
      setReport(result.data);
      setStatus({ type: result.data.rows.length ? "success" : "error", message: result.data.rows.length ? "Report loaded." : "No records found." });
      if (excel || filters.outputSelection === "excel") {
        const rows = isTax
          ? result.data.rows.map((row) => ({ "Employee Code": row.employeeCode, Name: row.name, "Tax Amount": row.taxAmount, Month: row.month, Year: row.year }))
          : result.data.rows.map((row) => ({ "Employee Code": row.employeeCode, Name: row.name, "Wage Code": row.wageCode, Description: row.description, Amount: row.amount, "Effective Date": row.effectiveDate }));
        exportRowsToExcel(rows, `${isTax ? "income-tax-schedule" : "complete-allowances"}-${filters.fromMonth}-${filters.fromYear}-to-${filters.toMonth}-${filters.toYear}.xlsx`);
      }
      if (!excel && filters.outputSelection === "printer") window.setTimeout(() => printCurrentDocumentAsExcel(title), 150);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <section className="employee-entry-panel arrear-report-panel">
      <div className="form-title-row"><div><p>Transactions</p><h2>{title}</h2></div></div>
      <div className="report-filter-panel no-print">
        <label><span>From Month</span><input type="number" min="1" max="12" value={filters.fromMonth} onChange={(event) => setFilters((current) => ({ ...current, fromMonth: event.target.value }))} /></label>
        <label><span>From Year</span><input type="number" value={filters.fromYear} onChange={(event) => setFilters((current) => ({ ...current, fromYear: event.target.value }))} /></label>
        <label><span>To Month</span><input type="number" min="1" max="12" value={filters.toMonth} onChange={(event) => setFilters((current) => ({ ...current, toMonth: event.target.value }))} /></label>
        <label><span>To Year</span><input type="number" value={filters.toYear} onChange={(event) => setFilters((current) => ({ ...current, toYear: event.target.value }))} /></label>
        <fieldset><legend>Output Selection</legend><label><input type="radio" value="screen" checked={filters.outputSelection === "screen"} onChange={(event) => setFilters((current) => ({ ...current, outputSelection: event.target.value }))} /> View</label><label><input type="radio" value="printer" checked={filters.outputSelection === "printer"} onChange={(event) => setFilters((current) => ({ ...current, outputSelection: event.target.value }))} /> Print</label><label><input type="radio" value="excel" checked={filters.outputSelection === "excel"} onChange={(event) => setFilters((current) => ({ ...current, outputSelection: event.target.value }))} /> Save as Excel</label></fieldset>
        <div className="report-filter-actions"><button type="button" onClick={() => loadReport(false)}>OK</button><button type="button" onClick={() => loadReport(true)}>Save as Excel</button></div>
      </div>
      {status.message ? <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p> : null}
      {report ? (
        <div className="arrear-report-print-area">
          <ReportLetterhead title={title} filterSummary={`${filters.fromMonth}/${filters.fromYear} to ${filters.toMonth}/${filters.toYear}`} />
          <table className="print-report-table">
            <thead>{isTax ? <tr><th>Employee Code</th><th>Name</th><th>Tax Amount</th><th>Month</th><th>Year</th></tr> : <tr><th>Employee Code</th><th>Name</th><th>Wage Code</th><th>Description</th><th>Amount</th><th>Effective Date</th></tr>}</thead>
            <tbody>
              {(report.rows || []).map((row, index) => isTax ? (
                <tr key={index}><td>{row.employeeCode}</td><td>{row.name}</td><td className="amount-cell">{formatCurrency(row.taxAmount)}</td><td>{row.month}</td><td>{row.year}</td></tr>
              ) : (
                <tr key={index}><td>{row.employeeCode}</td><td>{row.name}</td><td>{row.wageCode}</td><td>{row.description}</td><td className="amount-cell">{formatCurrency(row.amount)}</td><td>{row.effectiveDate}</td></tr>
              ))}
              <tr className="report-total-row"><td colSpan={isTax ? 2 : 4}>Grand Total</td><td className="amount-cell">{formatCurrency(report.grandTotal)}</td><td colSpan={isTax ? 2 : 1}></td></tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

const emptyArrearRow = (index = 0) => ({
  srNo: index + 1,
  periodNo: index + 1,
  periodLabel: "",
  accountCode: "",
  description: "",
  amount: ""
});

function ArrearBillEntry() {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    id: null,
    documentNo: "",
    billDate: today,
    placeOfPosting: "Hospital",
    employeeCode: "",
    employeeName: "",
    status: "draft",
    items: [emptyArrearRow()]
  });
  const [wageCodes, setWageCodes] = useState([]);
  const [bills, setBills] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [toast, setToast] = useState({ type: "", message: "" });
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showPrintPanel, setShowPrintPanel] = useState(false);
  const [printFilters, setPrintFilters] = useState({
    employeeCode: "",
    employeeName: "",
    fromDate: today,
    toDate: today
  });
  const [specialPrintFilters, setSpecialPrintFilters] = useState({
    status: "finalized",
    fromDate: today,
    toDate: today
  });
  const [printReport, setPrintReport] = useState({ bills: [], grandTotal: 0, loaded: false });
  const [showSpecialPrintPanel, setShowSpecialPrintPanel] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const isDraft = form.status === "draft";
  const totalAmount = form.items.reduce((total, item) => total + Number(item.amount || 0), 0);
  const filteredBills = bills.filter((bill) => {
    const query = filters.search.trim().toLowerCase();
    const matchesSearch = !query || [bill.documentNo, bill.employeeCode, bill.employeeName]
      .some((value) => String(value || "").toLowerCase().includes(query));
    const matchesStatus = !filters.status || bill.status === filters.status;
    return matchesSearch && matchesStatus;
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast({ type: "", message: "" }), 2600);
  };

  const loadNextDocumentNo = async () => {
    try {
      const result = await getNextArrearDocumentNo();
      setForm((current) => ({ ...current, documentNo: result.data.documentNo }));
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const loadBills = async () => {
    try {
      const result = await getArrearBills();
      setBills(result.data);
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const loadWageCodes = async () => {
    try {
      const result = await getWageCodes();
      setWageCodes(
        result.filter((wageCode) =>
          ["Pay Codes", "Allowance Codes", "Pay & Allowance Adjustment Codes"].includes(wageCode.category)
        )
      );
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const resetForm = async () => {
    setForm({
      id: null,
      documentNo: "",
      billDate: today,
      placeOfPosting: "Hospital",
      employeeCode: "",
      employeeName: "",
      status: "draft",
      items: [emptyArrearRow()]
    });
    setStatus({ type: "", message: "" });
    await loadNextDocumentNo();
  };

  const openEntryForm = async () => {
    await resetForm();
    setShowEntryForm(true);
  };

  const closeEntryForm = async () => {
    await resetForm();
    setShowEntryForm(false);
  };

  const lookupEmployee = async () => {
    if (!form.employeeCode.trim()) {
      setStatus({ type: "error", message: "Employee code is required." });
      return;
    }

    setLoadingEmployee(true);
    setStatus({ type: "", message: "" });

    try {
      const employee = await getEmployeeByCode(form.employeeCode.trim());
      setForm((current) => ({
        ...current,
        employeeName: employee.name,
        placeOfPosting: employee.placeOfPosting || current.placeOfPosting
      }));
      setStatus({ type: "success", message: "Employee loaded." });
    } catch (error) {
      setForm((current) => ({ ...current, employeeName: "" }));
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoadingEmployee(false);
    }
  };

  const updateHeader = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateItem = (rowIndex, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, index) => {
        if (index !== rowIndex) {
          return item;
        }

        const nextItem = { ...item, [field]: value };

        if (field === "accountCode") {
          const matchedWageCode = wageCodes.find((wageCode) => wageCode.code === value);
          nextItem.description = matchedWageCode ? matchedWageCode.description : item.description;
        }

        return nextItem;
      })
    }));
  };

  const addRow = () => {
    if (!isDraft) {
      showToast("error", "Finalized arrear bills cannot be edited.");
      return;
    }

    setForm((current) => ({
      ...current,
      items: [...current.items, emptyArrearRow(current.items.length)]
    }));
  };

  const removeRow = (rowIndex) => {
    if (!isDraft) {
      showToast("error", "Finalized arrear bills cannot be edited.");
      return;
    }

    setForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? [emptyArrearRow()]
          : current.items
              .filter((_item, index) => index !== rowIndex)
              .map((item, index) => ({ ...item, srNo: index + 1, periodNo: item.periodNo || index + 1 }))
    }));
  };

  const validateForm = () => {
    if (!form.employeeCode || !form.employeeName) {
      return "Valid employee code is required.";
    }

    if (!form.items.length) {
      return "At least one arrear row is required.";
    }

    const invalidRow = form.items.find(
      (item) => !item.periodNo || !item.periodLabel || !item.accountCode || Number(item.amount || 0) <= 0
    );

    if (invalidRow) {
      return "Each row needs P#, Period, A/C Code, and Amount greater than 0.";
    }

    return "";
  };

  const saveBill = async (closeAfterSave = false) => {
    const validationMessage = validateForm();

    if (validationMessage) {
      setStatus({ type: "error", message: validationMessage });
      return null;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    const payload = {
      billDate: form.billDate,
      placeOfPosting: form.placeOfPosting,
      employeeCode: form.employeeCode,
      items: form.items
    };

    try {
      const result = form.id
        ? await updateArrearBill(form.id, payload)
        : await createArrearBill(payload);
      const savedBill = result.data;
      setForm({
        id: savedBill.id,
        documentNo: savedBill.documentNo,
        billDate: savedBill.billDate,
        placeOfPosting: savedBill.placeOfPosting,
        employeeCode: savedBill.employeeCode,
        employeeName: savedBill.employeeName,
        status: savedBill.status,
        items: savedBill.items.map((item) => ({
          srNo: item.srNo,
          periodNo: item.periodNo,
          periodLabel: item.periodLabel,
          accountCode: item.accountCode,
          description: item.description || item.wageDescription || "",
          amount: item.amount
        }))
      });
      showToast("success", result.message);
      await loadBills();
      if (closeAfterSave) {
        await resetForm();
        setShowEntryForm(false);
      }
      return savedBill;
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      showToast("error", error.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const finalizeSavedBill = async (savedBill) => {
    try {
      const result = await finalizeArrearBill(savedBill.id);
      showToast("success", result.message);
      await loadBills();
      await loadBillIntoForm(result.data);
      await resetForm();
      setShowEntryForm(false);
    } catch (error) {
      showToast("error", error.message);
      setStatus({ type: "error", message: error.message });
    }
  };

  const finalizeBill = async () => {
    const savedBill = form.id ? form : await saveBill();

    if (!savedBill?.id) {
      return;
    }

    setConfirmDialog({
      tone: "success",
      title: "Finalize Arrear Bill",
      message: "Finalize this arrear bill? It will be locked from editing.",
      confirmLabel: "Finalize",
      onConfirm: () => finalizeSavedBill(savedBill)
    });
  };

  const updateBillStatus = async (nextStatus) => {
    if (nextStatus === form.status) {
      return;
    }

    if (!form.id && nextStatus === "draft") {
      return;
    }

    if (!form.id && nextStatus === "cancelled") {
      showToast("error", "Save the arrear bill before cancelling it.");
      return;
    }

    if (isDraft && nextStatus === "finalized") {
      const savedBill = await saveBill();
      if (!savedBill?.id) {
        return;
      }

      await finalizeSavedBill(savedBill);
      return;
    }

    try {
      const result = await updateArrearBillStatus(form.id, nextStatus);
      showToast("success", result.message);
      await loadBills();
      await loadBillIntoForm(result.data);
    } catch (error) {
      showToast("error", error.message);
      setStatus({ type: "error", message: error.message });
    }
  };

  const updateListBillStatus = async (bill, nextStatus) => {
    if (nextStatus === bill.status) {
      return;
    }

    try {
      const result = await updateArrearBillStatus(bill.id, nextStatus);
      showToast("success", result.message);
      await loadBills();

      if (form.id === bill.id) {
        await loadBillIntoForm(result.data);
      }
    } catch (error) {
      showToast("error", error.message);
      setStatus({ type: "error", message: error.message });
    }
  };

  const deleteSavedBill = async () => {
    try {
      const result = await deleteArrearBill(form.id);
      showToast("success", result.message);
      await loadBills();
      await resetForm();
      setShowEntryForm(false);
    } catch (error) {
      showToast("error", error.message);
      setStatus({ type: "error", message: error.message });
    }
  };

  const deleteBillFromList = async (bill) => {
    try {
      const result = await deleteArrearBill(bill.id);
      showToast("success", result.message);
      await loadBills();

      if (form.id === bill.id) {
        await resetForm();
      }
    } catch (error) {
      showToast("error", error.message);
      setStatus({ type: "error", message: error.message });
    }
  };

  const deleteBill = async () => {
    if (!form.id) {
      return;
    }

    setConfirmDialog({
      tone: "danger",
      title: "Delete Arrear Bill",
      message: `Delete document #${form.documentNo}?`,
      confirmLabel: "Delete",
      onConfirm: deleteSavedBill
    });
  };

  const loadBillIntoForm = async (bill) => {
    setForm({
      id: bill.id,
      documentNo: bill.documentNo,
      billDate: bill.billDate,
      placeOfPosting: bill.placeOfPosting,
      employeeCode: bill.employeeCode,
      employeeName: bill.employeeName,
      status: bill.status,
      items: bill.items.map((item) => ({
        srNo: item.srNo,
        periodNo: item.periodNo,
        periodLabel: item.periodLabel,
        accountCode: item.accountCode,
        description: item.description || item.wageDescription || "",
        amount: item.amount
      }))
    });
    setStatus({ type: "", message: "" });
  };

  const updatePrintFilter = (event) => {
    const { name, value } = event.target;
    setPrintFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === "employeeCode" ? { employeeName: "" } : {})
    }));
  };

  const updateSpecialPrintFilter = (event) => {
    const { name, value } = event.target;
    setSpecialPrintFilters((current) => ({ ...current, [name]: value }));
  };

  const loadPrintEmployee = async () => {
    if (!printFilters.employeeCode.trim()) {
      setStatus({ type: "error", message: "Employee code is required for printing." });
      return null;
    }

    try {
      const employee = await getEmployeeByCode(printFilters.employeeCode.trim());
      setPrintFilters((current) => ({ ...current, employeeName: employee.name }));
      setStatus({ type: "", message: "" });
      return employee;
    } catch (error) {
      setPrintFilters((current) => ({ ...current, employeeName: "" }));
      setStatus({ type: "error", message: error.message });
      return null;
    }
  };

  const printArrearBills = async () => {
    if (!printFilters.employeeCode.trim()) {
      setStatus({ type: "error", message: "Employee code is required for printing." });
      return;
    }

    if (!printFilters.fromDate || !printFilters.toDate) {
      setStatus({ type: "error", message: "From date and end date are required." });
      return;
    }

    if (printFilters.fromDate > printFilters.toDate) {
      setStatus({ type: "error", message: "From date cannot be after end date." });
      return;
    }

    setPrinting(true);
    setStatus({ type: "", message: "" });

    try {
      const employee = printFilters.employeeName ? null : await loadPrintEmployee();

      if (!printFilters.employeeName && !employee) {
        return;
      }

      const result = await getArrearBillReport({
        employeeCode: printFilters.employeeCode.trim(),
        fromDate: printFilters.fromDate,
        toDate: printFilters.toDate,
        sortBy: "doc_no"
      });
      setPrintReport({
        bills: result.data || [],
        grandTotal: result.grand_total || 0,
        loaded: true
      });
      setShowEntryForm(false);
      window.setTimeout(() => printCurrentDocumentAsExcel("arrear-bill-print"), 150);
    } catch (error) {
      setPrintReport({ bills: [], grandTotal: 0, loaded: false });
      setStatus({ type: "error", message: error.message || "Arrear bills not found." });
    } finally {
      setPrinting(false);
    }
  };

  const printSpecialArrearBills = async () => {
    if (!specialPrintFilters.fromDate || !specialPrintFilters.toDate) {
      setStatus({ type: "error", message: "From date and end date are required." });
      return;
    }

    if (specialPrintFilters.fromDate > specialPrintFilters.toDate) {
      setStatus({ type: "error", message: "From date cannot be after end date." });
      return;
    }

    setPrinting(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await getArrearBillReport({
        employeeCode: "0",
        fromDate: specialPrintFilters.fromDate,
        toDate: specialPrintFilters.toDate,
        status: specialPrintFilters.status,
        sortBy: "employee_code"
      });
      setPrintReport({
        bills: result.data || [],
        grandTotal: result.grand_total || 0,
        loaded: true
      });
      setShowEntryForm(false);
      window.setTimeout(() => printCurrentDocumentAsExcel("arrear-bill-special-print"), 150);
    } catch (error) {
      setPrintReport({ bills: [], grandTotal: 0, loaded: false });
      setStatus({ type: "error", message: error.message || "Arrear bills not found." });
    } finally {
      setPrinting(false);
    }
  };

  useEffect(() => {
    loadNextDocumentNo();
    loadWageCodes();
    loadBills();
  }, []);

  return (
    <section className="employee-entry-panel arrear-entry-panel" aria-label="Arrear bill entry">
      {toast.message ? <div className={`toast-notice ${toast.type}`}>{toast.message}</div> : null}
      {confirmDialog ? (
        <div className="modal-backdrop soft-modal-backdrop" role="dialog" aria-modal="true" aria-label={confirmDialog.title}>
          <div className={`confirm-modal ${confirmDialog.tone || "neutral"}`}>
            <img src="/logo.png" alt="Wazirabad Cardiology Hospital" />
            <div>
              <p>Confirmation</p>
              <h3>{confirmDialog.title}</h3>
              <span>{confirmDialog.message}</span>
            </div>
            <div className="confirm-modal-actions">
              <button type="button" onClick={() => setConfirmDialog(null)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await action();
                }}
              >
                {confirmDialog.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="form-title-row no-print">
        <div>
          <p>Arrear Bill</p>
          <h2>Arrear Bill Entry</h2>
        </div>
        <div className="title-actions">
          {showEntryForm ? <span className={`bill-status-badge ${form.status}`}>{form.status}</span> : null}
          <button className="refresh-button" type="button" onClick={openEntryForm}>
            Enter Arrear Bill
          </button>
        </div>
      </div>

      {status.message ? <p className={`form-status ${status.type || "neutral"} no-print`}>{status.message}</p> : null}

      {showEntryForm ? (
        <>
          <div className="arrear-header-grid">
            <label>
              <span>Date</span>
              <input type="date" name="billDate" value={form.billDate} onChange={updateHeader} disabled={!isDraft} />
            </label>
            <label>
              <span>Document #</span>
              <input readOnly value={form.documentNo || ""} />
            </label>
            <label>
              <span>Status</span>
              <select name="status" value={form.status} onChange={(event) => updateBillStatus(event.target.value)} disabled={saving}>
                <option value="draft">Draft</option>
                <option value="finalized">Finalized</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>
              <span>Place Of Posting</span>
              <input name="placeOfPosting" value={form.placeOfPosting} onChange={updateHeader} disabled={!isDraft} />
            </label>
            <label>
              <span>Employee Code</span>
              <div className="inline-lookup">
                <input
                  type="number"
                  name="employeeCode"
                  value={form.employeeCode}
                  onChange={updateHeader}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      lookupEmployee();
                    }
                  }}
                  disabled={!isDraft}
                />
                <button type="button" onClick={lookupEmployee} disabled={loadingEmployee || !isDraft}>
                  {loadingEmployee ? "..." : "Load"}
                </button>
              </div>
            </label>
            <label className="wide-field">
              <span>Employee Name</span>
              <input readOnly value={form.employeeName} />
            </label>
          </div>

          <div className="table-wrap arrear-table-wrap">
            <table className="arrear-entry-table">
              <thead>
                <tr>
                  <th>Sr#</th>
                  <th>P#</th>
                  <th>Period</th>
                  <th>A/C Code</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, index) => (
                  <tr key={`${item.srNo}-${index}`}>
                    <td>{index + 1}</td>
                    <td>
                      <input type="number" min="1" value={item.periodNo} onChange={(event) => updateItem(index, "periodNo", event.target.value)} disabled={!isDraft} />
                    </td>
                    <td>
                      <input value={item.periodLabel} onChange={(event) => updateItem(index, "periodLabel", event.target.value)} placeholder="Jan-2026" disabled={!isDraft} />
                    </td>
                    <td>
                      <select value={item.accountCode} onChange={(event) => updateItem(index, "accountCode", event.target.value)} disabled={!isDraft}>
                        <option value="">Select</option>
                        {wageCodes.map((wageCode) => (
                          <option value={wageCode.code} key={wageCode.code}>
                            {wageCode.code} - {wageCode.description}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} disabled={!isDraft} />
                    </td>
                    <td>
                      <input type="number" min="0" step="0.01" value={item.amount} onChange={(event) => updateItem(index, "amount", event.target.value)} disabled={!isDraft} />
                    </td>
                    <td>
                      <button className="table-danger-button" type="button" onClick={() => removeRow(index)}>
                        {form.items.length === 1 ? "Clear" : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="arrear-footer-row">
            <button className="refresh-button" type="button" onClick={addRow}>Add Row</button>
            <strong>Total: PKR {totalAmount.toLocaleString()}</strong>
          </div>

          <div className="form-actions">
            <button type="button" onClick={closeEntryForm}>Cancel</button>
            <button type="button" onClick={() => saveBill(true)} disabled={saving || !isDraft}>{saving ? "Saving..." : "Save Draft"}</button>
            <button type="button" onClick={finalizeBill} disabled={!isDraft}>Finalize</button>
            <button type="button" onClick={deleteBill} disabled={!form.id || !isDraft}>Delete</button>
          </div>
        </>
      ) : null}

      <div className="arrear-list-section no-print">
        <div className="form-title-row compact-title-row">
          <div>
            <p>Saved Bills</p>
            <h2>Previous Arrear Bills</h2>
          </div>
          <div className="title-actions">
            <button className="refresh-button" type="button" onClick={() => setShowPrintPanel((current) => !current)}>
              Print
            </button>
            <button className="refresh-button" type="button" onClick={() => setShowSpecialPrintPanel((current) => !current)}>
              Special Print
            </button>
          </div>
        </div>
        {showPrintPanel ? (
          <div className="inline-print-panel">
            <label>
              <span>Employee Code</span>
              <input
                name="employeeCode"
                type="text"
                value={printFilters.employeeCode}
                onChange={updatePrintFilter}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    loadPrintEmployee();
                  }
                }}
                placeholder="Enter employee code"
              />
            </label>
            <label>
              <span>Employee Name</span>
              <input readOnly value={printFilters.employeeName} placeholder="Employee name" />
            </label>
            <label>
              <span>From Date</span>
              <input type="date" name="fromDate" value={printFilters.fromDate} onChange={updatePrintFilter} />
            </label>
            <label>
              <span>End Date</span>
              <input type="date" name="toDate" value={printFilters.toDate} onChange={updatePrintFilter} />
            </label>
            <div className="report-filter-actions">
              <button type="button" onClick={loadPrintEmployee} disabled={printing}>
                Load
              </button>
              <button type="button" onClick={printArrearBills} disabled={printing}>
                {printing ? "Loading..." : "Print"}
              </button>
              <button type="button" onClick={() => {
                setPrintFilters({ employeeCode: "", employeeName: "", fromDate: today, toDate: today });
                setPrintReport({ bills: [], grandTotal: 0, loaded: false });
                setShowPrintPanel(false);
              }}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        {showSpecialPrintPanel ? (
          <div className="inline-print-panel special-print-panel">
            <label>
              <span>Status</span>
              <select name="status" value={specialPrintFilters.status} onChange={updateSpecialPrintFilter}>
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="finalized">Finalized</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label>
              <span>From Date</span>
              <input type="date" name="fromDate" value={specialPrintFilters.fromDate} onChange={updateSpecialPrintFilter} />
            </label>
            <label>
              <span>End Date</span>
              <input type="date" name="toDate" value={specialPrintFilters.toDate} onChange={updateSpecialPrintFilter} />
            </label>
            <div className="report-filter-actions">
              <button type="button" onClick={printSpecialArrearBills} disabled={printing}>
                {printing ? "Loading..." : "Print"}
              </button>
              <button type="button" onClick={() => {
                setSpecialPrintFilters({ status: "finalized", fromDate: today, toDate: today });
                setPrintReport({ bills: [], grandTotal: 0, loaded: false });
                setShowSpecialPrintPanel(false);
              }}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        <div className="table-toolbar arrear-filter-toolbar">
          <label>
            <span>Search</span>
            <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Document, employee code, name..." />
          </label>
          <label>
            <span>Status</span>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
        </div>
        <div className="table-wrap">
          <table className="department-table arrear-list-table">
            <thead>
              <tr>
                <th>Document #</th>
                <th>Date</th>
                <th>Employee</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill.id}>
                  <td>{bill.documentNo}</td>
                  <td>{bill.billDate}</td>
                  <td>{bill.employeeName} ({bill.employeeCode})</td>
                  <td>PKR {Number(bill.totalAmount || 0).toLocaleString()}</td>
                  <td>
                    <select
                      className="table-status-select"
                      value={bill.status}
                      onChange={(event) => updateListBillStatus(bill, event.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="finalized">Finalized</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <div className="arrear-list-actions">
                      <button className="refresh-button" type="button" onClick={async () => {
                        try {
                          const result = await getArrearBill(bill.id);
                          await loadBillIntoForm(result.data);
                          setShowEntryForm(true);
                        } catch (error) {
                          showToast("error", error.message);
                        }
                      }}>
                        View/Edit
                      </button>
                      <button
                        className="table-danger-button"
                        type="button"
                        onClick={() => setConfirmDialog({
                          tone: "danger",
                          title: "Delete Arrear Bill",
                          message: `Delete document #${bill.documentNo}?`,
                          confirmLabel: "Delete",
                          onConfirm: () => deleteBillFromList(bill)
                        })}
                        disabled={bill.status !== "draft"}
                        title={bill.status === "draft" ? "Delete draft bill" : "Only draft bills can be deleted"}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredBills.length ? (
                <tr>
                  <td colSpan="6">No arrear bills found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      {printReport.loaded ? (
        <ArrearBillReportView
          bills={printReport.bills}
          groupBy={showSpecialPrintPanel ? "employee_code" : "doc_no"}
          filters={{
            employeeCode: showSpecialPrintPanel ? "0" : printFilters.employeeCode,
            fromDate: showSpecialPrintPanel ? specialPrintFilters.fromDate : printFilters.fromDate,
            toDate: showSpecialPrintPanel ? specialPrintFilters.toDate : printFilters.toDate,
            status: showSpecialPrintPanel ? specialPrintFilters.status : ""
          }}
          grandTotal={printReport.grandTotal}
        />
      ) : null}
    </section>
  );
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function groupBillsByEmployee(bills) {
  return bills.reduce((groups, bill) => {
    const key = bill.employee_code;
    const existingGroup = groups.find((group) => group.employeeCode === key);
    const nextBill = { ...bill, total_amount: Number(bill.total_amount || 0) };

    if (existingGroup) {
      existingGroup.bills.push(nextBill);
      existingGroup.subtotal += nextBill.total_amount;
      return groups;
    }

    groups.push({
      employeeCode: bill.employee_code,
      employeeName: bill.employee_name,
      bills: [nextBill],
      subtotal: nextBill.total_amount
    });
    return groups;
  }, []);
}

function ReportLetterhead({ title, filterSummary }) {
  return (
    <div className="report-letterhead">
      <img src="/logo.png" alt="Wazirabad Cardiology Hospital" />
      <div>
        <h2>Wazirabad Institute Of Cardiology</h2>
        <p>Hospital Payroll System</p>
        <h3>{title}</h3>
        <span>{filterSummary}</span>
      </div>
    </div>
  );
}

function ArrearPaymentPage() {
  const today = new Date().toISOString().slice(0, 10);
  const emptyForm = {
    paymentNo: "",
    paymentDate: today,
    arrearBillId: "",
    paymentMode: "bank",
    paymentAccountCode: "",
    referenceNo: "",
    amount: "",
    notes: ""
  };

  const [form, setForm] = useState(emptyForm);
  const [billOptions, setBillOptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [toast, setToast] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedBill = billOptions.find((bill) => String(bill.id) === String(form.arrearBillId)) || null;
  const outstandingAmount = selectedBill ? Number(selectedBill.balanceAmount || 0) : 0;

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast({ type: "", message: "" }), 2600);
  };

  const loadData = async () => {
    setLoading(true);
    setStatus({ type: "", message: "Loading arrear payments..." });

    try {
      const [nextPayment, billsResult, paymentsResult, accountRecords] = await Promise.all([
        getNextArrearPaymentNo(),
        getPayableArrearBills(),
        getArrearPayments(),
        getChartOfAccounts()
      ]);

      const billRecords = billsResult.data || [];
      const paymentRecords = paymentsResult.data || [];
      const accountList = accountRecords || [];

      setBillOptions(billRecords);
      setPayments(paymentRecords);
      setAccounts(accountList);
      setForm((current) => ({
        ...current,
        paymentNo: nextPayment.data.paymentNo,
        arrearBillId: current.arrearBillId || billRecords[0]?.id || "",
        amount: current.amount || String(Number(billRecords[0]?.balanceAmount || 0).toFixed(2))
      }));
      setStatus({
        type: "",
        message: `${billRecords.length} bill(s) payable, ${paymentRecords.length} payment(s) loaded.`
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      paymentNo: form.paymentNo || ""
    });
  };

  const handleBillChange = (event) => {
    const arrearBillId = event.target.value;
    const nextBill = billOptions.find((bill) => String(bill.id) === String(arrearBillId));
    setForm((current) => ({
      ...current,
      arrearBillId,
      amount: nextBill ? Number(nextBill.balanceAmount || 0).toFixed(2) : current.amount,
      paymentAccountCode: current.paymentAccountCode || ""
    }));
  };

  const submitPayment = async () => {
    if (!form.arrearBillId) {
      setStatus({ type: "error", message: "Select an arrear bill first." });
      return;
    }

    if (!form.paymentDate) {
      setStatus({ type: "error", message: "Payment date is required." });
      return;
    }

    if (!form.paymentAccountCode) {
      setStatus({ type: "error", message: "Select a payment account." });
      return;
    }

    const amount = Number(form.amount || 0);
    if (amount <= 0) {
      setStatus({ type: "error", message: "Payment amount must be greater than 0." });
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await createArrearPayment({
        arrearBillId: form.arrearBillId,
        paymentDate: form.paymentDate,
        paymentMode: form.paymentMode,
        paymentAccountCode: form.paymentAccountCode,
        referenceNo: form.referenceNo,
        amount,
        notes: form.notes,
        paidBy: "Hospital Admin"
      });

      showToast("success", result.message);
      await loadData();
      setForm((current) => ({
        ...current,
        paymentNo: result.data?.payment?.paymentNo || current.paymentNo,
        amount: String(Number(result.data?.billStatus?.balanceAmount || 0).toFixed(2))
      }));
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      showToast("error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const reversePayment = async (payment) => {
    if (!window.confirm(`Reverse arrear payment #${payment.paymentNo}?`)) {
      return;
    }

    try {
      const result = await reverseArrearPayment(payment.id);
      showToast("success", result.message);
      await loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      showToast("error", error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <section className="employee-entry-panel arrear-entry-panel" aria-label="Arrear payment entry">
      {toast.message ? <div className={`toast-notice ${toast.type}`}>{toast.message}</div> : null}

      <div className="form-title-row no-print">
        <div>
          <p>Arrear Bill</p>
          <h2>Arrear Payment</h2>
        </div>
        <div className="title-actions">
          <button className="refresh-button" type="button" onClick={loadData} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {status.message ? <p className={`form-status ${status.type || "neutral"} no-print`}>{status.message}</p> : null}

      <div className="arrear-header-grid">
        <label>
          <span>Payment #</span>
          <input readOnly value={form.paymentNo || ""} />
        </label>
        <label>
          <span>Payment Date</span>
          <input type="date" value={form.paymentDate} onChange={(event) => setForm((current) => ({ ...current, paymentDate: event.target.value }))} />
        </label>
        <label>
          <span>Arrear Bill</span>
          <select value={form.arrearBillId} onChange={handleBillChange}>
            <option value="">Select arrear bill</option>
            {billOptions.map((bill) => (
              <option key={bill.id} value={bill.id}>
                #{bill.documentNo} - {bill.employeeName} - Balance PKR {formatCurrency(bill.balanceAmount)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Bill Status</span>
          <input readOnly value={selectedBill ? selectedBill.status : ""} />
        </label>
        <label>
          <span>Bill Amount</span>
          <input readOnly value={selectedBill ? formatCurrency(selectedBill.totalAmount) : ""} />
        </label>
        <label>
          <span>Outstanding</span>
          <input readOnly value={selectedBill ? formatCurrency(selectedBill.balanceAmount) : ""} />
        </label>
        <label>
          <span>Payment Mode</span>
          <select value={form.paymentMode} onChange={(event) => setForm((current) => ({ ...current, paymentMode: event.target.value }))}>
            <option value="bank">Bank</option>
            <option value="cash">Cash</option>
          </select>
        </label>
        <label>
          <span>Payment Account</span>
          <select value={form.paymentAccountCode} onChange={(event) => setForm((current) => ({ ...current, paymentAccountCode: event.target.value }))}>
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.code} value={account.code}>
                {account.code} - {account.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Reference No.</span>
          <input value={form.referenceNo} onChange={(event) => setForm((current) => ({ ...current, referenceNo: event.target.value }))} placeholder="Cheque / voucher reference" />
        </label>
        <label>
          <span>Amount</span>
          <input type="number" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
        </label>
        <label className="wide-field">
          <span>Notes</span>
          <input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional note" />
        </label>
      </div>

      <div className="arrear-footer-row">
        <button type="button" onClick={submitPayment} disabled={saving || !selectedBill}>
          {saving ? "Posting..." : "Post Payment"}
        </button>
        <button type="button" onClick={resetForm}>Clear</button>
      </div>

      <div className="arrear-list-section no-print">
        <div className="form-title-row">
          <div>
            <p>Arrear Bill</p>
            <h2>Payment History</h2>
          </div>
          <span>{payments.length} record(s)</span>
        </div>

        <div className="table-wrap arrear-table-wrap">
          <table className="department-table arrear-list-table">
            <thead>
              <tr>
                <th>Payment #</th>
                <th>Bill #</th>
                <th>Employee</th>
                <th>Date</th>
                <th>Mode</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.length ? payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.paymentNo}</td>
                  <td>{payment.billNo}</td>
                  <td>{payment.employeeCode} - {payment.employeeName}</td>
                  <td>{payment.paymentDate}</td>
                  <td>{payment.paymentMode}</td>
                  <td>{payment.paymentAccountCode} - {payment.paymentAccountName}</td>
                  <td className="amount-cell">{formatCurrency(payment.amount)}</td>
                  <td>{payment.status}</td>
                  <td>
                    <div className="arrear-list-actions">
                      <button type="button" onClick={() => reversePayment(payment)} disabled={payment.status !== "posted"}>
                        Reverse
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9">No arrear payments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function EmployeeAdvancesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [form, setForm] = useState({
    advanceNo: "",
    employeeCode: "",
    issueDate: today,
    advanceAmount: "",
    monthlyInstallment: "",
    deductionMode: "full",
    deductionValue: "",
    balanceAmount: "",
    notes: "",
    status: "active"
  });

  const employeeOptions = employees
    .map((employee) => ({
      value: String(employee.employeeNo || employee.employee_no || ""),
      label: `${String(employee.employeeNo || employee.employee_no || "").trim()} - ${employee.name || "-"}`
    }))
    .filter((employee) => employee.value);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "advanceAmount" && !editingAdvance && !current.balanceAmount
        ? { balanceAmount: value }
        : {})
    }));
  };

  const loadData = async () => {
    setLoading(true);
    setStatus({ type: "", message: "Loading employee advances..." });

    try {
      const [nextNoResult, advanceRecords, employeeRecords] = await Promise.all([
        getNextEmployeeAdvanceNo(),
        getEmployeeAdvances(),
        getEmployees()
      ]);

      const normalizedEmployees = Array.isArray(employeeRecords) ? employeeRecords : [];

      setAdvances(Array.isArray(advanceRecords) ? advanceRecords : []);
      setEmployees(normalizedEmployees);
      setForm((current) => ({
        ...current,
        advanceNo: current.advanceNo || nextNoResult?.data?.advanceNo || "",
        employeeCode: current.employeeCode || normalizedEmployees[0]?.employeeNo || normalizedEmployees[0]?.employee_no || ""
      }));
      setStatus({
        type: "",
        message: `${Array.isArray(advanceRecords) ? advanceRecords.length : 0} advance record(s) loaded.`
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingAdvance(null);
    setForm((current) => ({
      advanceNo: current.advanceNo || "",
      employeeCode: employeeOptions[0]?.value || "",
      issueDate: today,
      advanceAmount: "",
      monthlyInstallment: "",
      deductionMode: "full",
      deductionValue: "",
      balanceAmount: "",
      notes: "",
      status: "active"
    }));
  };

  const startEdit = (advance) => {
    setEditingAdvance(advance);
    setForm({
      advanceNo: String(advance.advanceNo || ""),
      employeeCode: String(advance.employeeCode || ""),
      issueDate: String(advance.issueDate || today),
      advanceAmount: String(advance.advanceAmount ?? ""),
      monthlyInstallment: String(advance.monthlyInstallment ?? ""),
      deductionMode: advance.deductionMode || "full",
      deductionValue: String(advance.deductionValue ?? ""),
      balanceAmount: String(advance.balanceAmount ?? ""),
      notes: advance.notes || "",
      status: advance.status || "active"
    });
    setStatus({ type: "", message: "" });
  };

  const saveAdvance = async (event) => {
    event.preventDefault();

    if (!form.employeeCode) {
      setStatus({ type: "error", message: "Select an employee." });
      return;
    }

    if (!form.issueDate) {
      setStatus({ type: "error", message: "Issue date is required." });
      return;
    }

    if (Number(form.advanceAmount || 0) <= 0) {
      setStatus({ type: "error", message: "Advance amount must be greater than 0." });
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const payload = {
        employeeCode: form.employeeCode,
        issueDate: form.issueDate,
        advanceAmount: Number(form.advanceAmount || 0),
        monthlyInstallment: Number(form.monthlyInstallment || 0),
        deductionMode: form.deductionMode,
        deductionValue: form.deductionValue === "" ? "" : Number(form.deductionValue || 0),
        balanceAmount: form.balanceAmount === "" ? Number(form.advanceAmount || 0) : Number(form.balanceAmount || 0),
        notes: form.notes,
        status: form.status,
        createdBy: "Hospital Admin",
        updatedBy: "Hospital Admin"
      };

      const result = editingAdvance
        ? await updateEmployeeAdvance(editingAdvance.id, payload)
        : await createEmployeeAdvance(payload);

      setStatus({ type: "success", message: result.message });
      setEditingAdvance(null);
      await loadData();
      setForm((current) => ({
        ...current,
        advanceNo: result.data?.advanceNo || current.advanceNo || "",
        employeeCode: current.employeeCode || employeeOptions[0]?.value || "",
        issueDate: today,
        advanceAmount: "",
        monthlyInstallment: "",
        deductionMode: "full",
        deductionValue: "",
        balanceAmount: "",
        notes: "",
        status: "active"
      }));
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const closeAdvance = async (advance) => {
    if (!window.confirm(`Close employee advance #${advance.advanceNo}?`)) {
      return;
    }

    try {
      const result = await closeEmployeeAdvance(advance.id, { closedBy: "Hospital Admin" });
      setStatus({ type: "success", message: result.message });
      await loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const removeAdvance = async (advance) => {
    if (!window.confirm(`Delete employee advance #${advance.advanceNo}?`)) {
      return;
    }

    try {
      const result = await deleteEmployeeAdvance(advance.id);
      setStatus({ type: "success", message: result.message });
      if (editingAdvance?.id === advance.id) {
        resetForm();
      }
      await loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <section className="employee-entry-panel arrear-entry-panel" aria-label="Employee advances">
      <div className="form-title-row no-print">
        <div>
          <p>Management</p>
          <h2>Employee Advances</h2>
        </div>
        <div className="title-actions">
          <button className="refresh-button" type="button" onClick={loadData} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {status.message ? <p className={`form-status ${status.type || "neutral"} no-print`}>{status.message}</p> : null}

      <form className="arrear-header-grid no-print" onSubmit={saveAdvance}>
        <label>
          <span>Advance #</span>
          <input readOnly value={form.advanceNo || ""} />
        </label>
        <label>
          <span>Employee Code / Name</span>
          <select name="employeeCode" value={form.employeeCode} onChange={updateField}>
            <option value="">Select employee</option>
            {employeeOptions.map((employee) => (
              <option key={employee.value} value={employee.value}>
                {employee.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Issue Date</span>
          <input name="issueDate" type="date" value={form.issueDate} onChange={updateField} />
        </label>
        <label>
          <span>Advance Amount</span>
          <input name="advanceAmount" type="number" step="0.01" value={form.advanceAmount} onChange={updateField} />
        </label>
        <label>
          <span>Monthly Installment</span>
          <input name="monthlyInstallment" type="number" step="0.01" value={form.monthlyInstallment} onChange={updateField} placeholder="Optional fixed recovery" />
        </label>
        <label>
          <span>Deduction Mode</span>
          <select name="deductionMode" value={form.deductionMode} onChange={updateField}>
            <option value="full">Full installment</option>
            <option value="percent">Percentage of installment</option>
            <option value="fixed">Fixed amount</option>
            <option value="hold">Hold / skip for now</option>
          </select>
        </label>
        <label>
          <span>Deduction Value</span>
          <input name="deductionValue" type="number" step="0.01" value={form.deductionValue} onChange={updateField} placeholder="Used for percent or fixed mode" />
        </label>
        <label>
          <span>Balance Amount</span>
          <input name="balanceAmount" type="number" step="0.01" value={form.balanceAmount} readOnly />
        </label>
        <label>
          <span>Status</span>
          <select name="status" value={form.status} onChange={updateField}>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="void">Void</option>
          </select>
        </label>
        <label className="wide-field">
          <span>Notes</span>
          <input name="notes" value={form.notes} onChange={updateField} placeholder="Optional note" />
        </label>
        <div className="arrear-footer-row">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingAdvance ? "Update Advance" : "Save Advance"}
          </button>
          <button type="button" onClick={resetForm}>Clear</button>
        </div>
      </form>

      <div className="arrear-list-section no-print">
        <div className="form-title-row">
          <div>
            <p>Employee Advances</p>
            <h2>Advance History</h2>
          </div>
          <span>{advances.length} record(s)</span>
        </div>

        <div className="table-wrap arrear-table-wrap">
          <table className="department-table arrear-list-table">
            <thead>
              <tr>
                <th>Advance #</th>
                <th>Employee</th>
                <th>Issue Date</th>
                <th>Amount</th>
                <th>Monthly Inst.</th>
                <th>Mode</th>
                <th>Deduction Value</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {advances.length ? advances.map((advance) => (
                <tr key={advance.id}>
                  <td>{advance.advanceNo}</td>
                  <td>{advance.employeeCode} - {advance.employeeName}</td>
                  <td>{advance.issueDate}</td>
                  <td className="amount-cell">{formatCurrency(advance.advanceAmount)}</td>
                  <td className="amount-cell">{formatCurrency(advance.monthlyInstallment)}</td>
                  <td>{advance.deductionMode}</td>
                  <td className="amount-cell">{formatCurrency(advance.deductionValue)}</td>
                  <td className="amount-cell">{formatCurrency(advance.balanceAmount)}</td>
                  <td>{advance.status}</td>
                  <td>
                    <div className="arrear-list-actions">
                      <button type="button" onClick={() => startEdit(advance)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => closeAdvance(advance)} disabled={advance.status !== "active"}>
                        Close
                      </button>
                      <button type="button" onClick={() => removeAdvance(advance)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="10">No employee advances found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ArrearLineItemsTable({ items }) {
  return (
    <table className="print-report-table arrear-print-items">
      <thead>
        <tr>
          <th>Sr#</th>
          <th>P#</th>
          <th>Period</th>
          <th>A/C Code</th>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={`${item.account_code}-${item.period_label}-${index}`}>
            <td>{item.sr_no || index + 1}</td>
            <td>{item.period_no}</td>
            <td>{item.period_label}</td>
            <td>{item.account_code}</td>
            <td>{item.description}</td>
            <td className="amount-cell">{formatCurrency(item.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ArrearBillReportView({ bills, groupBy, filters, grandTotal }) {
  const isCodeWise = groupBy === "employee_code";
  const title = isCodeWise ? "Arrear Bill Report - Employee Wise" : "Arrear Bill Report - Document Wise";
  const employeeSummary = filters.employeeCode?.trim() && filters.employeeCode.trim() !== "0"
    ? `Employee No: ${filters.employeeCode.trim()}`
    : "Employee: All";
  const statusSummary = filters.status ? ` | Status: ${filters.status}` : "";
  const filterSummary = `${filters.fromDate} to ${filters.toDate} | ${employeeSummary}${statusSummary}`;
  const employeeGroups = groupBillsByEmployee(bills);

  return (
    <div className="arrear-report-print-area">
      <ReportLetterhead title={title} filterSummary={filterSummary} />

      {!bills.length ? (
        <p className="empty-report-note">No arrear bills found for selected filters.</p>
      ) : null}

      {!isCodeWise ? bills.map((bill) => (
        <section className="print-bill-section" key={bill.document_no}>
          <div className="print-section-head">
            <strong>Document # {bill.document_no}</strong>
            <span>Date: {bill.bill_date}</span>
            <span>Employee: {bill.employee_code} - {bill.employee_name}</span>
          </div>
          <ArrearLineItemsTable items={bill.items || []} />
          <div className="print-total-row">
            <span>Bill Total</span>
            <strong>PKR {formatCurrency(bill.total_amount)}</strong>
          </div>
        </section>
      )) : employeeGroups.map((group) => (
        <section className="print-employee-section" key={group.employeeCode}>
          <div className="print-employee-head">
            <strong>{group.employeeCode} - {group.employeeName}</strong>
          </div>
          {group.bills.map((bill) => (
            <section className="print-bill-section nested-print-section" key={bill.document_no}>
              <div className="print-section-head">
                <strong>Document # {bill.document_no}</strong>
                <span>Date: {bill.bill_date}</span>
              </div>
              <ArrearLineItemsTable items={bill.items || []} />
              <div className="print-total-row">
                <span>Bill Total</span>
                <strong>PKR {formatCurrency(bill.total_amount)}</strong>
              </div>
            </section>
          ))}
          <div className="print-subtotal-row">
            <span>Employee Subtotal</span>
            <strong>PKR {formatCurrency(group.subtotal)}</strong>
          </div>
        </section>
      ))}

      <div className="print-grand-total-row">
        <span>Grand Total</span>
        <strong>PKR {formatCurrency(grandTotal)}</strong>
      </div>
    </div>
  );
}

function ArrearBillReportPage({ groupBy }) {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";
  const [filters, setFilters] = useState({
    employeeCode: "",
    fromDate: monthStart,
    toDate: today,
    outputSelection: "screen"
  });
  const [report, setReport] = useState({ bills: [], grandTotal: 0, loaded: false });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const isCodeWise = groupBy === "employee_code";

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const clearReport = () => {
    setFilters({
      employeeCode: "",
      fromDate: monthStart,
      toDate: today,
      outputSelection: "screen"
    });
    setReport({ bills: [], grandTotal: 0, loaded: false });
    setStatus({ type: "", message: "" });
  };

  const loadReport = async () => {
    if (!filters.fromDate || !filters.toDate) {
      setStatus({ type: "error", message: "From date and to date are required." });
      return;
    }

    if (filters.fromDate > filters.toDate) {
      setStatus({ type: "error", message: "From date cannot be after to date." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await getArrearBillReport({
        employeeCode: filters.employeeCode || "0",
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        sortBy: groupBy === "employee_code" ? "employee_code" : "doc_no"
      });
      setReport({
        bills: result.data || [],
        grandTotal: result.grand_total || 0,
        loaded: true
      });

      if (filters.outputSelection === "printer") {
        window.setTimeout(() => printCurrentDocumentAsExcel(title), 150);
      }
      if (filters.outputSelection === "excel") {
        exportCurrentDocumentAfterRender(title);
      }
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      setReport({ bills: [], grandTotal: 0, loaded: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="employee-entry-panel arrear-report-panel" aria-label="Arrear bill report">
      <div className="form-title-row">
        <div>
          <p>Arrear Bill Report</p>
          <h2>{isCodeWise ? "Arrear Bill Of An Employee - Code Wise" : "Arrear Bill Of An Employee - Doc. Wise"}</h2>
        </div>
      </div>

      <div className="report-filter-panel no-print">
        <label>
          <span>Employee No</span>
          <input
            type="number"
            name="employeeCode"
            value={filters.employeeCode}
            onChange={updateFilter}
            placeholder="0 or blank for all"
          />
        </label>
        <label>
          <span>From Date</span>
          <input type="date" name="fromDate" value={filters.fromDate} onChange={updateFilter} />
        </label>
        <label>
          <span>To Date</span>
          <input type="date" name="toDate" value={filters.toDate} onChange={updateFilter} />
        </label>
        <fieldset>
          <legend>Output Selection</legend>
          <label>
            <input
              type="radio"
              name="outputSelection"
              value="screen"
              checked={filters.outputSelection === "screen"}
              onChange={updateFilter}
            />
            View
          </label>
          <label>
            <input
              type="radio"
              name="outputSelection"
              value="printer"
              checked={filters.outputSelection === "printer"}
              onChange={updateFilter}
            />
            Print
          </label>
          <label>
            <input
              type="radio"
              name="outputSelection"
              value="excel"
              checked={filters.outputSelection === "excel"}
              onChange={updateFilter}
            />
            Save as Excel
          </label>
        </fieldset>
        <div className="report-filter-actions">
          <button type="button" onClick={loadReport} disabled={loading}>{loading ? "Loading..." : "OK"}</button>
          <button type="button" onClick={clearReport}>Cancel</button>
        </div>
      </div>

      {status.message ? <p className={`form-status ${status.type || "neutral"} no-print`}>{status.message}</p> : null}

      {report.loaded ? (
        <ArrearBillReportView bills={report.bills} groupBy={groupBy} filters={filters} grandTotal={report.grandTotal} />
      ) : null}
    </section>
  );
}

const emptyBudgetRow = (index = 0) => ({
  srNo: index + 1,
  accountCode: "",
  description: "",
  amount: ""
});

function BudgetExpenseEntry() {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    id: null,
    documentNo: "",
    transactionDate: today,
    budgetType: "original",
    details: "",
    status: "draft",
    items: [emptyBudgetRow()]
  });
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalOriginal: 0, totalSupplementary: 0, totalBudget: 0 });
  const [filters, setFilters] = useState({ search: "", budgetTypes: [], statuses: [] });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [toast, setToast] = useState({ type: "", message: "" });
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showQuickFilter, setShowQuickFilter] = useState(false);
  const [saving, setSaving] = useState(false);
  const isDraft = form.status === "draft";
  const totalAmount = form.items.reduce((total, item) => total + Number(item.amount || 0), 0);
  const filteredTransactions = transactions.filter((transaction) => {
    const query = filters.search.trim().toLowerCase();
    const matchesSearch = !query || [
      transaction.documentNo,
      transaction.details,
      transaction.budgetType,
      transaction.status
    ].some((value) => String(value || "").toLowerCase().includes(query));
    const matchesType = !filters.budgetTypes.length || filters.budgetTypes.includes(transaction.budgetType);
    const matchesStatus = !filters.statuses.length || filters.statuses.includes(transaction.status);
    return matchesSearch && matchesType && matchesStatus;
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast({ type: "", message: "" }), 2600);
  };

  const runConfirmedAction = async () => {
    const action = confirmDialog?.onConfirm;
    setConfirmDialog(null);

    if (action) {
      await action();
    }
  };

  const toggleQuickFilter = (group, value) => {
    setFilters((current) => {
      const activeValues = current[group];
      const nextValues = activeValues.includes(value)
        ? activeValues.filter((item) => item !== value)
        : [...activeValues, value];

      return { ...current, [group]: nextValues };
    });
  };

  const clearQuickFilters = () => {
    setFilters((current) => ({ ...current, budgetTypes: [], statuses: [] }));
  };

  const quickFilterCount = filters.budgetTypes.length + filters.statuses.length;

  const printBudgetTransactionList = () => {
    const typeLabel = filters.budgetTypes.length
      ? filters.budgetTypes.map((type) => (type === "original" ? "Original" : "Supplementary")).join(", ")
      : "All Types";
    const statusLabel = filters.statuses.length
      ? filters.statuses.map((value) => value.charAt(0).toUpperCase() + value.slice(1)).join(", ")
      : "All Statuses";
    const searchLabel = filters.search.trim() ? `Search: ${filters.search.trim()} | ` : "";
    const rowsHtml = filteredTransactions.length
      ? filteredTransactions
          .map(
            (transaction) => `
              <tr>
                <td>${transaction.documentNo || ""}</td>
                <td>${transaction.transactionDate || ""}</td>
                <td>${transaction.budgetType === "original" ? "Original" : "Supplementary"}</td>
                <td>${transaction.details || "-"}</td>
                <td class="amount">PKR ${Number(transaction.totalAmount || 0).toLocaleString()}</td>
                <td>${transaction.status || ""}</td>
              </tr>
            `
          )
          .join("")
      : `<tr><td colspan="6" class="empty-row">No budget transactions found.</td></tr>`;
    const grandTotal = filteredTransactions.reduce((total, transaction) => total + Number(transaction.totalAmount || 0), 0);
    const reportWindow = window.open("", "_blank", "width=1100,height=750");

    if (!reportWindow) {
      showToast("error", "Please allow popups to print the budget list.");
      return;
    }

    exportRowsToExcel(
      filteredTransactions.map((transaction) => ({
        "Document #": transaction.documentNo || "",
        Date: transaction.transactionDate || "",
        Type: transaction.budgetType === "original" ? "Original" : "Supplementary",
        Details: transaction.details || "-",
        Total: Number(transaction.totalAmount || 0),
        Status: transaction.status || ""
      })),
      "budget-transaction-list.xlsx"
    );

    reportWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Budget Transaction List</title>
          <style>
            body { margin: 24px; color: #17383c; font-family: Arial, sans-serif; }
            .letterhead { display: grid; grid-template-columns: 72px 1fr; gap: 14px; align-items: center; border-bottom: 3px solid #0b746b; padding-bottom: 14px; margin-bottom: 18px; }
            .letterhead img { width: 64px; height: 64px; object-fit: contain; border: 1px solid #d8e4e2; border-radius: 8px; padding: 5px; }
            .letterhead p { margin: 0 0 4px; color: #5f7478; font-size: 12px; font-weight: 700; text-transform: uppercase; }
            .letterhead h1 { margin: 0; color: #0b3438; font-size: 26px; }
            .summary { display: flex; justify-content: space-between; gap: 12px; margin: 0 0 14px; color: #31474c; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th { background: #103f43; color: #fff; text-align: left; }
            th, td { border: 1px solid #cfe0dd; padding: 9px 10px; }
            .amount { text-align: right; }
            .empty-row { text-align: center; color: #5f7478; }
            .total-row td { font-weight: 800; background: #eef8f6; }
            @media print { body { margin: 12mm; } }
          </style>
        </head>
        <body>
          <header class="letterhead">
            <img src="${window.location.origin}/logo.png" alt="Wazirabad Cardiology Hospital" />
            <div>
              <p>Wazirabad Cardiology Hospital</p>
              <h1>Budget Transaction List</h1>
            </div>
          </header>
          <div class="summary">
            <span>${searchLabel}${typeLabel} | ${statusLabel}</span>
            <strong>Total Records: ${filteredTransactions.length}</strong>
          </div>
          <table>
            <thead>
              <tr>
                <th>Document #</th>
                <th>Date</th>
                <th>Type</th>
                <th>Details</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row">
                <td colspan="4">Grand Total</td>
                <td class="amount">PKR ${grandTotal.toLocaleString()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

  const loadNextDocumentNo = async () => {
    try {
      const result = await getNextBudgetDocumentNo();
      setForm((current) => ({ ...current, documentNo: result.data.documentNo }));
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const loadTransactions = async () => {
    try {
      const result = await getBudgetTransactions();
      setTransactions(result.data);
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const loadSummary = async () => {
    try {
      const result = await getBudgetSummary();
      setSummary(result.data || { totalOriginal: 0, totalSupplementary: 0, totalBudget: 0 });
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const loadAccounts = async () => {
    try {
      const result = await getChartOfAccounts();
      setAccounts(result || []);
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const resetForm = async () => {
    setForm({
      id: null,
      documentNo: "",
      transactionDate: today,
      budgetType: "original",
      details: "",
      status: "draft",
      items: [emptyBudgetRow()]
    });
    setStatus({ type: "", message: "" });
    await loadNextDocumentNo();
  };

  const updateHeader = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateItem = (rowIndex, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, index) => {
        if (index !== rowIndex) {
          return item;
        }

        const nextItem = { ...item, [field]: value };

        if (field === "accountCode") {
          const matchedAccount = accounts.find((account) => account.code === value);
          nextItem.description = matchedAccount ? matchedAccount.name : item.description;
        }

        return nextItem;
      })
    }));
  };

  const addRow = () => {
    if (!isDraft) {
      showToast("error", "Finalized budget documents cannot be edited.");
      return;
    }

    setForm((current) => ({
      ...current,
      items: [...current.items, emptyBudgetRow(current.items.length)]
    }));
  };

  const removeRow = (rowIndex) => {
    if (!isDraft) {
      showToast("error", "Finalized budget documents cannot be edited.");
      return;
    }

    setForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? [emptyBudgetRow()]
          : current.items
              .filter((_item, index) => index !== rowIndex)
              .map((item, index) => ({ ...item, srNo: index + 1 }))
    }));
  };

  const validateForm = () => {
    if (!form.transactionDate) {
      return "Date is required.";
    }

    if (!form.budgetType) {
      return "Budget type is required.";
    }

    if (!form.items.length) {
      return "At least one budget row is required.";
    }

    const invalidRow = form.items.find((item) => !item.accountCode || Number(item.amount || 0) <= 0);

    if (invalidRow) {
      return "Each row needs account code and amount greater than 0.";
    }

    return "";
  };

  const saveTransaction = async () => {
    const validationMessage = validateForm();

    if (validationMessage) {
      setStatus({ type: "error", message: validationMessage });
      return null;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    const payload = {
      transactionDate: form.transactionDate,
      budgetType: form.budgetType,
      details: form.details,
      items: form.items
    };

    try {
      const result = form.id
        ? await updateBudgetTransaction(form.id, payload)
        : await createBudgetTransaction(payload);
      const savedTransaction = result.data;
      await loadTransactionIntoForm(savedTransaction);
      showToast("success", result.message);
      await loadTransactions();
      await loadSummary();
      return savedTransaction;
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      showToast("error", error.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const finalizeSavedTransaction = async (savedTransaction) => {
    try {
      const result = await finalizeBudgetTransaction(savedTransaction.id);
      showToast("success", result.message);
      await loadTransactions();
      await loadSummary();
      await loadTransactionIntoForm(result.data);
    } catch (error) {
      showToast("error", error.message);
      setStatus({ type: "error", message: error.message });
    }
  };

  const finalizeTransaction = async () => {
    const savedTransaction = form.id ? form : await saveTransaction();

    if (!savedTransaction?.id) {
      return;
    }

    setConfirmDialog({
      tone: "success",
      title: "Finalize Budget Document",
      message: "Finalize this budget document? It will be locked from editing.",
      confirmLabel: "Finalize",
      onConfirm: () => finalizeSavedTransaction(savedTransaction)
    });
  };

  const updateTransactionStatus = async (nextStatus) => {
    if (nextStatus === form.status) {
      return;
    }

    if (!form.id && nextStatus === "draft") {
      return;
    }

    if (!form.id && nextStatus === "cancelled") {
      showToast("error", "Save the budget document before cancelling it.");
      return;
    }

    if (isDraft && nextStatus === "finalized") {
      const savedTransaction = await saveTransaction();

      if (!savedTransaction?.id) {
        return;
      }

      try {
        const result = await finalizeBudgetTransaction(savedTransaction.id);
        showToast("success", result.message);
        await loadTransactions();
        await loadSummary();
        await loadTransactionIntoForm(result.data);
      } catch (error) {
        showToast("error", error.message);
        setStatus({ type: "error", message: error.message });
      }
      return;
    }

    try {
      const result = await updateBudgetTransactionStatus(form.id, nextStatus);
      showToast("success", result.message);
      await loadTransactions();
      await loadSummary();
      await loadTransactionIntoForm(result.data);
    } catch (error) {
      showToast("error", error.message);
      setStatus({ type: "error", message: error.message });
    }
  };

  const updateListTransactionStatus = async (transaction, nextStatus) => {
    if (nextStatus === transaction.status) {
      return;
    }

    try {
      const result = await updateBudgetTransactionStatus(transaction.id, nextStatus);
      showToast("success", result.message);
      await loadTransactions();
      await loadSummary();

      if (form.id === transaction.id) {
        await loadTransactionIntoForm(result.data);
      }
    } catch (error) {
      showToast("error", error.message);
      setStatus({ type: "error", message: error.message });
    }
  };

  const deleteTransaction = async () => {
    if (!form.id) {
      return;
    }

    setConfirmDialog({
      tone: "danger",
      title: "Delete Budget Document",
      message: `Delete document #${form.documentNo}?`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          const result = await deleteBudgetTransaction(form.id);
          showToast("success", result.message);
          await loadTransactions();
          await loadSummary();
          await resetForm();
        } catch (error) {
          showToast("error", error.message);
          setStatus({ type: "error", message: error.message });
        }
      }
    });
  };

  const loadTransactionIntoForm = async (transaction) => {
    setForm({
      id: transaction.id,
      documentNo: transaction.documentNo,
      transactionDate: transaction.transactionDate,
      budgetType: transaction.budgetType,
      details: transaction.details || "",
      status: transaction.status,
      items: transaction.items.map((item) => ({
        srNo: item.srNo,
        accountCode: item.accountCode,
        description: item.description || item.accountName || "",
        amount: item.amount
      }))
    });
    setStatus({ type: "", message: "" });
  };

  useEffect(() => {
    loadNextDocumentNo();
    loadAccounts();
    loadTransactions();
    loadSummary();
  }, []);

  return (
    <section className="employee-entry-panel arrear-entry-panel budget-entry-panel" aria-label="Budget entry">
      {toast.message ? <div className={`toast-notice ${toast.type}`}>{toast.message}</div> : null}
      {confirmDialog ? (
        <div className="modal-backdrop soft-modal-backdrop" role="dialog" aria-modal="true" aria-label={confirmDialog.title}>
          <div className={`confirm-modal ${confirmDialog.tone || "neutral"}`}>
            <img src="/logo.png" alt="Wazirabad Cardiology Hospital" />
            <div>
              <p>Confirmation</p>
              <h3>{confirmDialog.title}</h3>
              <span>{confirmDialog.message}</span>
            </div>
            <div className="confirm-modal-actions">
              <button type="button" onClick={() => setConfirmDialog(null)}>
                Cancel
              </button>
              <button type="button" onClick={runConfirmedAction}>
                {confirmDialog.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="form-title-row">
        <div>
          <p>Budget</p>
          <h2>Budget Entry</h2>
        </div>
        <span className={`bill-status-badge ${form.status}`}>{form.status}</span>
      </div>

      <div className="budget-summary-grid">
        <article>
          <span>Total Original</span>
          <strong>PKR {Number(summary.totalOriginal || 0).toLocaleString()}</strong>
        </article>
        <article>
          <span>Total Supplementary</span>
          <strong>PKR {Number(summary.totalSupplementary || 0).toLocaleString()}</strong>
        </article>
        <article className="positive">
          <span>Total Budget</span>
          <strong>PKR {Number(summary.totalBudget || 0).toLocaleString()}</strong>
        </article>
      </div>

      <div className="arrear-header-grid budget-header-grid">
        <label>
          <span>Date</span>
          <input type="date" name="transactionDate" value={form.transactionDate} onChange={updateHeader} disabled={!isDraft} />
        </label>
        <label>
          <span>Document #</span>
          <input readOnly value={form.documentNo || ""} />
        </label>
        <label>
          <span>Budget Type</span>
          <select name="budgetType" value={form.budgetType} onChange={updateHeader} disabled={!isDraft}>
            <option value="original">Original</option>
            <option value="supplementary">Supplementary</option>
          </select>
        </label>
        <label>
          <span>Status</span>
          <select name="status" value={form.status} onChange={(event) => updateTransactionStatus(event.target.value)} disabled={saving}>
            <option value="draft">Draft</option>
            <option value="finalized">Finalized</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="wide-field">
          <span>Details</span>
          <input name="details" value={form.details} onChange={updateHeader} placeholder="Q1 Govt Grant / Salary Disbursement" disabled={!isDraft} />
        </label>
      </div>

      {status.message ? <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p> : null}

      <div className="table-wrap arrear-table-wrap">
        <table className="arrear-entry-table budget-entry-table">
          <thead>
            <tr>
              <th>Sr#</th>
              <th>Code</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {form.items.map((item, index) => (
              <tr key={`${item.srNo}-${index}`}>
                <td>{index + 1}</td>
                <td>
                  <select value={item.accountCode} onChange={(event) => updateItem(index, "accountCode", event.target.value)} disabled={!isDraft}>
                    <option value="">Select account</option>
                    {accounts.map((account) => (
                      <option value={account.code} key={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} disabled={!isDraft} />
                </td>
                <td>
                  <input type="number" min="0" step="0.01" value={item.amount} onChange={(event) => updateItem(index, "amount", event.target.value)} disabled={!isDraft} />
                </td>
                <td>
                  <button className="table-danger-button" type="button" onClick={() => removeRow(index)}>
                    {form.items.length === 1 ? "Clear" : "Remove"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="arrear-footer-row">
        <button className="refresh-button" type="button" onClick={addRow}>Add Row</button>
        <strong>Total: PKR {totalAmount.toLocaleString()}</strong>
      </div>

      <div className="form-actions">
        <button type="button" onClick={resetForm}>Cancel</button>
        <button type="button" onClick={saveTransaction} disabled={saving || !isDraft}>{saving ? "Saving..." : "Save Draft"}</button>
        <button type="button" onClick={finalizeTransaction} disabled={!isDraft}>Finalize</button>
        <button type="button" onClick={deleteTransaction} disabled={!form.id || form.status === "finalized"}>Delete</button>
      </div>

      <div className="arrear-list-section">
        <div className="form-title-row compact-title-row">
          <div>
            <p>Saved Documents</p>
            <h2>Previous Budget Transactions</h2>
          </div>
        </div>
        <div className="table-toolbar budget-filter-toolbar">
          <label>
            <span>Search</span>
            <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Document, details, status..." />
          </label>
          <div className="quick-filter-dropdown">
            <span>Quick Filter</span>
            <button
              type="button"
              className="quick-filter-trigger"
              onClick={() => setShowQuickFilter((current) => !current)}
              aria-expanded={showQuickFilter}
            >
              {quickFilterCount ? `${quickFilterCount} selected` : "All"}
              <ChevronDown size={16} />
            </button>
            {showQuickFilter ? (
              <fieldset className="quick-filter-menu">
                <legend>Quick Filter</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.budgetTypes.includes("original")}
                    onChange={() => toggleQuickFilter("budgetTypes", "original")}
                  />
                  Original
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.budgetTypes.includes("supplementary")}
                    onChange={() => toggleQuickFilter("budgetTypes", "supplementary")}
                  />
                  Supplementary
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes("draft")}
                    onChange={() => toggleQuickFilter("statuses", "draft")}
                  />
                  Draft
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes("finalized")}
                    onChange={() => toggleQuickFilter("statuses", "finalized")}
                  />
                  Finalized
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes("cancelled")}
                    onChange={() => toggleQuickFilter("statuses", "cancelled")}
                  />
                  Cancelled
                </label>
              </fieldset>
            ) : null}
          </div>
          <div className="budget-list-actions">
            <button className="refresh-button" type="button" onClick={printBudgetTransactionList}>
              Print
            </button>
            <button type="button" onClick={clearQuickFilters}>
              Clear Filter
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="department-table arrear-list-table budget-list-table">
            <thead>
              <tr>
                <th>Document #</th>
                <th>Date</th>
                <th>Type</th>
                <th>Details</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.documentNo}</td>
                  <td>{transaction.transactionDate}</td>
                  <td>{transaction.budgetType === "original" ? "Original" : "Supplementary"}</td>
                  <td>{transaction.details || "-"}</td>
                  <td>PKR {Number(transaction.totalAmount || 0).toLocaleString()}</td>
                  <td>
                    <select
                      className="table-status-select"
                      value={transaction.status}
                      onChange={(event) => updateListTransactionStatus(transaction, event.target.value)}
                    >
                      <option value="draft">Draft</option>
                      <option value="finalized">Finalized</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <button className="refresh-button" type="button" onClick={async () => {
                      try {
                        const result = await getBudgetTransaction(transaction.id);
                        await loadTransactionIntoForm(result.data);
                      } catch (error) {
                        showToast("error", error.message);
                      }
                    }}>
                      View/Edit
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredTransactions.length ? (
                <tr>
                  <td colSpan="7">No budget transactions found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function documentTitle(document) {
  return document?.type === "budget" ? "Budget Document" : "Arrear Bill";
}

function UniversalDocumentPreview({ documents }) {
  return (
    <div className="arrear-report-print-area">
      <ReportLetterhead title="Document Printing" filterSummary="Document preview" />
      {documents.map((document) => (
        <section className="print-bill-section" key={`${document.type}-${document.documentNo}`}>
          <div className="print-section-head">
            <strong>{documentTitle(document)} # {document.documentNo}</strong>
            <span>Date: {document.billDate || document.transactionDate}</span>
            {document.type === "arrear" ? <span>Employee: {document.employeeCode} - {document.employeeName}</span> : null}
            {document.type === "budget" ? <span>Type: {document.budgetType === "original" ? "Original" : "Supplementary"}</span> : null}
          </div>
          <table className="print-report-table">
            <thead>
              <tr>
                <th>Sr#</th>
                {document.type === "arrear" ? <th>P#</th> : null}
                {document.type === "arrear" ? <th>Period</th> : null}
                <th>Code</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(document.items || []).map((item, index) => (
                <tr key={`${document.type}-${document.documentNo}-${index}`}>
                  <td>{item.srNo || index + 1}</td>
                  {document.type === "arrear" ? <td>{item.periodNo}</td> : null}
                  {document.type === "arrear" ? <td>{item.periodLabel}</td> : null}
                  <td>{item.accountCode}</td>
                  <td>{item.description || item.wageDescription || item.accountName || "-"}</td>
                  <td className="amount-cell">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="print-total-row">
            <span>Total</span>
            <strong>PKR {formatCurrency(document.totalAmount)}</strong>
          </div>
        </section>
      ))}
    </div>
  );
}

function ArrearBillPrintPage() {
  const [documentNo, setDocumentNo] = useState("");
  const [outputSelection, setOutputSelection] = useState("screen");
  const [bill, setBill] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const loadBill = async () => {
    if (!documentNo) {
      setStatus({ type: "error", message: "Document number is required." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await getDocumentByNumber(documentNo, "arrear");
      const loadedBill = result.data?.[0] || null;
      setBill(loadedBill);

      if (outputSelection === "printer") {
        window.setTimeout(() => printCurrentDocumentAsExcel("arrear-bill-print"), 150);
      }
      if (outputSelection === "excel") {
        exportCurrentDocumentAfterRender("arrear-bill-print");
      }
    } catch (error) {
      setBill(null);
      setStatus({ type: "error", message: error.message || "Arrear bill not found." });
    } finally {
      setLoading(false);
    }
  };

  const clearPrintForm = () => {
    setDocumentNo("");
    setBill(null);
    setStatus({ type: "", message: "" });
  };

  return (
    <section className="employee-entry-panel arrear-report-panel arrear-print-page" aria-label="Arrear bill print">
      <div className="form-title-row no-print">
        <div>
          <p>Arrear Bill</p>
          <h2>Arrear Bill Print</h2>
        </div>
      </div>

      <div className="legacy-print-shell no-print">
        <div className="legacy-print-card">
          <h3>Document Printing</h3>
          <label className="legacy-doc-input">
            <span>Enter Doc. Number To Print :-</span>
            <input
              type="number"
              value={documentNo}
              onChange={(event) => setDocumentNo(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  loadBill();
                }
              }}
              placeholder="0"
            />
          </label>
          <fieldset>
            <legend>**- Printing Selection -**</legend>
            <label>
              <input
                type="radio"
                value="printer"
                checked={outputSelection === "printer"}
                onChange={(event) => setOutputSelection(event.target.value)}
              />
              Print
            </label>
            <label>
              <input
                type="radio"
                value="screen"
                checked={outputSelection === "screen"}
                onChange={(event) => setOutputSelection(event.target.value)}
              />
              View
            </label>
            <label>
              <input
                type="radio"
                value="excel"
                checked={outputSelection === "excel"}
                onChange={(event) => setOutputSelection(event.target.value)}
              />
              Save as Excel
            </label>
          </fieldset>
          <div className="legacy-print-actions">
            <button type="button" onClick={loadBill} disabled={loading}>{loading ? "Loading..." : "OK"}</button>
            <button type="button" onClick={clearPrintForm}>Cancel</button>
          </div>
        </div>
      </div>

      {status.message ? <p className={`form-status ${status.type || "neutral"} no-print`}>{status.message}</p> : null}
      {bill ? <UniversalDocumentPreview documents={[bill]} /> : null}
    </section>
  );
}

function DocumentPrintingPage() {
  const [documentNo, setDocumentNo] = useState("");
  const [outputSelection, setOutputSelection] = useState("screen");
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const loadAvailableDocuments = async () => {
    try {
      const [arrearResult, budgetResult] = await Promise.all([
        getArrearBills(),
        getBudgetTransactions()
      ]);
      setAvailableDocuments([
        ...(arrearResult.data || []).map((bill) => ({
          key: `arrear-${bill.id}`,
          documentNo: bill.documentNo,
          label: `Arrear #${bill.documentNo} - ${bill.employeeName || bill.employeeCode || ""}`
        })),
        ...(budgetResult.data || []).map((transaction) => ({
          key: `budget-${transaction.id}`,
          documentNo: transaction.documentNo,
          label: `Budget #${transaction.documentNo} - ${transaction.budgetType}`
        }))
      ]);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const loadDocument = async () => {
    if (!documentNo) {
      setStatus({ type: "error", message: "Document number is required." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await getDocumentByNumber(documentNo);
      setDocuments(result.data || []);
      if (outputSelection === "printer") {
        window.setTimeout(() => printCurrentDocumentAsExcel("document-printing"), 150);
      }
      if (outputSelection === "excel") {
        exportCurrentDocumentAfterRender("document-printing");
      }
    } catch (error) {
      setDocuments([]);
      const savedNumbers = Array.from(new Set(availableDocuments.map((document) => document.documentNo))).join(", ");
      setStatus({
        type: "error",
        message: savedNumbers
          ? `Document #${documentNo} not found. Saved document number(s): ${savedNumbers}.`
          : error.message || "Document not found."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableDocuments();
  }, []);

  return (
    <section className="employee-entry-panel arrear-report-panel">
      <div className="form-title-row">
        <div>
          <p>Print</p>
          <h2>Document Printing</h2>
        </div>
      </div>
      <div className="report-filter-panel no-print">
        <label>
          <span>Enter Doc. Number To Print</span>
          <input type="number" value={documentNo} onChange={(event) => setDocumentNo(event.target.value)} />
        </label>
        <label>
          <span>Saved Documents</span>
          <select value="" onChange={(event) => setDocumentNo(event.target.value)}>
            <option value="">Select saved document</option>
            {availableDocuments.map((document) => (
              <option value={document.documentNo} key={document.key}>
                {document.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Output Selection</legend>
          <label><input type="radio" value="screen" checked={outputSelection === "screen"} onChange={(event) => setOutputSelection(event.target.value)} /> View</label>
          <label><input type="radio" value="printer" checked={outputSelection === "printer"} onChange={(event) => setOutputSelection(event.target.value)} /> Print</label>
          <label><input type="radio" value="excel" checked={outputSelection === "excel"} onChange={(event) => setOutputSelection(event.target.value)} /> Save as Excel</label>
        </fieldset>
        <div className="report-filter-actions">
          <button type="button" onClick={loadDocument} disabled={loading}>{loading ? "Loading..." : "OK"}</button>
          <button type="button" onClick={() => { setDocumentNo(""); setDocuments([]); setStatus({ type: "", message: "" }); }}>Cancel</button>
        </div>
      </div>
      {status.message ? <p className={`form-status ${status.type || "neutral"} no-print`}>{status.message}</p> : null}
      {documents.length ? <UniversalDocumentPreview documents={documents} /> : null}
    </section>
  );
}

function BudgetPositionReport({ data }) {
  return (
    <div className="arrear-report-print-area">
      <ReportLetterhead title="Budget Position" filterSummary={`Ending Date: ${data.endingDate}`} />
      <div className="budget-summary-grid report-summary-grid">
        <article><span>Original</span><strong>PKR {formatCurrency(data.totalOriginal)}</strong></article>
        <article><span>Supplementary</span><strong>PKR {formatCurrency(data.totalSupplementary)}</strong></article>
        <article><span>Total Budget</span><strong>PKR {formatCurrency(data.totalBudget)}</strong></article>
        <article><span>Total Spent</span><strong>PKR {formatCurrency(data.totalSpent)}</strong></article>
        <article className="positive"><span>Remaining</span><strong>PKR {formatCurrency(data.remainingBudget)}</strong></article>
      </div>
      <table className="print-report-table budget-position-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Description</th>
            <th>Original</th>
            <th>Supplementary</th>
            <th>Total</th>
            <th>Spent</th>
            <th>Remaining</th>
          </tr>
        </thead>
        <tbody>
          {(data.breakdown || []).map((row) => (
            <tr key={row.code}>
              <td>{row.code}</td>
              <td>{row.description}</td>
              <td className="amount-cell">{formatCurrency(row.original_amount)}</td>
              <td className="amount-cell">{formatCurrency(row.supplementary_amount)}</td>
              <td className="amount-cell">{formatCurrency(row.total)}</td>
              <td className="amount-cell">{formatCurrency(row.spent)}</td>
              <td className="amount-cell">{formatCurrency(row.remaining)}</td>
            </tr>
          ))}
          {!data.breakdown?.length ? <tr><td colSpan="7">No budget records found.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

function BudgetPositionPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [endingDate, setEndingDate] = useState(today);
  const [outputSelection, setOutputSelection] = useState("screen");
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const exportExcel = (data) => {
    const rows = (data.breakdown || []).map((row) => ({
      Code: row.code,
      Description: row.description,
      Original: row.original_amount,
      Supplementary: row.supplementary_amount,
      Total: row.total,
      Spent: row.spent,
      Remaining: row.remaining
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Budget Position");
    XLSX.writeFile(workbook, `budget-position-${data.endingDate}.xlsx`);
  };

  const loadPosition = async () => {
    if (!endingDate) {
      setStatus({ type: "error", message: "Ending date is required." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await getBudgetPosition(endingDate);
      setReport(result.data);
      if (outputSelection === "printer") {
        window.setTimeout(() => printCurrentDocumentAsExcel("budget-position"), 150);
      }
      if (outputSelection === "excel") {
        exportExcel(result.data);
      }
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="employee-entry-panel arrear-report-panel">
      <div className="form-title-row"><div><p>Budget</p><h2>Budget Position</h2></div></div>
      <div className="report-filter-panel no-print">
        <label><span>Ending Date</span><input type="date" value={endingDate} onChange={(event) => setEndingDate(event.target.value)} /></label>
        <fieldset>
          <legend>Output Selection</legend>
          <label><input type="radio" value="screen" checked={outputSelection === "screen"} onChange={(event) => setOutputSelection(event.target.value)} /> View</label>
          <label><input type="radio" value="printer" checked={outputSelection === "printer"} onChange={(event) => setOutputSelection(event.target.value)} /> Print</label>
          <label><input type="radio" value="excel" checked={outputSelection === "excel"} onChange={(event) => setOutputSelection(event.target.value)} /> Save as Excel</label>
        </fieldset>
        <div className="report-filter-actions">
          <button type="button" onClick={loadPosition} disabled={loading}>{loading ? "Loading..." : "OK"}</button>
          <button type="button" onClick={() => { setEndingDate(today); setReport(null); setStatus({ type: "", message: "" }); }}>Cancel</button>
        </div>
      </div>
      {status.message ? <p className={`form-status ${status.type || "neutral"} no-print`}>{status.message}</p> : null}
      {report ? <BudgetPositionReport data={report} /> : null}
    </section>
  );
}

function ArrearBillCorrectionPage() {
  const [documentNo, setDocumentNo] = useState("");
  const [form, setForm] = useState(null);
  const [wageCodes, setWageCodes] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const isDraft = form?.status === "draft";

  useEffect(() => {
    getWageCodes().then(setWageCodes).catch((error) => setStatus({ type: "error", message: error.message }));
  }, []);

  const loadByDocumentNo = async () => {
    if (!documentNo) return;
    try {
      const list = await getArrearBills({ documentNo });
      const match = list.data?.[0];
      if (!match) {
        setForm(null);
        setStatus({ type: "error", message: "Document not found." });
        return;
      }
      const result = await getArrearBill(match.id);
      setForm(result.data);
      setStatus(result.data.status === "finalized"
        ? { type: "error", message: "This bill is finalized and locked. Reopen for correction before editing." }
        : { type: "success", message: "Document loaded." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const updateItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, rowIndex) => {
        if (rowIndex !== index) return item;
        const next = { ...item, [field]: value };
        if (field === "accountCode") {
          const wage = wageCodes.find((code) => code.code === value);
          next.description = wage ? wage.description : item.description;
        }
        return next;
      })
    }));
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const result = await updateArrearBill(form.id, {
        billDate: form.billDate,
        placeOfPosting: form.placeOfPosting,
        employeeCode: form.employeeCode,
        items: form.items
      });
      setForm(result.data);
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const reopen = async () => {
    if (!form?.id) return;
    try {
      const result = await reopenArrearBill(form.id);
      setForm(result.data);
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <section className="employee-entry-panel arrear-entry-panel">
      <div className="form-title-row"><div><p>Arrear Bill</p><h2>Arrear Bill Correction</h2></div>{form ? <span className={`bill-status-badge ${form.status}`}>{form.status}</span> : null}</div>
      <div className="arrear-header-grid">
        <label><span>Date</span><input type="date" value={form?.billDate || ""} onChange={(event) => setForm((current) => ({ ...current, billDate: event.target.value }))} disabled={!isDraft} /></label>
        <label><span>Document #</span><input type="number" value={documentNo} onChange={(event) => setDocumentNo(event.target.value)} onBlur={loadByDocumentNo} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); loadByDocumentNo(); } }} /></label>
        <label className="wide-field"><span>Name</span><input readOnly value={form?.employeeName || ""} /></label>
      </div>
      {status.message ? <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p> : null}
      {form ? (
        <>
          <div className="table-wrap arrear-table-wrap">
            <table className="arrear-entry-table">
              <thead><tr><th>Sr#</th><th>P#</th><th>Period</th><th>A/C Code</th><th>Description</th><th>Amount</th><th>Action</th></tr></thead>
              <tbody>{form.items.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td><input type="number" value={item.periodNo} onChange={(event) => updateItem(index, "periodNo", event.target.value)} disabled={!isDraft} /></td>
                  <td><input value={item.periodLabel} onChange={(event) => updateItem(index, "periodLabel", event.target.value)} disabled={!isDraft} /></td>
                  <td><select value={item.accountCode} onChange={(event) => updateItem(index, "accountCode", event.target.value)} disabled={!isDraft}><option value="">Select</option>{wageCodes.map((code) => <option key={code.code} value={code.code}>{code.code} - {code.description}</option>)}</select></td>
                  <td><input value={item.description || item.wageDescription || ""} onChange={(event) => updateItem(index, "description", event.target.value)} disabled={!isDraft} /></td>
                  <td><input type="number" step="0.01" value={item.amount} onChange={(event) => updateItem(index, "amount", event.target.value)} disabled={!isDraft} /></td>
                  <td><button className="table-danger-button" type="button" disabled={!isDraft || form.items.length === 1} onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_row, rowIndex) => rowIndex !== index) }))}>Remove</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setForm((current) => ({ ...current, items: [...current.items, emptyArrearRow(current.items.length)] }))} disabled={!isDraft}>Add Row</button>
            <button type="button" onClick={save} disabled={!isDraft || saving}>{saving ? "Saving..." : "Save"}</button>
            <button type="button" onClick={reopen} disabled={form.status !== "finalized"}>Reopen for Correction</button>
          </div>
        </>
      ) : null}
    </section>
  );
}

function BudgetExpenseEditPage() {
  const [documentNo, setDocumentNo] = useState("");
  const [form, setForm] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const isDraft = form?.status === "draft";

  useEffect(() => {
    getChartOfAccounts().then(setAccounts).catch((error) => setStatus({ type: "error", message: error.message }));
  }, []);

  const loadByDocumentNo = async () => {
    if (!documentNo) return;
    try {
      const list = await getBudgetTransactions({ documentNo });
      const match = list.data?.[0];
      if (!match) {
        setForm(null);
        setStatus({ type: "error", message: "Document not found." });
        return;
      }
      const result = await getBudgetTransaction(match.id);
      setForm(result.data);
      setStatus(result.data.status === "finalized"
        ? { type: "error", message: "This transaction is finalized and locked. Reopen for correction before editing." }
        : { type: "success", message: "Document loaded." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const updateItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, rowIndex) => {
        if (rowIndex !== index) return item;
        const next = { ...item, [field]: value };
        if (field === "accountCode") {
          const account = accounts.find((row) => row.code === value);
          next.description = account ? account.name : item.description;
        }
        return next;
      })
    }));
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const result = await updateBudgetTransaction(form.id, {
        transactionDate: form.transactionDate,
        budgetType: form.budgetType,
        details: form.details,
        items: form.items
      });
      setForm(result.data);
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const reopen = async () => {
    if (!form?.id) return;
    try {
      const result = await reopenBudgetTransaction(form.id);
      setForm(result.data);
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <section className="employee-entry-panel arrear-entry-panel budget-entry-panel">
      <div className="form-title-row"><div><p>Budget</p><h2>Budget/Expense Edit</h2></div>{form ? <span className={`bill-status-badge ${form.status}`}>{form.status}</span> : null}</div>
      <div className="arrear-header-grid budget-header-grid">
        <label><span>Date</span><input type="date" value={form?.transactionDate || ""} onChange={(event) => setForm((current) => ({ ...current, transactionDate: event.target.value }))} disabled={!isDraft} /></label>
        <label><span>Budget Type</span><select value={form?.budgetType || "original"} onChange={(event) => setForm((current) => ({ ...current, budgetType: event.target.value }))} disabled={!isDraft}><option value="original">Original</option><option value="supplementary">Supplementary</option></select></label>
        <label><span>Document #</span><input type="number" value={documentNo} onChange={(event) => setDocumentNo(event.target.value)} onBlur={loadByDocumentNo} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); loadByDocumentNo(); } }} /></label>
        <label className="wide-field"><span>Details</span><input value={form?.details || ""} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} disabled={!isDraft} /></label>
      </div>
      {status.message ? <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p> : null}
      {form ? (
        <>
          <div className="table-wrap arrear-table-wrap">
            <table className="arrear-entry-table budget-entry-table">
              <thead><tr><th>Sr#</th><th>Code</th><th>Description</th><th>Amount</th><th>Action</th></tr></thead>
              <tbody>{form.items.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td><select value={item.accountCode} onChange={(event) => updateItem(index, "accountCode", event.target.value)} disabled={!isDraft}><option value="">Select</option>{accounts.map((account) => <option key={account.code} value={account.code}>{account.code} - {account.name}</option>)}</select></td>
                  <td><input value={item.description || item.accountName || ""} onChange={(event) => updateItem(index, "description", event.target.value)} disabled={!isDraft} /></td>
                  <td><input type="number" step="0.01" value={item.amount} onChange={(event) => updateItem(index, "amount", event.target.value)} disabled={!isDraft} /></td>
                  <td><button className="table-danger-button" type="button" disabled={!isDraft || form.items.length === 1} onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_row, rowIndex) => rowIndex !== index) }))}>Remove</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => setForm((current) => ({ ...current, items: [...current.items, emptyBudgetRow(current.items.length)] }))} disabled={!isDraft}>Add Row</button>
            <button type="button" onClick={save} disabled={!isDraft || saving}>{saving ? "Saving..." : "Save"}</button>
            <button type="button" onClick={reopen} disabled={form.status !== "finalized"}>Reopen for Correction</button>
          </div>
        </>
      ) : null}
    </section>
  );
}

function ProofReportFilter({ title, children, filters, setFilters, onRun, onCancel, loading }) {
  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <>
      <div className="form-title-row">
        <div>
          <p>Proofs</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="report-filter-panel proof-filter-panel no-print">
        <label>
          <span>Dept Code</span>
          <input type="number" name="deptCode" value={filters.deptCode} onChange={updateFilter} />
        </label>
        <label>
          <span>Gazzatted/Non Gaz</span>
          <select name="gazNg" value={filters.gazNg} onChange={updateFilter}>
            <option value="A">All</option>
            <option value="G">Gazetted</option>
            <option value="N">Non-Gazetted</option>
          </select>
        </label>
        <label>
          <span>Report For</span>
          <select name="reportFor" value={filters.reportFor} onChange={updateFilter}>
            <option value="All">All</option>
            <option value="Regular">Regular</option>
            <option value="Contract">Contract</option>
            <option value="Adhoc">Adhoc</option>
          </select>
        </label>
        {children}
        <fieldset>
          <legend>Output Selection</legend>
          <label><input type="radio" name="outputSelection" value="screen" checked={filters.outputSelection === "screen"} onChange={updateFilter} /> View</label>
          <label><input type="radio" name="outputSelection" value="printer" checked={filters.outputSelection === "printer"} onChange={updateFilter} /> Print</label>
          <label><input type="radio" name="outputSelection" value="excel" checked={filters.outputSelection === "excel"} onChange={updateFilter} /> Save as Excel</label>
        </fieldset>
        <div className="report-filter-actions">
          <button type="button" onClick={onRun} disabled={loading}>{loading ? "Loading..." : "OK"}</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </>
  );
}

function proofDefaultFilters(extra = {}) {
  return {
    deptCode: "999",
    gazNg: "A",
    reportFor: "All",
    outputSelection: "screen",
    ...extra
  };
}

function ProofReportShell({ title, endpoint, children, extraDefaults = {}, renderExtraFilters }) {
  const [filters, setFilters] = useState(proofDefaultFilters(extraDefaults));
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const runReport = async () => {
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await getProofReport(endpoint, filters);
      setReport(result.data);
      if (filters.outputSelection === "printer") {
        window.setTimeout(() => printCurrentDocumentAsExcel(title), 150);
      }
      if (filters.outputSelection === "excel") {
        exportCurrentDocumentAfterRender(title);
      }
    } catch (error) {
      setReport(null);
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    setFilters(proofDefaultFilters(extraDefaults));
    setReport(null);
    setStatus({ type: "", message: "" });
  };

  return (
    <section className="employee-entry-panel arrear-report-panel">
      <ProofReportFilter title={title} filters={filters} setFilters={setFilters} onRun={runReport} onCancel={cancel} loading={loading}>
        {renderExtraFilters ? renderExtraFilters(filters, setFilters) : null}
      </ProofReportFilter>
      {status.message ? <p className={`form-status ${status.type || "neutral"} no-print`}>{status.message}</p> : null}
      {report ? children(report, filters) : null}
    </section>
  );
}

function SalaryProofListPage() {
  return (
    <ProofReportShell
      title="Salary Proof List"
      endpoint="salary-proof-list"
      extraDefaults={{ bps: "99" }}
      renderExtraFilters={(filters, setFilters) => (
        <label>
          <span>BPS</span>
          <input type="number" value={filters.bps} onChange={(event) => setFilters((current) => ({ ...current, bps: event.target.value }))} />
        </label>
      )}
    >
      {(report, filters) => (
        <div className="arrear-report-print-area">
          <ReportLetterhead title="Salary Proof List" filterSummary={`Dept: ${filters.deptCode} | Gaz/NG: ${filters.gazNg} | BPS: ${filters.bps}`} />
          <table className="print-report-table">
            <thead><tr><th>Employee Code</th><th>Name</th><th>Dept</th><th>Designation</th><th>BPS</th><th>Gaz/NG</th><th>Basic Pay</th><th>Gross</th><th>Deductions</th><th>Net Pay</th></tr></thead>
            <tbody>
              {(report.rows || []).map((row) => (
                <tr key={row.employee_code}><td>{row.employee_code}</td><td>{row.name}</td><td>{row.department}</td><td>{row.designation}</td><td>{row.bps}</td><td>{row.gaz_ng}</td><td className="amount-cell">{formatCurrency(row.basic_pay)}</td><td className="amount-cell">{formatCurrency(row.gross)}</td><td className="amount-cell">{formatCurrency(row.deductions)}</td><td className="amount-cell">{formatCurrency(row.net_pay)}</td></tr>
              ))}
              <tr className="report-total-row"><td colSpan="6">Grand Total</td><td className="amount-cell">{formatCurrency(report.totals?.basic_pay)}</td><td className="amount-cell">{formatCurrency(report.totals?.gross)}</td><td className="amount-cell">{formatCurrency(report.totals?.deductions)}</td><td className="amount-cell">{formatCurrency(report.totals?.net_pay)}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </ProofReportShell>
  );
}

function SalaryProofList2Page() {
  return (
    <ProofReportShell title="Salary Proof List 2" endpoint="salary-proof-list-2">
      {(report, filters) => (
        <div className="arrear-report-print-area">
          <ReportLetterhead title="Salary Proof List 2" filterSummary={`Dept: ${filters.deptCode} | Gaz/NG: ${filters.gazNg}`} />
          {(report.employees || []).map((employee) => (
            <section className="print-employee-section" key={employee.employee_code}>
              <div className="print-employee-head"><strong>{employee.employee_code} - {employee.name}</strong><span>{employee.department}</span><span>{employee.designation}</span><span>BPS {employee.bps}</span><span>{employee.gaz_ng}</span></div>
              <table className="print-report-table"><thead><tr><th>Code</th><th>Description</th><th>Amount</th></tr></thead><tbody>{employee.items.map((item, index) => <tr key={index}><td>{item.code}</td><td>{item.description}</td><td className="amount-cell">{formatCurrency(item.amount)}</td></tr>)}</tbody></table>
              <div className="print-subtotal-row"><span>Pay: PKR {formatCurrency(employee.subtotal.pay)}</span><span>Deductions: PKR {formatCurrency(employee.subtotal.deductions)}</span><strong>Net: PKR {formatCurrency(employee.subtotal.net)}</strong></div>
            </section>
          ))}
          <div className="print-grand-total-row"><span>Grand Total</span><strong>Pay {formatCurrency(report.grandTotal?.pay)} | Ded {formatCurrency(report.grandTotal?.deductions)} | Net {formatCurrency(report.grandTotal?.net)}</strong></div>
        </div>
      )}
    </ProofReportShell>
  );
}

function AllowanceProofListPage() {
  return (
    <ProofReportShell title="Allowance Proof List" endpoint="allowance-proof-list">
      {(report, filters) => (
        <div className="arrear-report-print-area">
          <ReportLetterhead title="Allowance Proof List" filterSummary={`Dept: ${filters.deptCode} | Gaz/NG: ${filters.gazNg}`} />
          {(report.employees || []).map((employee) => (
            <section className="print-employee-section" key={employee.employee_code}>
              <div className="print-employee-head"><strong>{employee.employee_code} - {employee.name}</strong></div>
              <table className="print-report-table"><thead><tr><th>Code</th><th>Description</th><th>Amount</th><th>Valid Upto</th></tr></thead><tbody>{employee.items.map((item, index) => <tr key={index}><td>{item.code}</td><td>{item.description}</td><td className="amount-cell">{formatCurrency(item.amount)}</td><td>{item.valid_upto || "-"}</td></tr>)}</tbody></table>
              <div className="print-subtotal-row"><span>Employee Subtotal</span><strong>PKR {formatCurrency(employee.subtotal)}</strong></div>
            </section>
          ))}
          <div className="print-grand-total-row"><span>Grand Total</span><strong>PKR {formatCurrency(report.grandTotal)}</strong></div>
        </div>
      )}
    </ProofReportShell>
  );
}

function InactiveProofListPage() {
  const today = new Date();
  return (
    <ProofReportShell
      title="Inactive Proof List"
      endpoint="inactive-proof-list"
      extraDefaults={{ month: String(today.getMonth() + 1), year: String(today.getFullYear()) }}
      renderExtraFilters={(filters, setFilters) => (
        <>
          <label><span>Current Month</span><input type="number" min="1" max="12" value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))} /></label>
          <label><span>Current Year</span><input type="number" value={filters.year} onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))} /></label>
        </>
      )}
    >
      {(report, filters) => (
        <div className="arrear-report-print-area">
          <ReportLetterhead title="Inactive Proof List" filterSummary={`Month/Year: ${filters.month}/${filters.year}`} />
          <table className="print-report-table"><thead><tr><th>Employee Code</th><th>Name</th><th>Dept</th><th>Designation</th><th>Status</th><th>Date Inactive</th></tr></thead><tbody>{(report.rows || []).map((row) => <tr key={row.employee_code}><td>{row.employee_code}</td><td>{row.name}</td><td>{row.department}</td><td>{row.designation}</td><td>{row.status}</td><td>{row.date_inactive || "-"}</td></tr>)}{!report.rows?.length ? <tr><td colSpan="6">No inactive employees found.</td></tr> : null}</tbody></table>
        </div>
      )}
    </ProofReportShell>
  );
}

function ScaleAuditProofPrintingPage() {
  return (
    <ProofReportShell title="Scale Audit Proof Printing" endpoint="scale-audit-register">
      {(report, filters) => (
        <div className="arrear-report-print-area">
          <ReportLetterhead title="Scale Audit Register" filterSummary={`Dept: ${filters.deptCode} | Gaz/NG: ${filters.gazNg}`} />
          <table className="print-report-table"><thead><tr><th>Employee Code</th><th>Name</th><th>Dept</th><th>Designation</th><th>Old BPS</th><th>New BPS</th><th>Effective Date</th><th>Changed By</th></tr></thead><tbody>{(report.rows || []).map((row, index) => <tr key={`${row.employee_code}-${index}`}><td>{row.employee_code}</td><td>{row.name}</td><td>{row.department}</td><td>{row.designation}</td><td>{row.old_bps || "-"}</td><td>{row.new_bps}</td><td>{row.effective_date}</td><td>{row.changed_by || "-"}</td></tr>)}{!report.rows?.length ? <tr><td colSpan="8">No scale audit records found.</td></tr> : null}</tbody></table>
        </div>
      )}
    </ProofReportShell>
  );
}

function payrollDefaultFilters(extra = {}) {
  const today = new Date();
  return {
    deptCode: "999",
    gazNg: "A",
    reportFor: "All",
    month: String(today.getMonth() + 1),
    year: String(today.getFullYear()),
    outputSelection: "screen",
    ...extra
  };
}

function getPayrollFiscalYearRecord() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.PAYROLL_ACTIVE_FISCAL_YEAR || null;
}

function derivePayrollPaymentYear(monthValue, fiscalYear) {
  const month = Number(monthValue || 0);

  if (!fiscalYear?.startDate || !fiscalYear?.endDate || !month) {
    return String(new Date().getFullYear());
  }

  const startYear = new Date(fiscalYear.startDate).getFullYear();
  const endYear = new Date(fiscalYear.endDate).getFullYear();
  const fiscalStartMonth = new Date(fiscalYear.startDate).getMonth() + 1;

  return String(month >= fiscalStartMonth ? startYear : endYear);
}

function PayrollFilter({ title, filters, setFilters, onRun, onCancel, loading, allowExcel = false, simple = false }) {
  const update = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <>
      <div className="form-title-row"><div><p>Payroll</p><h2>{title}</h2></div></div>
      <div className="report-filter-panel proof-filter-panel no-print">
        {!simple ? (
          <>
            <label><span>Dept Code</span><input type="number" name="deptCode" value={filters.deptCode} onChange={update} /></label>
            <label><span>Gazzatted/Non Gaz</span><select name="gazNg" value={filters.gazNg} onChange={update}><option value="A">All</option><option value="G">Gazetted</option><option value="N">Non-Gazetted</option></select></label>
          </>
        ) : null}
        <label><span>Report For</span><select name="reportFor" value={filters.reportFor} onChange={update}><option value="All">All</option><option value="Regular">Regular</option><option value="Contract">Contract</option><option value="Adhoc">Adhoc</option></select></label>
        <label><span>Month Of Payment</span><input type="number" min="1" max="12" name="month" value={filters.month} onChange={update} /></label>
        <label><span>Payment Year</span><input type="number" name="year" value={filters.year} onChange={update} /></label>
        <fieldset>
          <legend>Output Selection</legend>
          <label><input type="radio" name="outputSelection" value="screen" checked={filters.outputSelection === "screen"} onChange={update} /> View</label>
          <label><input type="radio" name="outputSelection" value="printer" checked={filters.outputSelection === "printer"} onChange={update} /> Print</label>
          <label><input type="radio" name="outputSelection" value="excel" checked={filters.outputSelection === "excel"} onChange={update} /> Save as Excel</label>
        </fieldset>
        <div className="report-filter-actions"><button type="button" onClick={onRun} disabled={loading}>{loading ? "Loading..." : "OK"}</button><button type="button" onClick={onCancel}>Cancel</button></div>
      </div>
    </>
  );
}

function exportRowsToExcel(rows, filename) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, filename);
}

function sanitizeExcelFilename(filename) {
  const cleanName = String(filename || "payroll-document")
    .replace(/\.xlsx$/i, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return `${cleanName || "payroll-document"}.xlsx`;
}

function safeSheetName(name, fallback) {
  return String(name || fallback || "Report")
    .replace(/[\[\]\*?/\\:]/g, " ")
    .slice(0, 31)
    .trim() || "Report";
}

function getPrintableReportTitle() {
  const titleNode = document.querySelector(
    ".report-letterhead h3, .form-title-row h2, .workspace-panel h2, h1"
  );

  return titleNode?.textContent?.trim() || document.title || "Payroll Document";
}

function getVisiblePrintableTables() {
  const tables = Array.from(document.querySelectorAll(
    ".arrear-report-print-area table, .cheque-print-layout table, .print-report-table, .employee-table"
  ));

  return tables.filter((table, index, list) => (
    list.indexOf(table) === index &&
    table.offsetParent !== null &&
    !table.closest(".no-print")
  ));
}

function exportPrintableDocumentToExcel(filename) {
  const workbook = XLSX.utils.book_new();
  const tables = getVisiblePrintableTables();
  const sheetNames = new Set();

  if (tables.length) {
    tables.forEach((table, index) => {
      const worksheet = XLSX.utils.table_to_sheet(table);
      const baseName = safeSheetName(
        table.closest("section")?.querySelector("strong, h2, h3")?.textContent,
        `Report ${index + 1}`
      );
      let sheetName = baseName;
      let duplicateIndex = 2;

      while (sheetNames.has(sheetName)) {
        sheetName = safeSheetName(`${baseName} ${duplicateIndex}`, `Report ${index + 1}`);
        duplicateIndex += 1;
      }

      sheetNames.add(sheetName);
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        sheetName
      );
    });
  } else {
    const printableNode = document.querySelector(".arrear-report-print-area, .cheque-print-layout, main");
    const rows = (printableNode?.innerText || getPrintableReportTitle())
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ Detail: line }));

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(rows.length ? rows : [{ Detail: "No printable data found." }]),
      "Report"
    );
  }

  XLSX.writeFile(workbook, sanitizeExcelFilename(filename || getPrintableReportTitle()));
}

function printCurrentDocumentAsExcel(filename) {
  exportPrintableDocumentToExcel(filename);
  window.print();
}

function exportCurrentDocumentAfterRender(filename) {
  window.setTimeout(() => exportPrintableDocumentToExcel(filename), 150);
}

function PayrollReportShell({ title, endpoint, children, allowExcel = false, simple = false, extraDefaults = {}, exportRows }) {
  const [filters, setFilters] = useState(payrollDefaultFilters(extraDefaults));
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const result = await getPayrollReport(endpoint, filters);
      setReport(result.data);
      if (filters.outputSelection === "printer") window.setTimeout(() => printCurrentDocumentAsExcel(title), 150);
      if (filters.outputSelection === "excel" && exportRows) exportRowsToExcel(exportRows(result.data), `${endpoint}-${filters.month}-${filters.year}.xlsx`);
      if (filters.outputSelection === "excel" && !exportRows) exportCurrentDocumentAfterRender(title);
    } catch (error) {
      setReport(null);
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    setFilters(payrollDefaultFilters(extraDefaults));
    setReport(null);
    setStatus({ type: "", message: "" });
  };

  return (
    <section className="employee-entry-panel arrear-report-panel">
      <PayrollFilter title={title} filters={filters} setFilters={setFilters} onRun={run} onCancel={cancel} loading={loading} allowExcel={allowExcel} simple={simple} />
      {status.message ? <p className={`form-status ${status.type || "neutral"} no-print`}>{status.message}</p> : null}
      {report ? children(report, filters) : null}
    </section>
  );
}

const defaultEffectiveDate = () => new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10);
const defaultToday = () => new Date().toISOString().slice(0, 10);
const mprocessTypeOptions = ["All", "Regular", "Contract", "Adhoc"];

function MprocessWageDatalist({ id, wageCodes }) {
  return (
    <datalist id={id}>
      {wageCodes.map((wage) => (
        <option value={wage.code} key={`${id}-${wage.code}`}>
          {wage.description}
        </option>
      ))}
    </datalist>
  );
}

function MprocessConfirmModal({ title, message, onCancel, onConfirm, loading }) {
  return (
    <div className="modal-backdrop soft-modal-backdrop no-print" role="dialog" aria-modal="true" aria-label={title}>
      <div className="confirm-modal warning">
        <img src="/logo.png" alt="Wazirabad Cardiology Hospital" />
        <div>
          <p>Bulk Operation</p>
          <h3>{title}</h3>
          <span>{message}</span>
        </div>
        <div className="confirm-modal-actions">
          <button type="button" onClick={onCancel} disabled={loading}>Cancel</button>
          <button type="button" onClick={onConfirm} disabled={loading}>{loading ? "Applying..." : "Apply Changes"}</button>
        </div>
      </div>
    </div>
  );
}

function PercentAllowanceCreationPage() {
  const [form, setForm] = useState({
    sourceWageCode: "",
    percentage: "",
    targetWageCode: "",
    bps: "99",
    type: "All",
    effectiveUpto: defaultEffectiveDate()
  });
  const [wageCodes, setWageCodes] = useState([]);
  const [preview, setPreview] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getWageCodes().then(setWageCodes).catch((error) => setStatus({ type: "error", message: error.message }));
  }, []);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const reset = () => {
    setForm({ sourceWageCode: "", percentage: "", targetWageCode: "", bps: "99", type: "All", effectiveUpto: defaultEffectiveDate() });
    setPreview(null);
    setShowConfirm(false);
    setStatus({ type: "", message: "" });
  };

  const runPreview = async () => {
    if (!form.sourceWageCode || !form.percentage || !form.targetWageCode || !form.effectiveUpto) {
      setStatus({ type: "error", message: "Source code, percentage, target code and effect upto are required." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const result = await previewPercentAllowance(form);
      setPreview(result.data);
      setShowConfirm(true);
      setStatus({ type: "neutral", message: `${result.data.count} employee(s) found. Review preview before applying.` });
    } catch (error) {
      setPreview(null);
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    setLoading(true);
    try {
      const result = await applyPercentAllowance(form);
      setPreview(result.data);
      setShowConfirm(false);
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="employee-entry-panel mprocess-panel">
      {showConfirm ? <MprocessConfirmModal title="Apply Percentage Allowance" message={`This will update allowance ${form.targetWageCode} for ${preview?.count || 0} employees. Continue?`} onCancel={() => setShowConfirm(false)} onConfirm={apply} loading={loading} /> : null}
      <div className="form-title-row"><div><p>M.Process</p><h2>New Percent Allowance Creation</h2></div></div>
      <div className="mprocess-form">
        <label><span>Code For Percentage</span><input name="sourceWageCode" value={form.sourceWageCode} onChange={update} list="percent-source-codes" placeholder="0001" /></label>
        <label><span>% Age Of Code</span><input type="number" step="0.01" name="percentage" value={form.percentage} onChange={update} /></label>
        <label><span>Code Of New Amount</span><input name="targetWageCode" value={form.targetWageCode} onChange={update} list="percent-target-codes" placeholder="1007" /></label>
        <label><span>BPS (99-all)</span><input type="number" name="bps" value={form.bps} onChange={update} /></label>
        <label><span>Type</span><select name="type" value={form.type} onChange={update}>{mprocessTypeOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label><span>Effect Upto</span><input type="date" name="effectiveUpto" value={form.effectiveUpto} onChange={update} /></label>
        <div className="report-filter-actions"><button type="button" onClick={reset}>Cancel</button><button type="button" onClick={runPreview} disabled={loading}>{loading ? "Loading..." : "Change"}</button></div>
      </div>
      <MprocessWageDatalist id="percent-source-codes" wageCodes={wageCodes} />
      <MprocessWageDatalist id="percent-target-codes" wageCodes={wageCodes} />
      {status.message ? <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p> : null}
      {preview ? <MprocessPreviewTable type="percentage" preview={preview} /> : null}
    </section>
  );
}

function FixedAllowanceCreationPage() {
  const [form, setForm] = useState({
    amount: "",
    targetWageCode: "",
    type: "All",
    designationCode: "999",
    effectiveUpto: defaultEffectiveDate()
  });
  const [wageCodes, setWageCodes] = useState([]);
  const [preview, setPreview] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getWageCodes().then(setWageCodes).catch((error) => setStatus({ type: "error", message: error.message }));
  }, []);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const reset = () => {
    setForm({ amount: "", targetWageCode: "", type: "All", designationCode: "999", effectiveUpto: defaultEffectiveDate() });
    setPreview(null);
    setShowConfirm(false);
    setStatus({ type: "", message: "" });
  };

  const runPreview = async () => {
    if (!form.amount || !form.targetWageCode || !form.effectiveUpto) {
      setStatus({ type: "error", message: "Amount, target code and effect upto are required." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const result = await previewFixedAllowance(form);
      setPreview(result.data);
      setShowConfirm(true);
      setStatus({ type: "neutral", message: `${result.data.count} employee(s) found. Review preview before applying.` });
    } catch (error) {
      setPreview(null);
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    setLoading(true);
    try {
      const result = await applyFixedAllowance(form);
      setPreview(result.data);
      setShowConfirm(false);
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="employee-entry-panel mprocess-panel">
      {showConfirm ? <MprocessConfirmModal title="Apply Fixed Allowance" message={`This will update allowance ${form.targetWageCode} for ${preview?.count || 0} employees. Continue?`} onCancel={() => setShowConfirm(false)} onConfirm={apply} loading={loading} /> : null}
      <div className="form-title-row"><div><p>M.Process</p><h2>Fixed Amount Allowance Creation</h2></div></div>
      <div className="mprocess-form fixed-allowance-form">
        <label><span>Amount</span><input type="number" step="0.01" name="amount" value={form.amount} onChange={update} /></label>
        <label><span>Code Of New Amount</span><input name="targetWageCode" value={form.targetWageCode} onChange={update} list="fixed-target-codes" placeholder="1007" /></label>
        <label><span>Type</span><select name="type" value={form.type} onChange={update}>{mprocessTypeOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label><span>Designation (999-all)</span><input name="designationCode" value={form.designationCode} onChange={update} /></label>
        <label><span>Effect Upto</span><input type="date" name="effectiveUpto" value={form.effectiveUpto} onChange={update} /></label>
        <div className="report-filter-actions"><button type="button" onClick={reset}>Cancel</button><button type="button" onClick={runPreview} disabled={loading}>{loading ? "Loading..." : "Change"}</button></div>
      </div>
      <MprocessWageDatalist id="fixed-target-codes" wageCodes={wageCodes} />
      {status.message ? <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p> : null}
      {preview ? <MprocessPreviewTable type="fixed" preview={preview} /> : null}
    </section>
  );
}

function AnnualIncrementPage({ onGoBack }) {
  const [form, setForm] = useState({ incrementPercentage: "", appliesToWageCode: "0001", effectiveDate: defaultToday() });
  const [wageCodes, setWageCodes] = useState([]);
  const [preview, setPreview] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getWageCodes().then(setWageCodes).catch((error) => setStatus({ type: "error", message: error.message }));
  }, []);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const reset = () => {
    setForm({ incrementPercentage: "", appliesToWageCode: "0001", effectiveDate: defaultToday() });
    setPreview(null);
    setShowConfirm(false);
    setStatus({ type: "", message: "" });
    if (onGoBack) onGoBack();
  };

  const runPreview = async () => {
    if (!form.incrementPercentage || !form.appliesToWageCode || !form.effectiveDate) {
      setStatus({ type: "error", message: "Increment percentage, wage code and effective date are required." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const result = await previewAnnualIncrement(form);
      setPreview(result.data);
      setShowConfirm(true);
      setStatus({ type: "neutral", message: `${result.data.count} employee(s) found. Review preview before applying.` });
    } catch (error) {
      setPreview(null);
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    setLoading(true);
    try {
      const result = await applyAnnualIncrement(form);
      setPreview(result.data);
      setShowConfirm(false);
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="employee-entry-panel mprocess-panel">
      {showConfirm ? <MprocessConfirmModal title="Apply Annual Increment" message={`This will increment basic pay for ${preview?.count || 0} employees. Continue?`} onCancel={() => setShowConfirm(false)} onConfirm={apply} loading={loading} /> : null}
      <div className="form-title-row"><div><p>M.Process</p><h2>Annual Increment</h2></div></div>
      <div className="mprocess-form annual-increment-form">
        <label><span>Increment Percentage</span><input type="number" step="0.01" name="incrementPercentage" value={form.incrementPercentage} onChange={update} /></label>
        <label><span>Applies To</span><input name="appliesToWageCode" value={form.appliesToWageCode} onChange={update} list="increment-wage-codes" /></label>
        <label><span>Effective Date</span><input type="date" name="effectiveDate" value={form.effectiveDate} onChange={update} /></label>
        <div className="report-filter-actions"><button type="button" onClick={reset}>Cancel</button><button type="button" onClick={runPreview} disabled={loading}>{loading ? "Loading..." : "Start"}</button></div>
      </div>
      <MprocessWageDatalist id="increment-wage-codes" wageCodes={wageCodes} />
      {status.message ? <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p> : null}
      {preview ? <MprocessPreviewTable type="increment" preview={preview} /> : null}
    </section>
  );
}

function MprocessPreviewTable({ type, preview }) {
  const rows = preview.items || [];
  const isIncrement = type === "increment";
  const isFixed = type === "fixed";

  return (
    <div className="table-wrap mprocess-preview-wrap">
      <div className="mprocess-preview-summary">
        <span>{preview.count || 0} employee(s)</span>
        <strong>
          Grand Total: PKR {formatCurrency(isIncrement ? preview.totalIncrementAmount : preview.grandTotal)}
        </strong>
      </div>
      <table className="department-table mprocess-preview-table">
        <thead>
          <tr>
            <th>Employee Code</th>
            <th>Name</th>
            {isFixed ? <th>Designation</th> : null}
            {isIncrement ? <th>Current Basic Pay</th> : <th>{isFixed ? "Fixed Amount" : "Old Amount"}</th>}
            {isIncrement ? <th>New Basic Pay</th> : <th>{isFixed ? "Amount To Apply" : "New Amount"}</th>}
            {isIncrement ? <th>Increment</th> : <th>Target Code</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.employeeCode}>
              <td>{row.employeeCode}</td>
              <td>{row.name}</td>
              {isFixed ? <td>{row.designation || "-"}</td> : null}
              <td className="amount-cell">{formatCurrency(isIncrement ? row.currentBasicPay : row.sourceAmount || row.fixedAmount)}</td>
              <td className="amount-cell">{formatCurrency(isIncrement ? row.newBasicPay : row.calculatedNewAmount || row.fixedAmount)}</td>
              <td className={isIncrement ? "amount-cell" : ""}>{isIncrement ? formatCurrency(row.incrementAmount) : row.targetWageCode}</td>
            </tr>
          ))}
          {!rows.length ? (
            <tr><td colSpan={isFixed ? 6 : 5}>No employees found for this filter.</td></tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

const payrollMonthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function normalizePayrollRun(data) {
  if (!data) {
    return null;
  }

  const employees = data.employees || data.items || [];
  const totals = data.totals || {
    grossPay: Number(data.totalGross || data.total_gross || 0),
    totalDeductions: Number(data.totalDeductions || data.total_deductions || 0),
    netPay: Number(data.totalNet || data.total_net || 0)
  };

  return {
    ...data,
    runId: data.runId || data.run_id || data.id,
    employees,
    items: employees,
    totals,
    employeesProcessed: data.employeesProcessed || data.employees_processed || employees.length
  };
}

function normalizePayrollPreview(data) {
  if (!data) {
    return null;
  }

  const normalized = normalizePayrollRun(data);
  return {
    ...normalized,
    fiscalYear: data.fiscalYear || null,
    fiscalYearName: data.fiscalYearName || data.fiscalYear?.name || null,
    existingRunId: data.existingRunId || data.existing_run_id || null,
    existingRunStatus: data.existingRunStatus || data.existing_run_status || null,
    warningMessage: data.warningMessage || data.warning_message || null,
    taxPolicyName: data.taxPolicyName || null,
    taxBasis: data.taxBasis || null,
    taxTotal: Number(data.taxTotal || data.tax_total || normalized?.totals?.taxAmount || 0)
  };
}

function formatPayrollPeriodLabel(month, year) {
  const monthIndex = Number(month) - 1;
  const monthName = payrollMonthOptions[monthIndex] || String(month || "");
  return `${String(month || "").padStart(2, "0")}/${year} (${monthName} ${year})`;
}

function formatTaxSlabRange(slab) {
  if (!slab) {
    return "-";
  }

  if (slab.range) {
    return slab.range;
  }

  const fromIncome = Number(slab.fromIncome || 0);
  const toIncome = slab.toIncome === null || slab.toIncome === undefined ? null : Number(slab.toIncome);
  if (toIncome === null) {
    return `PKR ${formatCurrency(fromIncome)} and above`;
  }

  return `PKR ${formatCurrency(fromIncome)} to PKR ${formatCurrency(toIncome)}`;
}

function PayrollPreviewTable({ preview }) {
  const rows = preview?.employees || preview?.items || [];
  const totals = preview?.totals || { grossPay: 0, totalDeductions: 0, netPay: 0, taxAmount: 0 };
  const annualizedTotal = rows.reduce((sum, row) => sum + Number(row.taxPreview?.annualizedIncome ?? (row.grossPay || 0) * 12), 0);
  const priorCreditTotal = rows.reduce((sum, row) => sum + Number(row.taxPreview?.priorEmployerTaxCredit || 0), 0);
  const companyTaxPaidTotal = rows.reduce((sum, row) => sum + Number(row.taxPreview?.companyTaxPaidYTD || 0), 0);

  return (
    <div className="salary-preview-wrap">
      <div className="salary-preview-summary">
        <div>
          <span>Fiscal Year</span>
          <strong>{preview?.fiscalYear?.name || preview?.fiscalYearName || "-"}</strong>
        </div>
        <div>
          <span>Tax Policy</span>
          <strong>{preview?.taxPolicyName || "-"}</strong>
        </div>
        <div>
          <span>Tax Basis</span>
          <strong>{preview?.taxBasis || "-"}</strong>
        </div>
        <div>
          <span>Prior Employer Credit</span>
          <strong>PKR {formatCurrency(priorCreditTotal)}</strong>
        </div>
        <div>
          <span>Company Tax YTD</span>
          <strong>PKR {formatCurrency(companyTaxPaidTotal)}</strong>
        </div>
        <div>
          <span>Employees</span>
          <strong>{rows.length}</strong>
        </div>
        <div>
          <span>Tax Total</span>
          <strong>PKR {formatCurrency(preview?.taxTotal ?? totals.taxAmount ?? 0)}</strong>
        </div>
      </div>
      <div className="table-wrap salary-preview-table-wrap">
        <table className="print-report-table salary-preview-table">
          <thead>
            <tr>
              <th>Employee Code</th>
              <th>Name</th>
              <th>Gross Pay</th>
              <th>Annualized Income</th>
              <th>Tax Slab</th>
              <th>Opening Credit</th>
              <th>Tax Paid YTD</th>
              <th>Tax Amount</th>
              <th>Net Pay</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.employeeCode}>
                <td>{row.employeeCode}</td>
                <td>{row.name || "-"}</td>
                <td className="amount-cell">{formatCurrency(row.grossPay)}</td>
                <td className="amount-cell">{formatCurrency(row.taxPreview?.annualizedIncome ?? row.grossPay * 12)}</td>
                <td>{formatTaxSlabRange(row.taxPreview?.slab)}</td>
                <td className="amount-cell">{formatCurrency(row.taxPreview?.priorEmployerTaxCredit || 0)}</td>
                <td className="amount-cell">{formatCurrency(row.taxPreview?.companyTaxPaidYTD || 0)}</td>
                <td className="amount-cell">{formatCurrency(row.taxAmount ?? 0)}</td>
                <td className="amount-cell">{formatCurrency(row.netPay)}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan="9">No employees found for this preview.</td>
              </tr>
            ) : null}
            <tr className="report-total-row">
              <td colSpan="2">Grand Total ({rows.length} employee{rows.length === 1 ? "" : "s"})</td>
              <td className="amount-cell">{formatCurrency(totals.grossPay)}</td>
              <td className="amount-cell">{formatCurrency(annualizedTotal)}</td>
              <td className="amount-cell">-</td>
              <td className="amount-cell">{formatCurrency(priorCreditTotal)}</td>
              <td className="amount-cell">{formatCurrency(companyTaxPaidTotal)}</td>
              <td className="amount-cell">{formatCurrency(preview?.taxTotal ?? totals.taxAmount ?? 0)}</td>
              <td className="amount-cell">{formatCurrency(totals.netPay)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayrollCalculationResults({ result, filters }) {
  const rows = result?.employees || result?.items || [];
  const totals = result?.totals || { grossPay: 0, totalDeductions: 0, netPay: 0 };
  const journal = result?.journalEntry || null;

  return (
    <div className="arrear-report-print-area salary-calculation-results">
      <ReportLetterhead title="Salary Calculation" filterSummary={`${filters.month}/${filters.year} | Dept ${filters.deptCode || "999"}`} />
      <div className="print-section-head">
        <strong>Employees Processed: {rows.length}</strong>
        <span>Gross: PKR {formatCurrency(totals.grossPay)}</span>
        <span>Deductions: PKR {formatCurrency(totals.totalDeductions)}</span>
        <span>Net: PKR {formatCurrency(totals.netPay)}</span>
      </div>
      {journal ? (
        <div className="journal-summary-panel">
          <div className="print-section-head">
            <strong>Journal Entry: {journal.referenceNo}</strong>
            <span>Entry Date: {journal.entryDate}</span>
            <span>Debit: PKR {formatCurrency(journal.totalDebit)}</span>
            <span>Credit: PKR {formatCurrency(journal.totalCredit)}</span>
          </div>
          <table className="print-report-table salary-calculation-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Description</th>
                <th>Employee</th>
                <th>Wage Code</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {(journal.lines || []).map((line) => (
                <tr key={line.id || `${line.lineNo}-${line.accountCode}`}>
                  <td>{line.accountCode}{line.accountName ? ` - ${line.accountName}` : ""}</td>
                  <td>{line.description || "-"}</td>
                  <td>{line.employeeCode || "-"}</td>
                  <td>{line.wageCode || "-"}</td>
                  <td className="amount-cell">{formatCurrency(line.debit)}</td>
                  <td className="amount-cell">{formatCurrency(line.credit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <table className="print-report-table salary-calculation-table">
        <thead>
          <tr>
            <th>Employee Code</th>
            <th>Name</th>
            <th>Department</th>
            <th>Gross Pay</th>
            <th>Total Deductions</th>
            <th>Net Pay</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.employeeCode}>
              <td>{row.employeeCode}</td>
              <td>{row.name || "-"}</td>
              <td>{row.department || "-"}</td>
              <td className="amount-cell">{formatCurrency(row.grossPay)}</td>
              <td className="amount-cell">{formatCurrency(row.totalDeductions)}</td>
              <td className="amount-cell">{formatCurrency(row.netPay)}</td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan="6">No employees processed.</td>
            </tr>
          ) : null}
          <tr className="report-total-row">
            <td colSpan="3">Grand Total ({rows.length} employee{rows.length === 1 ? "" : "s"})</td>
            <td className="amount-cell">{formatCurrency(totals.grossPay)}</td>
            <td className="amount-cell">{formatCurrency(totals.totalDeductions)}</td>
            <td className="amount-cell">{formatCurrency(totals.netPay)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PayrollProcessPage({ title = "Salary Calculation", onGoBack, activeFiscalYear = null }) {
  const [filters, setFilters] = useState(payrollDefaultFilters());
  const [result, setResult] = useState(null);
  const [runs, setRuns] = useState([]);
  const [draftRun, setDraftRun] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [correctionDialog, setCorrectionDialog] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [loadingRunId, setLoadingRunId] = useState(null);
  const [historyFilters, setHistoryFilters] = useState({ search: "", status: "all" });
  const fiscalYear = fiscalYears.find((record) => String(record.id) === String(selectedFiscalYearId))
    || activeFiscalYear
    || getPayrollFiscalYearRecord();
  const paymentYear = derivePayrollPaymentYear(filters.month, fiscalYear);
  const selectedDepartment = departments.find((department) => String(department.code) === String(filters.deptCode));
  const departmentOptions = [{ code: "999", department: "All Departments" }, ...departments];
  const historyRows = runs.filter((run) => {
    const search = historyFilters.search.trim().toLowerCase();
    const statusFilter = String(historyFilters.status || "all").toLowerCase();
    const statusMatch = statusFilter === "all" || String(run.status || "").toLowerCase() === statusFilter;

    if (!statusMatch) {
      return false;
    }

    if (!search) {
      return true;
    }

    const haystack = [
      run.paymentMonth ? `${String(run.paymentMonth).padStart(2, "0")}/${run.paymentYear}` : "",
      run.fiscalYearName,
      run.deptCode,
      run.status,
      run.employeeCount,
      run.totalGross,
      run.totalDeductions,
      run.totalNet,
      run.journalReferenceNo,
      run.reversalJournalReferenceNo
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });

  const loadRuns = async (nextFilters = filters) => {
    const data = await getPayrollRuns(nextFilters);
    setRuns(data.data || []);
    return data.data || [];
  };

  const loadMasters = async () => {
    try {
      const [departmentResponse, fiscalYearResponse] = await Promise.all([
        getDepartments(),
        getFiscalYears()
      ]);

      const departmentRows = departmentResponse || [];
      const fiscalYearRows = fiscalYearResponse || [];

      setDepartments(departmentRows);
      setFiscalYears(fiscalYearRows);

      const activeRow = fiscalYearRows.find((record) => Number(record.isActive) === 1)
        || fiscalYearRows[0]
        || activeFiscalYear
        || getPayrollFiscalYearRecord();

      if (activeRow?.id) {
        setSelectedFiscalYearId((current) => current || String(activeRow.id));
      }
    } catch {
      setDepartments([]);
      setFiscalYears([]);
    }
  };

  const loadCurrentPeriod = async () => {
    try {
      const response = await getPayrollCurrentPeriod();
      if (response.data) {
        const currentDraft = response.data;
        const nextFilters = {
          ...payrollDefaultFilters(),
          month: String(currentDraft.paymentMonth),
          year: String(currentDraft.paymentYear),
          deptCode: String(currentDraft.deptCode || "999")
        };
        setDraftRun(currentDraft);
        setFilters(nextFilters);
        if (currentDraft.fiscalYearId) {
          setSelectedFiscalYearId(String(currentDraft.fiscalYearId));
        }
        await loadRuns(nextFilters);
        setStatus({ type: "neutral", message: "Draft payroll period found. You can resume processing." });
      } else {
        await loadRuns(filters);
      }
    } catch (error) {
      await loadRuns(filters);
    }
  };

  useEffect(() => {
    loadMasters();
    loadCurrentPeriod();
  }, []);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      year: derivePayrollPaymentYear(current.month, fiscalYear)
    }));
  }, [fiscalYear, selectedFiscalYearId]);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    if (name === "fiscalYearId") {
      setSelectedFiscalYearId(value);
      return;
    }

    setFilters((current) => {
      const next = { ...current, [name]: value };
      if (name === "month") {
        next.year = derivePayrollPaymentYear(value, fiscalYear);
      }
      return next;
    });
  };

  const getCorrectionImpactText = (run, action) => {
    const periodLabel = formatPayrollPeriodLabel(run?.paymentMonth, run?.paymentYear);
    const journalText = run?.journalReferenceNo
      ? ` Journal ${run.journalReferenceNo}${run.reversalJournalReferenceNo ? ` already has reversal ${run.reversalJournalReferenceNo}.` : "."}`
      : " No journal entry is linked yet.";

    if (action === "reprocess") {
      return `${periodLabel} dept ${run?.deptCode || "999"} will be reopened, the existing journal will be reversed if posted, and the run will return to draft so it can be posted again.${journalText}`;
    }

    return `${periodLabel} dept ${run?.deptCode || "999"} will be voided and a reversal journal entry will be created if the run was posted.${journalText}`;
  };

  const openCorrectionDialog = (run, action) => {
    if (!run) return;

    setCorrectionDialog({
      run,
      action,
      message: getCorrectionImpactText(run, action)
    });
  };

  const closeCorrectionDialog = () => {
    setCorrectionDialog(null);
  };

  const resolveRunForCorrection = async (runId) => {
    const historyMatch = runs.find((runItem) => String(runItem.id) === String(runId));
    if (historyMatch) {
      return historyMatch;
    }

    const response = await getPayrollRun(runId);
    return normalizePayrollRun(response.data);
  };

  const applyRunCorrection = async () => {
    if (!correctionDialog?.run) {
      return;
    }

    const { run, action } = correctionDialog;
    setCorrectionDialog(null);
    setLoading(true);
    setStatus({ type: "neutral", message: action === "reprocess" ? "Reopening payroll run..." : "Voiding payroll run..." });

    try {
      if (action === "reprocess") {
        await reopenPayrollRun(run.id);
        const reopened = await getPayrollRun(run.id);
        const normalizedRun = normalizePayrollRun(reopened.data);
        setDraftRun(normalizedRun);
        setResult(null);
        setFilters((current) => ({
          ...current,
          month: String(run.paymentMonth),
          year: String(run.paymentYear),
          deptCode: String(run.deptCode || "999")
        }));
        if (run.fiscalYearId) {
          setSelectedFiscalYearId(String(run.fiscalYearId));
        }
        await loadRuns({
          month: String(run.paymentMonth),
          year: String(run.paymentYear),
          deptCode: String(run.deptCode || "999")
        });
        setStatus({ type: "success", message: "Payroll run reopened. Review the period and click Resume to regenerate it." });
        return;
      }

      await voidPayrollRun(run.id);
      setResult(null);
      setDraftRun(null);
      await loadRuns();
      await loadCurrentPeriod();
      setStatus({ type: "success", message: "Payroll run voided and reversal journal posted." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const run = async () => {
    if (!filters.month || !filters.year) {
      setStatus({ type: "error", message: "Month and year are required." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await previewPayroll({ ...filters, year: paymentYear });
      const preview = normalizePayrollPreview(response.data);
      const previewMessage = preview?.warningMessage
        ? `${preview.warningMessage} Review the preview before posting payroll for ${filters.month}/${paymentYear}.`
        : `Review the preview for ${preview?.fiscalYearName || "the selected fiscal year"} before posting payroll for ${filters.month}/${paymentYear}.`;
      setConfirmDialog({
        preview,
        message: previewMessage
      });
      setStatus({
        type: "neutral",
        message: preview?.warningMessage || "Payroll preview loaded. Review the slab and tax details before posting."
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const processConfirmedRun = async () => {
    setConfirmDialog(null);
    setLoading(true);
    setStatus({ type: "neutral", message: "Posting payroll..." });

    try {
      const response = await processPayroll({ ...filters, year: paymentYear });
      setResult(normalizePayrollRun(response.data));
      setStatus({ type: "success", message: response.message });
      setDraftRun(null);
      await loadRuns();
    } catch (error) {
      if (error.status === 409 && error.data?.runId) {
        try {
          const runResponse = await getPayrollRun(error.data.runId);
          setResult(normalizePayrollRun(runResponse.data));
          setStatus({ type: "neutral", message: "Payroll already processed for this period. Existing result loaded." });
          await loadRuns();
        } catch (loadError) {
          setStatus({ type: "error", message: loadError.message });
        }
      } else {
        setStatus({ type: "error", message: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const reopenCurrentRun = async () => {
    const runId = result?.runId || runs.find((runItem) => ["processed", "locked"].includes(runItem.status))?.id;
    if (!runId) return;

    try {
      const run = await resolveRunForCorrection(runId);
      openCorrectionDialog(run, "reprocess");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const voidCurrentRun = async () => {
    const runId = result?.runId || runs.find((runItem) => ["processed", "locked"].includes(runItem.status))?.id;
    if (!runId) return;

    try {
      const run = await resolveRunForCorrection(runId);
      openCorrectionDialog(run, "void");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const viewRunHistory = async (runId) => {
    setLoadingRunId(runId);
    try {
      const response = await getPayrollRun(runId);
      setResult(normalizePayrollRun(response.data));
      setStatus({ type: "neutral", message: "Payroll run loaded from history." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoadingRunId(null);
    }
  };

  const exportHistory = () => {
    const rows = historyRows.map((run) => ({
      Month: run.paymentMonth ? `${String(run.paymentMonth).padStart(2, "0")}/${run.paymentYear}` : "",
      "Fiscal Year": run.fiscalYearName || "",
      Department: run.deptCode || "",
      Status: run.status || "",
      Employees: run.employeeCount || 0,
      Gross: Number(run.totalGross || 0),
      Deductions: Number(run.totalDeductions || 0),
      Net: Number(run.totalNet || 0),
      Journal: run.journalReferenceNo || "",
      Reversal: run.reversalJournalReferenceNo || "",
      "Processed At": run.processedAt || ""
    }));

    exportRowsToExcel(rows, `payroll-run-history-${filters.month || "all"}-${filters.year || "all"}.xlsx`);
  };

  const goBack = () => {
    setFilters(payrollDefaultFilters());
    setResult(null);
    setStatus({ type: "", message: "" });
    setDraftRun(null);
    setSelectedFiscalYearId("");
    if (onGoBack) onGoBack();
  };

  const exportResult = () => {
    const rows = (result?.employees || result?.items || []).map((row) => ({
      "Employee Code": row.employeeCode,
      Name: row.name,
      Department: row.department,
      "Gross Pay": row.grossPay,
      "Total Deductions": row.totalDeductions,
      "Net Pay": row.netPay
    }));
    exportRowsToExcel(rows, `salary-calculation-${filters.month}-${paymentYear}.xlsx`);
  };

  const hasProcessedRun = Boolean(result?.runId) || runs.some((runItem) => ["processed", "locked"].includes(runItem.status));

  return (
    <section className="employee-entry-panel arrear-report-panel salary-calculation-panel">
      {confirmDialog ? (
        <div className="modal-backdrop soft-modal-backdrop no-print" role="dialog" aria-modal="true" aria-label="Payroll preview">
          <div className="confirm-modal salary-preview-modal">
            <img src="/logo.png" alt="Wazirabad Cardiology Hospital" />
            <div>
              <p>Salary Calculation</p>
              <h3>Payroll Preview</h3>
              <span>{confirmDialog.message}</span>
            </div>
            {confirmDialog.preview ? <PayrollPreviewTable preview={confirmDialog.preview} /> : null}
            <div className="confirm-modal-actions">
              <button type="button" onClick={() => setConfirmDialog(null)}>Cancel</button>
              <button type="button" onClick={processConfirmedRun}>Post Payroll</button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="form-title-row">
        <div>
          <p>M.Process</p>
          <h2>{title}</h2>
        </div>
        <div className="title-actions no-print">
          <span>{fiscalYear?.name || getActiveFiscalYearLabel()}</span>
          <span>Payment Year {paymentYear}</span>
          {result ? <button className="refresh-button" type="button" onClick={() => printCurrentDocumentAsExcel(title)}>Print</button> : null}
          {result ? <button type="button" onClick={exportResult}>Save as Excel</button> : null}
        </div>
      </div>
      <div className="salary-period-form no-print">
        <label>
          <span>Fiscal Year</span>
          <select name="fiscalYearId" value={selectedFiscalYearId} onChange={updateFilter}>
            {(fiscalYears.length ? fiscalYears : fiscalYear ? [fiscalYear] : []).map((record) => (
              <option value={String(record.id)} key={record.id}>{record.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Month</span>
          <select name="month" value={filters.month} onChange={updateFilter}>
            {payrollMonthOptions.map((monthName, index) => (
              <option value={String(index + 1)} key={monthName}>{index + 1} - {monthName}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Dept Code</span>
          <select name="deptCode" value={filters.deptCode} onChange={updateFilter}>
            {departmentOptions.map((department) => (
              <option key={department.code} value={department.code}>
                {department.code} - {department.department}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Dept Name</span>
          <input type="text" value={selectedDepartment?.department || (String(filters.deptCode) === "999" ? "All Departments" : "")} readOnly />
        </label>
        <div className="report-filter-actions">
          <button type="button" onClick={goBack}>Go Back</button>
          <button type="button" onClick={run} disabled={loading}>{loading ? "Calculating..." : draftRun ? "Resume" : "Start"}</button>
        </div>
      </div>
      {status.message ? <p className={`form-status ${status.type || "neutral"} no-print`}>{status.message}</p> : null}
      {hasProcessedRun ? (
        <div className="salary-run-actions no-print">
          <button className="refresh-button" type="button" onClick={reopenCurrentRun}>Reopen for Reprocessing</button>
          <button type="button" onClick={voidCurrentRun}>Void / Delete</button>
        </div>
      ) : null}
      <section className="employee-entry-panel payroll-history-panel no-print" aria-label="Payroll run history">
        <div className="form-title-row">
          <div>
            <p>Payroll</p>
            <h2>Payroll Run History</h2>
          </div>
          <div className="salary-run-actions">
            <span>{historyRows.length} run{historyRows.length === 1 ? "" : "s"}</span>
            <button type="button" onClick={exportHistory} disabled={!historyRows.length}>Export</button>
          </div>
        </div>
        <div className="report-filter-panel no-print">
          <label>
            <span>Search</span>
            <input
              type="search"
              placeholder="Month, fiscal year, dept, status, journal..."
              value={historyFilters.search}
              onChange={(event) => setHistoryFilters((current) => ({ ...current, search: event.target.value }))}
            />
          </label>
          <label>
            <span>Status</span>
            <select
              value={historyFilters.status}
              onChange={(event) => setHistoryFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="processed">Processed</option>
              <option value="locked">Locked</option>
              <option value="void">Void</option>
            </select>
          </label>
        </div>
        <div className="table-wrap">
          <table className="employee-table payroll-history-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Fiscal Year</th>
                <th>Dept</th>
                <th>Status</th>
                <th>Employees</th>
                <th>Gross</th>
                <th>Deductions</th>
                <th>Net</th>
                <th>Journal</th>
                <th>Reversal</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.map((run) => (
                <tr key={run.id}>
                  <td>{String(run.paymentMonth).padStart(2, "0")}/{run.paymentYear}</td>
                  <td>{run.fiscalYearName || "-"}</td>
                  <td>{run.deptCode}</td>
                  <td>
                    <span className="employee-status-pill neutral">{run.status}</span>
                  </td>
                  <td>{run.employeeCount || 0}</td>
                  <td className="amount-cell">{formatCurrency(run.totalGross)}</td>
                  <td className="amount-cell">{formatCurrency(run.totalDeductions)}</td>
                  <td className="amount-cell">{formatCurrency(run.totalNet)}</td>
                  <td>{run.journalReferenceNo || "-"}</td>
                  <td>{run.reversalJournalReferenceNo || "-"}</td>
                  <td>
                    <div className="salary-run-actions">
                      <button type="button" onClick={() => viewRunHistory(run.id)} disabled={loadingRunId === run.id}>
                        {loadingRunId === run.id ? "Loading..." : "View"}
                      </button>
                      {["processed", "locked"].includes(String(run.status)) ? (
                        <>
                          <button type="button" onClick={() => openCorrectionDialog(run, "reprocess")}>Reprocess</button>
                          <button type="button" onClick={() => openCorrectionDialog(run, "void")}>Void</button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!historyRows.length ? (
                <tr>
                  <td colSpan="11">No payroll runs found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
      {correctionDialog ? (
        <div className="modal-backdrop soft-modal-backdrop no-print" role="dialog" aria-modal="true" aria-label="Payroll correction">
          <div className="confirm-modal salary-preview-modal payroll-correction-modal">
            <img src="/logo.png" alt="Wazirabad Cardiology Hospital" />
            <div>
              <p>Payroll Correction</p>
              <h3>{correctionDialog.action === "reprocess" ? "Reprocess Run" : "Void Run"}</h3>
              <span>
                {formatPayrollPeriodLabel(correctionDialog.run?.paymentMonth, correctionDialog.run?.paymentYear)}
                {" | "}
                Dept {correctionDialog.run?.deptCode || "999"}
              </span>
              <p className="correction-impact-text">{correctionDialog.message}</p>
            </div>
            <div className="correction-impact-summary">
              <article>
                <span>Status</span>
                <strong>{correctionDialog.run?.status || "-"}</strong>
              </article>
              <article>
                <span>Journal</span>
                <strong>{correctionDialog.run?.journalReferenceNo || "None"}</strong>
              </article>
              <article>
                <span>Reversal</span>
                <strong>{correctionDialog.run?.reversalJournalReferenceNo || "None"}</strong>
              </article>
            </div>
            <div className="confirm-modal-actions">
              <button type="button" onClick={closeCorrectionDialog}>Cancel</button>
              <button type="button" onClick={applyRunCorrection}>
                {correctionDialog.action === "reprocess" ? "Reprocess Now" : "Void Run"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {result ? <PayrollCalculationResults result={result} filters={filters} /> : null}
    </section>
  );
}

function BankSummaryPage() {
  return <PayrollReportShell title="Bank Summary" endpoint="bank-summary" allowExcel exportRows={(r) => (r.banks || []).flatMap((b) => b.branches.flatMap((br) => br.employees.map((e) => ({ Bank: b.bankName, Branch: br.branchName, Employee: e.employeeCode, Name: e.name, Account: e.accountNo, Net: e.netPay }))))}>{(report, filters) => <div className="arrear-report-print-area"><ReportLetterhead title="Bank Summary" filterSummary={`${filters.month}/${filters.year}`} />{(report.banks || []).map((bank) => <section className="print-employee-section" key={bank.bankName}><div className="print-employee-head"><strong>{bank.bankName}</strong></div>{bank.branches.map((branch) => <section className="nested-print-section print-bill-section" key={branch.branchName}><div className="print-section-head"><strong>{branch.branchName}</strong></div><table className="print-report-table"><thead><tr><th>Employee</th><th>Name</th><th>Account No</th><th>Net Pay</th></tr></thead><tbody>{branch.employees.map((e) => <tr key={e.employeeCode}><td>{e.employeeCode}</td><td>{e.name}</td><td>{e.accountNo}</td><td className="amount-cell">{formatCurrency(e.netPay)}</td></tr>)}</tbody></table><div className="print-subtotal-row"><span>Branch Subtotal</span><strong>PKR {formatCurrency(branch.subtotal)}</strong></div></section>)}</section>)}<div className="print-grand-total-row"><span>Grand Total</span><strong>PKR {formatCurrency(report.grandTotal)}</strong></div></div>}</PayrollReportShell>;
}

function NonBankSalaryPage() {
  return <PayrollReportShell title="Non Bank Salary" endpoint="non-bank-salary">{(report, filters) => <FlatPayrollTable title="Non Bank Salary" rows={report.rows || []} filters={filters} total={report.grandTotal} columns={["employeeCode", "name", "department", "designation", "netPay"]} />}</PayrollReportShell>;
}

function GrandBankSummaryPage() {
  return <PayrollReportShell title="Grand Bank Summary" endpoint="grand-bank-summary" allowExcel exportRows={(r) => r.banks || []}>{(report, filters) => <div className="arrear-report-print-area"><ReportLetterhead title="Grand Bank Summary" filterSummary={`${filters.month}/${filters.year}`} /><table className="print-report-table"><thead><tr><th>Bank Name</th><th>Total Employees</th><th>Total Amount</th></tr></thead><tbody>{(report.banks || []).map((b) => <tr key={b.bankName}><td>{b.bankName}</td><td>{b.employeeCount}</td><td className="amount-cell">{formatCurrency(b.totalAmount)}</td></tr>)}<tr className="report-total-row"><td colSpan="2">Grand Total</td><td className="amount-cell">{formatCurrency(report.grandTotal)}</td></tr></tbody></table></div>}</PayrollReportShell>;
}

function FlatPayrollTable({ title, rows, filters, total, columns }) {
  return <div className="arrear-report-print-area"><ReportLetterhead title={title} filterSummary={`${filters.month}/${filters.year}`} /><table className="print-report-table"><thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.employeeCode}>{columns.map((c) => <td key={c} className={String(c).toLowerCase().includes("pay") || c === "netPay" || c === "grossPay" || c === "totalDeductions" ? "amount-cell" : ""}>{typeof row[c] === "number" || ["grossPay", "totalDeductions", "netPay"].includes(c) ? formatCurrency(row[c]) : row[c]}</td>)}</tr>)}<tr className="report-total-row"><td colSpan={Math.max(columns.length - 1, 1)}>Grand Total</td><td className="amount-cell">{formatCurrency(total)}</td></tr></tbody></table></div>;
}

function PaymentListPage() {
  return <PayrollReportShell title="Payment List" endpoint="payment-list">{(report, filters) => <FlatPayrollTable title="Payment List" rows={(report.rows || []).map((r) => ({ ...r, paymentMethod: r.isBankSalary ? "Bank" : "Cash" }))} filters={filters} total={report.totals?.netPay} columns={["employeeCode", "name", "department", "designation", "grossPay", "totalDeductions", "netPay", "paymentMethod"]} />}</PayrollReportShell>;
}

function ListOfPaymentPage() {
  return <PayrollReportShell title="List Of Payment" endpoint="list-of-payment">{(report, filters) => <div className="arrear-report-print-area"><ReportLetterhead title="List Of Payment" filterSummary={`${filters.month}/${filters.year}`} />{(report.departments || []).map((dept) => <section className="print-employee-section" key={dept.department}><div className="print-employee-head"><strong>{dept.department}</strong></div><table className="print-report-table"><thead><tr><th>Employee</th><th>Name</th><th>Net Pay</th></tr></thead><tbody>{dept.rows.map((row) => <tr key={row.employeeCode}><td>{row.employeeCode}</td><td>{row.name}</td><td className="amount-cell">{formatCurrency(row.netPay)}</td></tr>)}</tbody></table><div className="print-subtotal-row"><span>Department Subtotal</span><strong>PKR {formatCurrency(dept.subtotal)}</strong></div></section>)}<div className="print-grand-total-row"><span>Grand Total</span><strong>PKR {formatCurrency(report.totals?.netPay)}</strong></div></div>}</PayrollReportShell>;
}

function PayrollScaleAuditRegisterPage() {
  return <PayrollReportShell title="Scale Audit Register" endpoint="scale-audit-register" simple>{(report, filters) => <div className="arrear-report-print-area"><ReportLetterhead title="Scale Audit Register" filterSummary={`${filters.month}/${filters.year}`} /><table className="print-report-table"><thead><tr><th>Employee</th><th>Name</th><th>Dept</th><th>Designation</th><th>Old BPS</th><th>New BPS</th><th>Effective Date</th></tr></thead><tbody>{(report.rows || []).map((row, index) => <tr key={index}><td>{row.employeeCode}</td><td>{row.name}</td><td>{row.department}</td><td>{row.designation}</td><td>{row.oldBps || "-"}</td><td>{row.newBps}</td><td>{row.effectiveDate}</td></tr>)}</tbody></table></div>}</PayrollReportShell>;
}

function BudgetRequirementPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [endingDate, setEndingDate] = useState(today);
  const [outputSelection, setOutputSelection] = useState("screen");
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });

  const run = async () => {
    try {
      const result = await getPayrollBudgetRequirement(endingDate);
      setReport(result.data);
      if (outputSelection === "printer") window.setTimeout(() => printCurrentDocumentAsExcel("budget-requirement"), 150);
      if (outputSelection === "excel") exportRowsToExcel(result.data.rows || [], `budget-requirement-${endingDate}.xlsx`);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return <section className="employee-entry-panel arrear-report-panel"><div className="form-title-row"><div><p>Payroll</p><h2>Budget Requirement</h2></div></div><div className="report-filter-panel no-print"><label><span>Ending Date</span><input type="date" value={endingDate} onChange={(e) => setEndingDate(e.target.value)} /></label><fieldset><legend>Output Selection</legend><label><input type="radio" value="screen" checked={outputSelection === "screen"} onChange={(e) => setOutputSelection(e.target.value)} /> View</label><label><input type="radio" value="printer" checked={outputSelection === "printer"} onChange={(e) => setOutputSelection(e.target.value)} /> Print</label><label><input type="radio" value="excel" checked={outputSelection === "excel"} onChange={(e) => setOutputSelection(e.target.value)} /> Save as Excel</label></fieldset><div className="report-filter-actions"><button type="button" onClick={run}>OK</button><button type="button" onClick={() => { setReport(null); setEndingDate(today); }}>Cancel</button></div></div>{status.message ? <p className={`form-status ${status.type}`}>{status.message}</p> : null}{report ? <div className="arrear-report-print-area"><ReportLetterhead title="Budget Requirement" filterSummary={`Ending Date: ${endingDate}`} /><table className="print-report-table"><thead><tr><th>Wage Code</th><th>Description</th><th>Projected Total</th></tr></thead><tbody>{(report.rows || []).map((row) => <tr key={row.wageCode}><td>{row.wageCode}</td><td>{row.description}</td><td className="amount-cell">{formatCurrency(row.totalAmount)}</td></tr>)}<tr className="report-total-row"><td colSpan="2">Grand Total</td><td className="amount-cell">{formatCurrency(report.grandTotal)}</td></tr></tbody></table></div> : null}</section>;
}

function PaySlipsPage() {
  return <PayrollReportShell title="Pay Slips" endpoint="payslips">{(report, filters) => <PayslipView slips={report.slips || []} filters={filters} />}</PayrollReportShell>;
}

function formatSlipPeriodLabel(slip, filters = {}) {
  if (slip?.periodLabel) {
    return slip.periodLabel;
  }

  if (slip?.paymentMonth && slip?.paymentYear) {
    const monthIndex = Number(slip.paymentMonth) - 1;
    const monthName = payrollMonthOptions[monthIndex] || slip.paymentMonth;
    return `${monthName} ${slip.paymentYear}`;
  }

  if (filters.month && filters.year) {
    const monthIndex = Number(filters.month) - 1;
    const monthName = payrollMonthOptions[monthIndex] || filters.month;
    return `${monthName} ${filters.year}`;
  }

  return "Payroll Period";
}

function PayslipView({ slips, filters }) {
  return (
    <div className="arrear-report-print-area payslip-report-area">
      {slips.map((slip, index) => {
        const periodLabel = formatSlipPeriodLabel(slip, filters);
        const employeeSummary = [slip.employeeCode, slip.name].filter(Boolean).join(" - ");
        const summaryCards = [
          { label: "Gross Pay", value: slip.grossPay },
          { label: "Total Deductions", value: slip.totalDeductions },
          { label: "Net Pay", value: slip.netPay }
        ];

        return (
          <section className="print-bill-section payslip-section" key={`${slip.employeeCode || "employee"}-${slip.period || periodLabel}-${index}`}>
            <ReportLetterhead title="Salary Slip" filterSummary={`${periodLabel}${employeeSummary ? ` | ${employeeSummary}` : ""}`} />
            <div className="payslip-topline">
              <div>
                <span>Employee No.</span>
                <strong>{slip.employeeCode || "-"}</strong>
              </div>
              <div>
                <span>Name</span>
                <strong>{slip.name || "-"}</strong>
              </div>
              <div>
                <span>Department</span>
                <strong>{slip.department || "-"}</strong>
              </div>
              <div>
                <span>Designation</span>
                <strong>{slip.designation || "-"}</strong>
              </div>
              <div>
                <span>BPS</span>
                <strong>{slip.bps || "-"}</strong>
              </div>
              <div>
                <span>Period</span>
                <strong>{periodLabel}</strong>
              </div>
            </div>

            <div className="payslip-summary-grid">
              {summaryCards.map((card) => (
                <article className="payslip-summary-card" key={card.label}>
                  <span>{card.label}</span>
                  <strong>{formatCurrency(card.value)}</strong>
                </article>
              ))}
            </div>

            <table className="print-report-table payslip-details-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(slip.details || []).map((detail, detailIndex) => (
                  <tr key={`${slip.employeeCode || "slip"}-${detail.wageCode || detailIndex}-${detailIndex}`}>
                    <td>{detail.wageCode}</td>
                    <td>{detail.description}</td>
                    <td className="amount-cell">{formatCurrency(detail.amount)}</td>
                  </tr>
                ))}
                {!slip.details?.length ? (
                  <tr>
                    <td colSpan="3">No payroll line items found for this slip.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>

            <div className="payslip-footer-row">
              <span>Gross {formatCurrency(slip.grossPay)}</span>
              <span>Deductions {formatCurrency(slip.totalDeductions)}</span>
              <strong>Net {formatCurrency(slip.netPay)}</strong>
            </div>
          </section>
        );
      })}
      {!slips.length ? <p className="empty-report-note">No pay slips found.</p> : null}
    </div>
  );
}

function SinglePaySlipPage() {
  const [employeeCode, setEmployeeCode] = useState("");
  const [filters, setFilters] = useState(payrollDefaultFilters());
  const [slip, setSlip] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!employeeCode) { setStatus({ type: "error", message: "Employee No is required." }); return; }
    setLoading(true);
    try {
      const result = await getSinglePayrollPayslip(employeeCode, filters);
      setSlip(result.data);
      if (filters.outputSelection === "printer") window.setTimeout(() => printCurrentDocumentAsExcel("single-pay-slip"), 150);
      if (filters.outputSelection === "excel") exportCurrentDocumentAfterRender("single-pay-slip");
    } catch (error) {
      setSlip(null);
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return <section className="employee-entry-panel arrear-report-panel"><div className="form-title-row"><div><p>Payroll</p><h2>Single Pay Slips</h2></div></div><div className="report-filter-panel no-print"><label><span>Employee No</span><input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} /></label><label><span>Month Of Payment</span><input type="number" value={filters.month} onChange={(e) => setFilters((c) => ({ ...c, month: e.target.value }))} /></label><label><span>Payment Year</span><input type="number" value={filters.year} onChange={(e) => setFilters((c) => ({ ...c, year: e.target.value }))} /></label><fieldset><legend>Output Selection</legend><label><input type="radio" value="screen" checked={filters.outputSelection === "screen"} onChange={(e) => setFilters((c) => ({ ...c, outputSelection: e.target.value }))} /> View</label><label><input type="radio" value="printer" checked={filters.outputSelection === "printer"} onChange={(e) => setFilters((c) => ({ ...c, outputSelection: e.target.value }))} /> Print</label><label><input type="radio" value="excel" checked={filters.outputSelection === "excel"} onChange={(e) => setFilters((c) => ({ ...c, outputSelection: e.target.value }))} /> Save as Excel</label></fieldset><div className="report-filter-actions"><button type="button" onClick={run} disabled={loading}>{loading ? "Loading..." : "OK"}</button><button type="button" onClick={() => { setEmployeeCode(""); setSlip(null); }}>Cancel</button></div></div>{status.message ? <p className={`form-status ${status.type}`}>{status.message}</p> : null}{slip ? <PayslipView slips={[slip]} filters={filters} /> : null}</section>;
}

function SlipReprintHistoryPage() {
  const fiscalYearRange = getActiveFiscalYearRange();
  const defaultYear = fiscalYearRange?.endYear || String(new Date().getFullYear());
  const defaultRange = fiscalYearRange ? {
    fromMonth: fiscalYearRange.startMonth,
    toMonth: fiscalYearRange.endMonth,
    fromYear: fiscalYearRange.startYear,
    toYear: fiscalYearRange.endYear
  } : {
    fromMonth: "1",
    toMonth: String(new Date().getMonth() + 1),
    fromYear: defaultYear,
    toYear: defaultYear
  };
  const [filters, setFilters] = useState({
    employeeCode: "",
    ...defaultRange
  });
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState("custom");
  const [report, setReport] = useState(null);
  const [selectedSlipId, setSelectedSlipId] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const slips = report?.slips || [];
  const selectedSlip = slips.find((slip) => String(slip.id) === String(selectedSlipId)) || slips[0] || null;

  useEffect(() => {
    if (!selectedSlip && selectedSlipId) {
      setSelectedSlipId("");
    }
  }, [selectedSlip, selectedSlipId]);

  useEffect(() => {
    let cancelled = false;

    async function loadFiscalYears() {
      try {
        const records = await getFiscalYears();

        if (cancelled) {
          return;
        }

        setFiscalYears(records || []);

        const activeYear = records.find((record) => Number(record.isActive) === 1) || records[0] || null;
        if (activeYear) {
          const nextRange = getFiscalYearRangeFields(activeYear);
          if (nextRange) {
            setSelectedFiscalYearId(String(activeYear.id));
            setFilters((current) => ({
              ...current,
              ...nextRange
            }));
          }
        }
      } catch (error) {
        if (!cancelled) {
          setStatus((current) => current.message ? current : { type: "neutral", message: "Fiscal year list could not be loaded. You can still set the range manually." });
        }
      }
    }

    loadFiscalYears();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFiscalYearChange = (event) => {
    const value = event.target.value;
    setSelectedFiscalYearId(value);

    if (value === "custom") {
      return;
    }

    const selectedYear = fiscalYears.find((record) => String(record.id) === value);
    const nextRange = getFiscalYearRangeFields(selectedYear);
    if (nextRange) {
      setFilters((current) => ({
        ...current,
        ...nextRange
      }));
    }
  };

  const run = async () => {
    if (!filters.employeeCode.trim()) {
      setStatus({ type: "error", message: "Employee No is required." });
      return;
    }

    const startSerial = (Number(filters.fromYear) || 0) * 12 + (Number(filters.fromMonth) || 0);
    const endSerial = (Number(filters.toYear) || 0) * 12 + (Number(filters.toMonth) || 0);

    if (!startSerial || !endSerial || startSerial > endSerial) {
      setStatus({ type: "error", message: "Select a valid month and year range." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await getReportModule("payslips-for-months", filters);
      setReport(result.data);
      const nextSelectedSlip = result.data?.slips?.[0] || null;
      setSelectedSlipId(nextSelectedSlip ? String(nextSelectedSlip.id) : "");

      if (!result.data?.slips?.length) {
        setStatus({ type: "neutral", message: "No payslips found for the selected employee and months." });
      }
    } catch (error) {
      setReport(null);
      setSelectedSlipId("");
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const exportHistory = () => {
    if (!slips.length) {
      setStatus({ type: "error", message: "Load history before exporting." });
      return;
    }

    exportRowsToExcel(
      slips.map((slip) => ({
        Period: formatSlipPeriodLabel(slip, filters),
        "Employee No.": slip.employeeCode || "",
        Name: slip.name || "",
        Department: slip.department || "",
        Designation: slip.designation || "",
        BPS: slip.bps || "",
        Gross: Number(slip.grossPay || 0),
        Deductions: Number(slip.totalDeductions || 0),
        Net: Number(slip.netPay || 0)
      })),
      `salary-slip-history-${filters.employeeCode}-${filters.fromMonth}-${filters.fromYear}-to-${filters.toMonth}-${filters.toYear}.xlsx`
    );
    setStatus({ type: "success", message: "Slip history exported." });
  };

  const handlePrintSelectedSlip = () => {
    if (!selectedSlip) {
      setStatus({ type: "error", message: "Select a slip to print." });
      return;
    }

    window.setTimeout(() => printCurrentDocumentAsExcel("salary-slip-history"), 150);
  };

  return (
    <section className="employee-entry-panel arrear-report-panel">
      <div className="form-title-row">
        <div>
          <p>Reports</p>
          <h2>Slip Reprint History</h2>
        </div>
        <span>{fiscalYearRange ? fiscalYearRange.name : getActiveFiscalYearLabel()}</span>
      </div>

      <div className="report-filter-panel no-print">
        <label>
          <span>Fiscal Year</span>
          <select value={selectedFiscalYearId} onChange={handleFiscalYearChange}>
            <option value="custom">Custom Range</option>
            {fiscalYears.map((fiscalYear) => (
              <option value={String(fiscalYear.id)} key={fiscalYear.id}>
                {fiscalYear.name}
                {Number(fiscalYear.isActive) === 1 ? " (Active)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Employee No</span>
          <input
            value={filters.employeeCode}
            onChange={(event) => setFilters((current) => ({ ...current, employeeCode: event.target.value }))}
            placeholder="Employee code"
          />
        </label>
        <label>
          <span>From Month</span>
          <select value={filters.fromMonth} onChange={(event) => { setSelectedFiscalYearId("custom"); setFilters((current) => ({ ...current, fromMonth: event.target.value })); }}>
            {payrollMonthOptions.map((monthName, index) => (
              <option value={String(index + 1)} key={`from-${monthName}`}>{String(index + 1).padStart(2, "0")} - {monthName}</option>
            ))}
          </select>
        </label>
        <label>
          <span>To Month</span>
          <select value={filters.toMonth} onChange={(event) => { setSelectedFiscalYearId("custom"); setFilters((current) => ({ ...current, toMonth: event.target.value })); }}>
            {payrollMonthOptions.map((monthName, index) => (
              <option value={String(index + 1)} key={`to-${monthName}`}>{String(index + 1).padStart(2, "0")} - {monthName}</option>
            ))}
          </select>
        </label>
        <label>
          <span>From Year</span>
          <input
            type="number"
            value={filters.fromYear}
            onChange={(event) => { setSelectedFiscalYearId("custom"); setFilters((current) => ({ ...current, fromYear: event.target.value })); }}
          />
        </label>
        <label>
          <span>To Year</span>
          <input
            type="number"
            value={filters.toYear}
            onChange={(event) => { setSelectedFiscalYearId("custom"); setFilters((current) => ({ ...current, toYear: event.target.value })); }}
          />
        </label>
        <div className="report-filter-actions">
          <button type="button" onClick={run} disabled={loading}>{loading ? "Loading..." : "Load History"}</button>
          <button type="button" onClick={() => { setReport(null); setSelectedSlipId(""); setStatus({ type: "", message: "" }); }}>Clear</button>
        </div>
      </div>

      {status.message ? (
        <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p>
      ) : null}

      {report ? (
        <div className="slip-history-layout">
          <div className="slip-history-table-card no-print">
            <div className="slip-history-head">
              <strong>Reprint History</strong>
              <span>{slips.length} slip(s)</span>
            </div>
            <div className="table-wrap">
              <table className="employee-table slip-history-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Employee No.</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Gross</th>
                    <th>Deductions</th>
                    <th>Net</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slips.map((slip) => {
                    const isSelected = String(selectedSlipId || selectedSlip?.id || "") === String(slip.id);

                    return (
                      <tr key={slip.id} className={isSelected ? "selected-row" : ""}>
                        <td>{formatSlipPeriodLabel(slip, filters)}</td>
                        <td>{slip.employeeCode}</td>
                        <td>{slip.name}</td>
                        <td>{slip.department}</td>
                        <td>{slip.designation}</td>
                        <td className="amount-cell">{formatCurrency(slip.grossPay)}</td>
                        <td className="amount-cell">{formatCurrency(slip.totalDeductions)}</td>
                        <td className="amount-cell">{formatCurrency(slip.netPay)}</td>
                        <td>
                          <div className="row-action-group">
                            <button type="button" onClick={() => setSelectedSlipId(String(slip.id))}>View</button>
                            <button type="button" onClick={() => { setSelectedSlipId(String(slip.id)); window.setTimeout(() => printCurrentDocumentAsExcel("salary-slip-history"), 150); }}>
                              Reprint
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!slips.length ? (
                    <tr>
                      <td colSpan="9">No slip history found for the selected filters.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="report-filter-actions no-print history-action-row">
              <button type="button" onClick={handlePrintSelectedSlip} disabled={!selectedSlip}>Print Selected Slip</button>
              <button type="button" onClick={exportHistory} disabled={!slips.length}>Export History</button>
            </div>
          </div>

          {selectedSlip ? (
            <div className="slip-history-preview">
              <PayslipView slips={[selectedSlip]} filters={{ ...filters, month: selectedSlip.paymentMonth, year: selectedSlip.paymentYear }} />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function PayDedSchedulePage({ title, defaultCode = "", defaultCodeKey = "", allowExcel = false }) {
  const [filters, setFilters] = useState(payrollDefaultFilters({ code: defaultCode }));
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [resolvedDefaultCode, setResolvedDefaultCode] = useState(defaultCode);

  useEffect(() => {
    let mounted = true;
    if (!defaultCodeKey) return undefined;

    getReportScheduleDefaults()
      .then((result) => {
        if (!mounted) return;
        const nextCode = result.data?.[defaultCodeKey] || defaultCode;
        setResolvedDefaultCode(nextCode);
        setFilters((current) => ({ ...current, code: current.code || nextCode }));
      })
      .catch(() => {
        if (!mounted) return;
        setFilters((current) => ({ ...current, code: current.code || defaultCode }));
      });

    return () => {
      mounted = false;
    };
  }, [defaultCode, defaultCodeKey]);

  const run = async () => {
    if (!filters.code) {
      setStatus({ type: "error", message: "Code is required." });
      return;
    }
    setLoading(true);
    try {
      const result = await getReportModule("income-tax-schedule", filters);
      setReport(result.data);
      if (filters.outputSelection === "printer") window.setTimeout(() => printCurrentDocumentAsExcel(title), 150);
      if (filters.outputSelection === "excel") exportRowsToExcel(result.data.rows || [], `${title}-${filters.month}-${filters.year}.xlsx`);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return <section className="employee-entry-panel arrear-report-panel"><PayrollFilter title={title} filters={filters} setFilters={setFilters} onRun={run} onCancel={() => { setReport(null); setFilters(payrollDefaultFilters({ code: resolvedDefaultCode })); }} loading={loading} allowExcel={allowExcel} /><div className="report-filter-panel no-print"><label><span>Code</span><input value={filters.code || ""} onChange={(e) => setFilters((c) => ({ ...c, code: e.target.value }))} placeholder="Wage code" /></label></div>{status.message ? <p className={`form-status ${status.type}`}>{status.message}</p> : null}{report ? <div className="arrear-report-print-area"><ReportLetterhead title={title} filterSummary={`${filters.month}/${filters.year} | Code ${filters.code}`} /><table className="print-report-table"><thead><tr><th>Employee Code</th><th>Name</th><th>Dept</th><th>Designation</th><th>Amount</th></tr></thead><tbody>{(report.rows || []).map((row) => <tr key={row.employee_code}><td>{row.employee_code}</td><td>{row.name}</td><td>{row.department}</td><td>{row.designation}</td><td className="amount-cell">{formatCurrency(row.tax_amount)}</td></tr>)}<tr className="report-total-row"><td colSpan="4">Grand Total</td><td className="amount-cell">{formatCurrency(report.grandTotal)}</td></tr></tbody></table></div> : null}</section>;
}

function SinglePaySlipsForMonthsPage() {
  return <SlipReprintHistoryPage />;
}

function DesignationWiseListPage() {
  const [filters, setFilters] = useState(payrollDefaultFilters({ designationCode: "999" }));
  const [report, setReport] = useState(null);
  const run = async () => {
    const result = await getReportModule("designation-wise-list", filters);
    setReport(result.data);
    if (filters.outputSelection === "printer") window.setTimeout(() => printCurrentDocumentAsExcel("designation-wise-list"), 150);
    if (filters.outputSelection === "excel") exportCurrentDocumentAfterRender("designation-wise-list");
  };
  return <section className="employee-entry-panel arrear-report-panel"><PayrollFilter title="Designation Wise List" filters={filters} setFilters={setFilters} onRun={run} onCancel={() => setReport(null)} loading={false} simple /><div className="report-filter-panel no-print"><label><span>Designation Code</span><input value={filters.designationCode} onChange={(e) => setFilters((c) => ({ ...c, designationCode: e.target.value }))} /></label></div>{report ? <div className="arrear-report-print-area"><ReportLetterhead title="Designation Wise List" filterSummary={`${filters.month}/${filters.year}`} />{(report.designations || []).map((g) => <section className="print-employee-section" key={g.designation}><div className="print-employee-head"><strong>{g.designation}</strong></div><table className="print-report-table"><thead><tr><th>Code</th><th>Name</th><th>Dept</th><th>Net Pay</th></tr></thead><tbody>{g.rows.map((r) => <tr key={r.employeeCode}><td>{r.employeeCode}</td><td>{r.name}</td><td>{r.department}</td><td className="amount-cell">{formatCurrency(r.netPay)}</td></tr>)}</tbody></table><div className="print-subtotal-row"><span>Subtotal</span><strong>PKR {formatCurrency(g.subtotal)}</strong></div></section>)}<div className="print-grand-total-row"><span>Grand Total</span><strong>PKR {formatCurrency(report.grandTotal)}</strong></div></div> : null}</section>;
}

function AnnualIncomeTaxSchedulePage() {
  const fiscalYearRange = getActiveFiscalYearRange();
  const year = fiscalYearRange?.endYear || String(new Date().getFullYear());
  const [filters, setFilters] = useState({
    reportFor: "All",
    fromMonth: fiscalYearRange?.startMonth || "1",
    fromYear: fiscalYearRange?.startYear || year,
    toMonth: fiscalYearRange?.endMonth || "12",
    toYear: fiscalYearRange?.endYear || year,
    code: "6002",
    outputSelection: "screen"
  });
  const [report, setReport] = useState(null);
  const run = async () => {
    const result = await getReportModule("annual-income-tax-schedule", filters);
    setReport(result.data);
    if (filters.outputSelection === "printer") window.setTimeout(() => printCurrentDocumentAsExcel("annual-income-tax-schedule"), 150);
    if (filters.outputSelection === "excel") exportCurrentDocumentAfterRender("annual-income-tax-schedule");
  };
  return <section className="employee-entry-panel arrear-report-panel"><div className="form-title-row"><div><p>Reports</p><h2>Annual Income Tax Schedule</h2></div><span>{fiscalYearRange ? fiscalYearRange.name : getActiveFiscalYearLabel()}</span></div><div className="report-filter-panel no-print"><label><span>Report For</span><select value={filters.reportFor} onChange={(e) => setFilters((c) => ({ ...c, reportFor: e.target.value }))}><option>All</option><option>Regular</option><option>Contract</option></select></label><label><span>From Month</span><input type="number" value={filters.fromMonth} onChange={(e) => setFilters((c) => ({ ...c, fromMonth: e.target.value }))} /></label><label><span>From Year</span><input type="number" value={filters.fromYear} onChange={(e) => setFilters((c) => ({ ...c, fromYear: e.target.value }))} /></label><label><span>To Month</span><input type="number" value={filters.toMonth} onChange={(e) => setFilters((c) => ({ ...c, toMonth: e.target.value }))} /></label><label><span>To Year</span><input type="number" value={filters.toYear} onChange={(e) => setFilters((c) => ({ ...c, toYear: e.target.value }))} /></label><label><span>Code</span><input value={filters.code} onChange={(e) => setFilters((c) => ({ ...c, code: e.target.value }))} /></label><div className="report-filter-actions"><button type="button" onClick={run}>OK</button><button type="button" onClick={() => setReport(null)}>Cancel</button></div></div>{report ? <div className="arrear-report-print-area"><ReportLetterhead title="Annual Income Tax Schedule" filterSummary={`${filters.fromMonth}/${filters.fromYear} to ${filters.toMonth}/${filters.toYear}${fiscalYearRange ? ` | ${fiscalYearRange.name}` : ""}`} /><table className="print-report-table"><thead><tr><th>Code</th><th>Name</th>{(report.months || []).map((m) => <th key={m}>{m}</th>)}<th>Annual Total</th></tr></thead><tbody>{(report.rows || []).map((r) => <tr key={r.employee_code}><td>{r.employee_code}</td><td>{r.name}</td>{report.months.map((m) => <td className="amount-cell" key={m}>{formatCurrency(r.months[m])}</td>)}<td className="amount-cell">{formatCurrency(r.annualTotal)}</td></tr>)}<tr className="report-total-row"><td colSpan="2">Grand Total</td>{report.months.map((m) => <td className="amount-cell" key={m}>{formatCurrency(report.totals[m])}</td>)}<td className="amount-cell">{formatCurrency(report.grandTotal)}</td></tr></tbody></table></div> : null}</section>;
}

function PostAuditPage() {
  const year = String(new Date().getFullYear());
  const [filters, setFilters] = useState({ employeeCode: "", fromMonth: "1", fromYear: year, outputSelection: "screen" });
  const [report, setReport] = useState(null);
  const run = async () => {
    const result = await getReportModule("post-audit", filters);
    setReport(result.data);
    if (filters.outputSelection === "printer") window.setTimeout(() => printCurrentDocumentAsExcel("post-audit"), 150);
    if (filters.outputSelection === "excel") exportCurrentDocumentAfterRender("post-audit");
  };
  return <section className="employee-entry-panel arrear-report-panel"><div className="form-title-row"><div><p>Reports</p><h2>Post Audit</h2></div></div><div className="report-filter-panel no-print"><label><span>Employee No</span><input value={filters.employeeCode} onChange={(e) => setFilters((c) => ({ ...c, employeeCode: e.target.value }))} /></label><label><span>From Month</span><input type="number" value={filters.fromMonth} onChange={(e) => setFilters((c) => ({ ...c, fromMonth: e.target.value }))} /></label><label><span>Payment Year</span><input type="number" value={filters.fromYear} onChange={(e) => setFilters((c) => ({ ...c, fromYear: e.target.value }))} /></label><div className="report-filter-actions"><button type="button" onClick={run}>OK</button><button type="button" onClick={() => setReport(null)}>Cancel</button></div></div>{report ? <div className="arrear-report-print-area"><ReportLetterhead title="Post Audit" filterSummary={report.employee ? `${report.employee.employeeCode} - ${report.employee.name}` : filters.employeeCode} /><table className="print-report-table"><thead><tr><th>Code</th><th>Description</th>{(report.months || []).map((m) => <th key={m}>{m}</th>)}<th>Total</th></tr></thead><tbody>{(report.rows || []).map((r) => <tr key={r.wageCode}><td>{r.wageCode}</td><td>{r.description}</td>{report.months.map((m) => <td className="amount-cell" key={m}>{formatCurrency(r.months[m])}</td>)}<td className="amount-cell">{formatCurrency(r.total)}</td></tr>)}</tbody></table></div> : null}</section>;
}

function ActiveInactiveReportPage({ monthwise = false }) {
  const title = monthwise ? "Active Inactive For The Month" : "Active Inactive Complete";
  const endpoint = monthwise ? "active-inactive-monthwise" : "active-inactive-complete";
  const [filters, setFilters] = useState(payrollDefaultFilters());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    try {
      const result = await getReportModule(endpoint, filters);
      setReport(result.data);
      if (filters.outputSelection === "printer") window.setTimeout(() => printCurrentDocumentAsExcel(title), 150);
      if (filters.outputSelection === "excel") exportCurrentDocumentAfterRender(title);
    } catch (error) {
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="module-card report-page">
      <ReportToolbar title={title} onPrint={() => printCurrentDocumentAsExcel(title)} />
      <PayrollFilter filters={filters} setFilters={setFilters} onRun={run} loading={loading} simple={false} />
      {report ? (
        <div className="arrear-report-print-area">
          <ReportLetterhead title={title} filterSummary={`${filters.month}/${filters.year}`} />
          <div className="budget-summary-grid report-summary-grid">
            <article><span>Active</span><strong>{report.summary?.active || 0}</strong></article>
            <article><span>Inactive</span><strong>{report.summary?.inactive || 0}</strong></article>
          </div>
          <table className="print-report-table">
            <thead><tr><th>Code</th><th>Name</th><th>Dept</th><th>Designation</th><th>Status</th></tr></thead>
            <tbody>{(report.rows || []).map((r) => <tr key={r.employee_code}><td>{r.employee_code}</td><td>{r.name}</td><td>{r.department}</td><td>{r.designation}</td><td>{r.status}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <div className="empty-report">Run the report to view records.</div>}
    </section>
  );
}

function ToExcelPage() {
  const [filters, setFilters] = useState(payrollDefaultFilters({ outputSelection: "excel" }));
  const [status, setStatus] = useState({ type: "", message: "" });
  const run = async () => {
    try {
      const result = await getReportModule("export-to-excel", filters);
      exportRowsToExcel((result.data.rows || []).map((r) => ({ "Employee Code": r.employee_code, Name: r.name, Dept: r.department, Designation: r.designation, "Wage Code": r.wage_code, Description: r.description, Amount: r.amount })), `payroll-export-${filters.month}-${filters.year}.xlsx`);
      setStatus({ type: "success", message: "Excel exported." });
    } catch (error) { setStatus({ type: "error", message: error.message }); }
  };
  return <section className="employee-entry-panel arrear-report-panel"><PayrollFilter title="To Excel" filters={filters} setFilters={setFilters} onRun={run} onCancel={() => setStatus({ type: "", message: "" })} loading={false} allowExcel />{status.message ? <p className={`form-status ${status.type}`}>{status.message}</p> : null}</section>;
}

function EmployeePayAllowanceInquiry() {
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [allowances, setAllowances] = useState([]);
  const [activeAllowanceTotal, setActiveAllowanceTotal] = useState(0);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const cleanSearch = employeeSearch.trim();
  const exactCodeMatch = employeeOptions.find(
    (option) => String(option.employeeNo || "").trim().toLowerCase() === cleanSearch.toLowerCase()
  );
  const matchedEmployees = cleanSearch
    ? employeeOptions
        .filter((option) => {
          const query = cleanSearch.toLowerCase();

          return (
            String(option.employeeNo || "").toLowerCase().includes(query) ||
            String(option.name || "").toLowerCase().includes(query) ||
            String(option.fatherName || "").toLowerCase().includes(query) ||
            String(option.designation || "").toLowerCase().includes(query) ||
            String(option.department || "").toLowerCase().includes(query)
          );
        })
        .slice(0, 8)
    : [];
  const showEmployeeMatches = cleanSearch && !exactCodeMatch && matchedEmployees.length;

  const loadInquiry = async (code = cleanSearch) => {
    const lookupCode = String(code || "").trim();

    if (!lookupCode) {
      setStatus({ type: "error", message: "Please enter employee code or name." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const foundEmployee = await getEmployeeByCode(lookupCode);
      const allowanceData = await getEmployeeAllowances(foundEmployee.id);
      setEmployee(foundEmployee);
      setAllowances(allowanceData.allowances);
      setActiveAllowanceTotal(Number(allowanceData.activeAllowanceTotal || 0));
      setEmployeeSearch(foundEmployee.employeeNo || lookupCode);
      setStatus({ type: "success", message: "Employee allowance details loaded." });
    } catch (error) {
      setEmployee(null);
      setAllowances([]);
      setActiveAllowanceTotal(0);
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const viewEmployee = (selectedEmployee) => {
    setEmployeeSearch(selectedEmployee.employeeNo || "");
    loadInquiry(selectedEmployee.employeeNo);
  };

  const closeInquiry = () => {
    setEmployee(null);
    setAllowances([]);
    setActiveAllowanceTotal(0);
    setEmployeeSearch("");
    setStatus({ type: "", message: "" });
  };

  const runSearch = () => {
    if (exactCodeMatch) {
      loadInquiry(exactCodeMatch.employeeNo);
      return;
    }

    if (matchedEmployees.length === 1) {
      viewEmployee(matchedEmployees[0]);
      return;
    }

    if (matchedEmployees.length > 1) {
      setStatus({ type: "neutral", message: "Select an employee from the list below." });
      return;
    }

    loadInquiry();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadEmployeeOptions() {
      setLoadingOptions(true);

      try {
        const records = await getEmployees();

        if (!cancelled) {
          setEmployeeOptions(records);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus({ type: "error", message: error.message });
        }
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    }

    loadEmployeeOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!exactCodeMatch) {
      return undefined;
    }

    if (employee?.employeeNo === exactCodeMatch.employeeNo) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      loadInquiry(exactCodeMatch.employeeNo);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [exactCodeMatch?.employeeNo, employee?.employeeNo]);

  return (
    <section className="employee-entry-panel" aria-label="Employee pay allowance inquiry">
      <div className="form-title-row">
        <div>
          <p>Transactions</p>
          <h2>Employee Pay Allowance Inquiry</h2>
        </div>
      </div>

      <div className="allowance-inquiry-search">
        <label>
          <span>Employee Code / Name</span>
          <input
            type="text"
            value={employeeSearch}
            onChange={(event) => setEmployeeSearch(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type employee code or name"
          />
        </label>
        <button type="button" onClick={runSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {loadingOptions ? (
        <p className="form-status neutral">Loading employee list...</p>
      ) : null}

      {showEmployeeMatches ? (
        <div className="employee-search-results" aria-label="Matching employees">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {matchedEmployees.map((matchedEmployee) => (
                <tr key={matchedEmployee.id}>
                  <td>{matchedEmployee.employeeNo}</td>
                  <td>{matchedEmployee.name}</td>
                  <td>{matchedEmployee.designation || "-"}</td>
                  <td>{matchedEmployee.department || "-"}</td>
                  <td>
                    <button type="button" onClick={() => viewEmployee(matchedEmployee)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {status.message ? (
        <p className={`form-status ${status.type || "neutral"}`}>{status.message}</p>
      ) : null}

      {employee ? (
        <>
          <div className="inquiry-result-actions">
            <button type="button" onClick={closeInquiry}>
              Close
            </button>
          </div>

          <div className="inquiry-summary-grid">
            <article>
              <span>Employee</span>
              <strong>{employee.name}</strong>
              <p>{employee.employeeNo}</p>
            </article>
            <article>
              <span>Designation</span>
              <strong>{employee.designation || "-"}</strong>
              <p>BPS {employee.bps || "-"}</p>
            </article>
            <article>
              <span>Department</span>
              <strong>{employee.department || "-"}</strong>
              <p>{employee.placeOfPosting || "-"}</p>
            </article>
            <article>
              <span>Active Salary Allowances</span>
              <strong>PKR {activeAllowanceTotal.toLocaleString()}</strong>
              <p>Expired allowances excluded</p>
            </article>
          </div>

          <div className="allowance-table-wrap inquiry-table-wrap">
            <table className="allowance-table">
              <thead>
                <tr>
                  <th>Sr #</th>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Upto</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allowances.map((row, index) => {
                  const isActive = !row.upto || row.upto >= new Date().toISOString().slice(0, 10);

                  return (
                    <tr className={!isActive ? "expired-allowance" : ""} key={row.id || index}>
                      <td>{index + 1}</td>
                      <td>{row.allowanceCode}</td>
                      <td>{row.description || "-"}</td>
                      <td>PKR {Number(row.amount || 0).toLocaleString()}</td>
                      <td>{row.upto || "-"}</td>
                      <td>
                        <span className={isActive ? "allowance-status active" : "allowance-status expired"}>
                          {isActive ? "Active" : "Expired"}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!allowances.length ? (
                  <tr>
                    <td colSpan="6">No allowance records found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}

function buildTopCounts(records, key, fallbackLabel = "Not Set") {
  const counts = records.reduce((result, record) => {
    const label = String(record[key] || "").trim() || fallbackLabel;
    result[label] = (result[label] || 0) + 1;
    return result;
  }, {});

  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((first, second) => second.value - first.value || first.label.localeCompare(second.label))
    .slice(0, 6);
}

function DashboardAnalytics({ summary }) {
  const maxDepartmentCount = Math.max(...summary.departmentBreakdown.map((item) => item.value), 1);
  const maxBpsCount = Math.max(...summary.bpsBreakdown.map((item) => item.value), 1);
  const completionPercent = summary.activeEmployees
    ? Math.round((summary.withBankAccounts / summary.activeEmployees) * 100)
    : 0;

  return (
    <section className="dashboard-analytics" aria-label="Dashboard charts">
      <div className="analytics-title-row">
        <div>
          <p>Payroll Analytics</p>
          <h2>Staff Overview</h2>
        </div>
        <span>{summary.activeEmployees} staff record(s)</span>
      </div>

      <div className="analytics-layout">
        <article className="chart-panel">
          <div className="chart-panel-head">
            <h3>Department Wise Staff</h3>
            <span>Top departments</span>
          </div>
          <div className="bar-chart-list">
            {summary.departmentBreakdown.length ? summary.departmentBreakdown.map((item) => (
              <div className="bar-chart-row" key={item.label}>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="bar-track">
                  <span style={{ width: `${Math.max((item.value / maxDepartmentCount) * 100, 8)}%` }} />
                </div>
              </div>
            )) : (
              <p className="empty-chart-note">No department data available.</p>
            )}
          </div>
        </article>

        <article className="chart-panel">
          <div className="chart-panel-head">
            <h3>BPS Distribution</h3>
            <span>Scale grouping</span>
          </div>
          <div className="mini-column-chart">
            {summary.bpsBreakdown.length ? summary.bpsBreakdown.map((item) => (
              <div className="mini-column" key={item.label}>
                <div>
                  <span style={{ height: `${Math.max((item.value / maxBpsCount) * 100, 10)}%` }} />
                </div>
                <strong>{item.value}</strong>
                <p>{item.label}</p>
              </div>
            )) : (
              <p className="empty-chart-note">No BPS data available.</p>
            )}
          </div>
        </article>

        <article className="chart-panel payroll-health-panel">
          <div className="chart-panel-head">
            <h3>Payroll Readiness</h3>
            <span>Bank details</span>
          </div>
          <div className="donut-wrap">
            <div
              className="donut-chart"
              style={{ background: `conic-gradient(#0b746b ${completionPercent * 3.6}deg, #dbe9e6 0deg)` }}
            >
              <span>{completionPercent}%</span>
            </div>
            <div>
              <strong>{summary.withBankAccounts}</strong>
              <p>staff with bank account numbers</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default function DashboardPage({ user, onLogout, initialPage = "Dashboard", activeFiscalYear = null }) {
  const [openSection, setOpenSection] = useState("Transactions");
  const [activeItem, setActiveItem] = useState(initialPage);
  const [employeeSummary, setEmployeeSummary] = useState({
    activeEmployees: 0,
    departments: 0,
    withBankAccounts: 0,
    departmentBreakdown: [],
    bpsBreakdown: []
  });
  const currentFiscalYear = activeFiscalYear || getActiveFiscalYearRecord();

  const summaryCards = [
    { label: "Active Employees", value: employeeSummary.activeEmployees, icon: Users },
    { label: "Monthly Payroll", value: "PKR 0", icon: Banknote },
    { label: "Departments", value: employeeSummary.departments, icon: Building2 },
    { label: "Pending Proofs", value: "0", icon: ShieldCheck }
  ];

  const selectMainSection = (section) => {
    if (section.items.length) {
      setOpenSection((current) => (current === section.title ? "" : section.title));
      return;
    }

    navigateToPage(section.title);
  };

  const navigateToPage = (page) => {
    setActiveItem(page);

    if (typeof window !== "undefined") {
      const slug = getPageSlug(page);
      const nextPath = slug === "index" ? "/index.html" : `/${slug}.html`;
      window.history.pushState({ page }, "", nextPath);
    }
  };

  useEffect(() => {
    const section = sidebarSections.find((item) => item.items.includes(activeItem));

    if (section) {
      setOpenSection(section.title);
    }
  }, [activeItem]);

  useEffect(() => {
    async function loadDashboardSummary() {
      try {
        const employees = await getEmployees();
        const departments = new Set(
          employees
            .map((employee) => employee.department)
            .filter(Boolean)
            .map((department) => department.trim().toLowerCase())
        );

        setEmployeeSummary({
          activeEmployees: employees.length,
          departments: departments.size,
          withBankAccounts: employees.filter((employee) => String(employee.accountNo || "").trim()).length,
          departmentBreakdown: buildTopCounts(employees, "department"),
          bpsBreakdown: buildTopCounts(employees, "bps", "No BPS")
        });
      } catch {
        setEmployeeSummary({
          activeEmployees: 0,
          departments: 0,
          withBankAccounts: 0,
          departmentBreakdown: [],
          bpsBreakdown: []
        });
      }
    }

    loadDashboardSummary();
  }, [activeItem]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img src="/logo.png" alt="Wazirabad Cardiology Hospital logo" />
          </div>
          <div>
            <p>Hospital Payroll</p>
            <strong>Wazirabad Cardiology Hospital</strong>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Payroll modules">
          {sidebarSections.map((section) => {
            const Icon = section.icon;
            const isOpen = openSection === section.title;
            const isActive = activeItem === section.title;

            return (
              <div className="nav-group" key={section.title}>
                <button
                  className={`nav-main ${isActive ? "active" : ""}`}
                  type="button"
                  onClick={() => selectMainSection(section)}
                >
                  <Icon size={18} />
                  <span>{section.title}</span>
                  {section.items.length ? (
                    <ChevronDown className={isOpen ? "rotate" : ""} size={17} />
                  ) : null}
                </button>

                {section.items.length && isOpen ? (
                  <div className="nav-submenu">
                    {section.items.map((item) => (
                      <button
                        className={activeItem === item ? "active" : ""}
                        key={item}
                        type="button"
                        onClick={() => navigateToPage(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}

          <button className="nav-main logout-nav" type="button" onClick={onLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>

      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <p>Wazirabad Cardiology Hospital</p>
            <h1>{activeItem}</h1>
          </div>
          <div className="user-actions">
            <span>{currentFiscalYear?.name || getActiveFiscalYearLabel()}</span>
            <span>{user?.name || "Hospital Admin"}</span>
            <button type="button" onClick={onLogout}>
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </header>

        {activeItem === "Dashboard" ? (
          <>
            <section className="dashboard-grid" aria-label="Payroll overview">
              {summaryCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article className="metric-card" key={card.label}>
                    <div>
                      <p>{card.label}</p>
                      <strong>{card.value}</strong>
                    </div>
                    <Icon size={26} />
                  </article>
                );
              })}
            </section>
            <DashboardAnalytics summary={employeeSummary} />
          </>
        ) : null}

        {activeItem === "Dashboard" ? null : activeItem === "Employee List" ? (
          <EmployeeBasicDataInquiry onAddEmployee={() => navigateToPage("New Employee Entry")} />
        ) : activeItem === "Arrear Bill Entry" ? (
          <ArrearBillEntry />
        ) : activeItem === "Arrear Payment" ? (
          <ArrearPaymentPage />
        ) : activeItem === "Arrear Bill Print" ? (
          <ArrearBillPrintPage />
        ) : activeItem === "Arrear Bill Of An Employee - Doc. Wise" || activeItem === "Arrear Bill Of An Employee Document Wise" ? (
          <ArrearBillReportPage groupBy="doc_no" />
        ) : activeItem === "Arrear Bill Of An Employee - Code Wise" || activeItem === "Arrear Bill Of An Employee Code Wise" ? (
          <ArrearBillReportPage groupBy="employee_code" />
        ) : activeItem === "Budget/Expense Entry" ? (
          <BudgetExpenseEntry />
        ) : activeItem === "Document Printing" ? (
          <DocumentPrintingPage />
        ) : activeItem === "Budget Position" ? (
          <BudgetPositionPage />
        ) : activeItem === "Arrear Bill Correction" ? (
          <ArrearBillCorrectionPage />
        ) : activeItem === "Budget/Expense Edit" ? (
          <BudgetExpenseEditPage />
        ) : activeItem === "Salary Proof List" ? (
          <SalaryProofListPage />
        ) : activeItem === "Salary Proof List 2" ? (
          <SalaryProofList2Page />
        ) : activeItem === "Allowance Proof List" ? (
          <AllowanceProofListPage />
        ) : activeItem === "Inactive Proof List" ? (
          <InactiveProofListPage />
        ) : activeItem === "Scale Audit Proof Printing" ? (
          <ScaleAuditProofPrintingPage />
        ) : activeItem === "Payroll" ? (
          <PayrollProcessPage title="Payroll" activeFiscalYear={currentFiscalYear} />
        ) : activeItem === "Salary Calculation" ? (
          <PayrollProcessPage title="Salary Calculation" onGoBack={() => navigateToPage("M.Process")} activeFiscalYear={currentFiscalYear} />
        ) : activeItem === "New Percent Allowance Creation" ? (
          <PercentAllowanceCreationPage />
        ) : activeItem === "Fixed Amount Allowance Creation" ? (
          <FixedAllowanceCreationPage />
        ) : activeItem === "Annual Increment" ? (
          <AnnualIncrementPage onGoBack={() => navigateToPage("M.Process")} />
        ) : activeItem === "Bank Summary" ? (
          <BankSummaryPage />
        ) : activeItem === "Non Bank Salary" ? (
          <NonBankSalaryPage />
        ) : activeItem === "Grand Bank Summary" ? (
          <GrandBankSummaryPage />
        ) : activeItem === "Payment List" ? (
          <PaymentListPage />
        ) : activeItem === "List Of Payment" ? (
          <ListOfPaymentPage />
        ) : activeItem === "Scale Audit Register" ? (
          <PayrollScaleAuditRegisterPage />
        ) : activeItem === "Budget Requirement" ? (
          <BudgetRequirementPage />
        ) : activeItem === "Pay Slips" ? (
          <PaySlipsPage />
        ) : activeItem === "Single Pay Slips" ? (
          <SinglePaySlipPage />
        ) : activeItem === "Income Tax Schedule" ? (
          <PayDedSchedulePage title="Income Tax Schedule" defaultCodeKey="incomeTax" defaultCode="6002" />
        ) : activeItem === "G.P. Fund Schedule" ? (
          <PayDedSchedulePage title="G.P. Fund Schedule" defaultCodeKey="gpFund" defaultCode="G06103" />
        ) : activeItem === "Other Schedules" ? (
          <PayDedSchedulePage title="Any Pay/Ded. Schedule" />
        ) : activeItem === "PGHSF Schedule" ? (
          <PayDedSchedulePage title="PGHSF Schedule" defaultCodeKey="pghsf" defaultCode="G11278" allowExcel />
        ) : activeItem === "Single Pay Slips For Months" || activeItem === "Slip Reprint History" ? (
          <SinglePaySlipsForMonthsPage />
        ) : activeItem === "Designation Wise List" ? (
          <DesignationWiseListPage />
        ) : activeItem === "Annual Income Tax Schedule" ? (
          <AnnualIncomeTaxSchedulePage />
        ) : activeItem === "Post Audit" ? (
          <PostAuditPage />
        ) : activeItem === "Active Inactive Complete" ? (
          <ActiveInactiveReportPage />
        ) : activeItem === "Active Inactive For The Month" ? (
          <ActiveInactiveReportPage monthwise />
        ) : activeItem === "To Excel" ? (
          <ToExcelPage />
        ) : activeItem === "Employee Pay Allowance Inquiry" ? (
          <EmployeePayAllowanceInquiry />
        ) : activeItem === "Pay Allowances Entry" ? (
          <PayAllowancesEntry />
        ) : activeItem === "Special Pay Edit" ? (
          <SpecialPayEdit />
        ) : activeItem === "Check BOP" ? (
          <ChequePrintPage bankType="BOP" />
        ) : activeItem === "Check SDA" ? (
          <ChequePrintPage bankType="SDA" />
        ) : activeItem === "Allowances To Excel" ? (
          <MonthRangeExportPage type="allowances" />
        ) : activeItem === "Tax Schedule To Excel" ? (
          <MonthRangeExportPage type="tax" />
        ) : activeItem === "New Employee Entry" ? (
          <NewEmployeeEntryForm onSaved={() => navigateToPage("Employee List")} />
        ) : activeItem === "Department Code Making/Edit" || activeItem === "Department Code List" ? (
          <DepartmentCodeManagement />
        ) : activeItem === "Designation Code Making/Edit" || activeItem === "Designation Code List" ? (
          <DesignationCodeManagement />
        ) : activeItem === "Bank Code Making/Edit" || activeItem === "Bank Code List" ? (
          <BankCodeManagement />
        ) : activeItem === "Bank Branch Code Making/Edit" || activeItem === "Bank Branch Code List" ? (
          <BankBranchCodeManagement />
        ) : activeItem === "Accounts Code Making" || activeItem === "Account Code List" || activeItem === "Accounts Code List" ? (
          <AccountCodeManagement />
        ) : activeItem === "Wage Type Code Making" || activeItem === "Wage Type Code List" ? (
          <WageCodeMaster />
        ) : activeItem === "Fiscal Year Settings" ? (
          <FiscalYearManagement />
        ) : activeItem === "Employee Advances" ? (
          <EmployeeAdvancesPage />
        ) : activeItem === "Tax Slab Settings" ? (
          <TaxSlabManagement />
        ) : activeItem === "Reset Data" ? (
          <ResetDataPanel />
        ) : activeItem === "Password Change" ? (
          <PasswordChangePanel />
        ) : (
          <section className="workspace-panel">
            <div>
              <p>Selected Module</p>
              <h2>{activeItem}</h2>
            </div>
            <p>
              This module screen is ready for the next form, table, report, or payroll workflow.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
