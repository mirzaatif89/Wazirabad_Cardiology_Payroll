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
  getArrearBill,
  getArrearBillReport,
  getArrearBills,
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
  getDepartments,
  getDesignations,
  getAllowancesExport,
  getWageCodes,
  getNextArrearDocumentNo,
  getNextBudgetDocumentNo,
  getDocumentByNumber,
  getProofReport,
  getPayrollBudgetRequirement,
  getPayrollReport,
  getPayrollRuns,
  getSinglePayrollPayslip,
  getReportModule,
  getReportScheduleDefaults,
  getSpecialPay,
  getTaxScheduleExport,
  printCheque,
  processPayroll,
  reopenPayrollRun,
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
  { label: "Employee No.", name: "employeeNo", defaultValue: "149" },
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
  { label: "Department Code", name: "departmentCode" },
  { label: "Department", name: "department", readOnly: true },
  { label: "Service Type", name: "serviceType" },
  { label: "Bank Code", name: "bankCode" },
  { label: "Bank", name: "bank", readOnly: true },
  { label: "Branch Code", name: "bankBranchCode" },
  { label: "Bank Branch", name: "bankBranch", readOnly: true },
  { label: "Account No.", name: "accountNo" },
  { label: "GPF A/C No.", name: "gpfAccountNo" },
  { label: "NTN No.", name: "ntnNo" },
  { label: "PGHSF No.", name: "pghsfNo" },
  { label: "Religion", name: "religion" },
  { label: "SAP #", name: "sapNo" },
  { label: "Stop Date", name: "stopDate", type: "date" },
  { label: "Special Designation", name: "specialDesignation" }
];

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

  return branches.find((branch) => branch.code.toLowerCase() === cleanCode) || null;
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

  const handleReset = () => {
    setForm(initialForm);
    setStatus({ type: "", message: "" });
    setDepartmentStatus("");
    setDesignationStatus("");
    setBankStatus("");
    setBranchStatus("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await createEmployee(form);
      setStatus({ type: "success", message: result.message });
      setForm((current) => ({ ...initialForm, employeeNo: current.employeeNo }));
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
        {newEmployeeFields.map((field) => (
          <label className={field.wide ? "wide-field" : ""} key={field.name}>
            <span>{field.label}</span>
            {field.type === "select" ? (
              <select
                name={field.name}
                value={form[field.name]}
                onChange={updateField}
              >
                <option value="">Select</option>
                {field.options.map((option) => (
                  <option value={option} key={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                name={field.name}
                type={field.type || "text"}
                value={form[field.name]}
                onChange={updateField}
                readOnly={field.readOnly}
                required={field.name === "employeeNo" || field.name === "name"}
              />
            )}
          </label>
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
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Employee"}
          </button>
        </div>
      </form>
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
          </tr>
        `
      )
      .join("");
    const printWindow = window.open("", "_blank", "width=1100,height=700");

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
    const formData = Object.fromEntries(
      newEmployeeFields.map((field) => [field.name, employee[field.name] || ""])
    );

    setEditingEmployee(employee);
    setEditForm(formData);
    setStatus({ type: "", message: "" });
  };

  const cancelEdit = () => {
    setEditingEmployee(null);
    setEditForm(null);
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
          {newEmployeeFields.map((field) => (
            <label className={field.wide ? "wide-field" : ""} key={field.name}>
              <span>{field.label}</span>
              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={editForm[field.name]}
                  onChange={updateEditField}
                >
                  <option value="">Select</option>
                  {field.options.map((option) => (
                    <option value={option} key={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.name}
                  type={field.type || "text"}
                  value={editForm[field.name]}
                  onChange={updateEditField}
                  readOnly={field.readOnly}
                  required={field.name === "employeeNo" || field.name === "name"}
                />
              )}
            </label>
          ))}
          <div className="form-actions">
            <button type="button" onClick={cancelEdit}>Cancel</button>
            <button type="submit" disabled={savingEdit}>
              {savingEdit ? "Updating..." : "Update Employee"}
            </button>
          </div>
        </form>
      ) : null}

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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedEmployees.map((employee) => (
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
            ))}

            {!displayedEmployees.length && !loading ? (
              <tr>
                <td colSpan="12">No matching employees found.</td>
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
  upto: index === 0 ? "2099-12-31" : ""
}));

function PayAllowancesEntry() {
  const [employeeCode, setEmployeeCode] = useState("");
  const [employee, setEmployee] = useState(null);
  const [allowances, setAllowances] = useState(defaultAllowanceRows);
  const [allowanceCodes, setAllowanceCodes] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const isAllowanceActive = (row) => !row.upto || row.upto >= today;
  const activeAllowanceTotal = allowances.reduce((total, row) => {
    if (!isAllowanceActive(row)) {
      return total;
    }

    return total + Number(row.amount || 0);
  }, 0);

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
      setAllowances(allowanceData.allowances.length ? allowanceData.allowances : defaultAllowanceRows);
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
      setAllowanceCodes(
        result.filter((wageCode) =>
          ["Allowance Codes", "Pay & Allowance Adjustment Codes"].includes(wageCode.category)
        )
      );
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const updateAllowance = (rowIndex, field, value) => {
    setAllowances((current) =>
      current.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        const nextRow = { ...row, [field]: value };

        if (field === "allowanceCode") {
          const matchedCode = allowanceCodes.find((allowanceCode) => allowanceCode.code === value);
          nextRow.description = matchedCode ? matchedCode.description : row.description;
        }

        return nextRow;
      })
    );
  };

  const addAllowanceRow = () => {
    setAllowances((current) => [
      ...current,
      {
        srNo: current.length + 1,
        allowanceCode: "",
        description: "",
        amount: "",
        upto: ""
      }
    ]);
  };

  const removeAllowanceRow = (rowIndex) => {
    setAllowances((current) =>
      current
        .filter((_row, index) => index !== rowIndex)
        .map((row, index) => ({ ...row, srNo: index + 1 }))
    );
  };

  const saveAllowances = async () => {
    if (!employee) {
      setStatus({ type: "error", message: "Load an employee before saving allowances." });
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await saveEmployeeAllowances(employee.id, allowances);
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadAllowanceCodes();
  }, []);

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
          <span>Salary Active Allowances</span>
          <strong>PKR {activeAllowanceTotal.toLocaleString()}</strong>
        </div>
        <p>Expired allowance rows are not included in employee salary.</p>
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
                    list="pay-allowance-code-options"
                    value={row.allowanceCode}
                    onChange={(event) => updateAllowance(index, "allowanceCode", event.target.value)}
                    placeholder="Select or type"
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
        <datalist id="pay-allowance-code-options">
          {allowanceCodes.map((allowanceCode) => (
            <option value={allowanceCode.code} key={allowanceCode.code}>
              {allowanceCode.description}
            </option>
          ))}
        </datalist>
      </div>

      <div className="allowance-actions">
        <button type="button" onClick={addAllowanceRow}>Add Record</button>
        <button type="button" onClick={saveAllowances} disabled={saving}>
          {saving ? "Saving..." : "Save Allowances"}
        </button>
      </div>
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
      window.setTimeout(() => window.print(), 150);
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
      if (excel) {
        const rows = isTax
          ? result.data.rows.map((row) => ({ "Employee Code": row.employeeCode, Name: row.name, "Tax Amount": row.taxAmount, Month: row.month, Year: row.year }))
          : result.data.rows.map((row) => ({ "Employee Code": row.employeeCode, Name: row.name, "Wage Code": row.wageCode, Description: row.description, Amount: row.amount, "Effective Date": row.effectiveDate }));
        exportRowsToExcel(rows, `${isTax ? "income-tax-schedule" : "complete-allowances"}-${filters.fromMonth}-${filters.fromYear}-to-${filters.toMonth}-${filters.toYear}.xlsx`);
      }
      if (!excel && filters.outputSelection === "printer") window.setTimeout(() => window.print(), 150);
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
        <fieldset><legend>Output</legend><label><input type="radio" value="screen" checked={filters.outputSelection === "screen"} onChange={(event) => setFilters((current) => ({ ...current, outputSelection: event.target.value }))} /> Screen</label><label><input type="radio" value="printer" checked={filters.outputSelection === "printer"} onChange={(event) => setFilters((current) => ({ ...current, outputSelection: event.target.value }))} /> Printer</label></fieldset>
        <div className="report-filter-actions"><button type="button" onClick={() => loadReport(false)}>OK</button><button type="button" onClick={() => loadReport(true)}>Excel Export</button></div>
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
      window.setTimeout(() => window.print(), 150);
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
      window.setTimeout(() => window.print(), 150);
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
        window.setTimeout(() => window.print(), 150);
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
            Screen
          </label>
          <label>
            <input
              type="radio"
              name="outputSelection"
              value="printer"
              checked={filters.outputSelection === "printer"}
              onChange={updateFilter}
            />
            Printer
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
        window.setTimeout(() => window.print(), 150);
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
              Printer
            </label>
            <label>
              <input
                type="radio"
                value="screen"
                checked={outputSelection === "screen"}
                onChange={(event) => setOutputSelection(event.target.value)}
              />
              Screen
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
        window.setTimeout(() => window.print(), 150);
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
          <label><input type="radio" value="screen" checked={outputSelection === "screen"} onChange={(event) => setOutputSelection(event.target.value)} /> Screen</label>
          <label><input type="radio" value="printer" checked={outputSelection === "printer"} onChange={(event) => setOutputSelection(event.target.value)} /> Printer</label>
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
        window.setTimeout(() => window.print(), 150);
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
          <label><input type="radio" value="screen" checked={outputSelection === "screen"} onChange={(event) => setOutputSelection(event.target.value)} /> Screen</label>
          <label><input type="radio" value="printer" checked={outputSelection === "printer"} onChange={(event) => setOutputSelection(event.target.value)} /> Printer</label>
          <label><input type="radio" value="excel" checked={outputSelection === "excel"} onChange={(event) => setOutputSelection(event.target.value)} /> Excel</label>
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
          <label><input type="radio" name="outputSelection" value="screen" checked={filters.outputSelection === "screen"} onChange={updateFilter} /> Screen</label>
          <label><input type="radio" name="outputSelection" value="printer" checked={filters.outputSelection === "printer"} onChange={updateFilter} /> Printer</label>
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
        window.setTimeout(() => window.print(), 150);
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
          <label><input type="radio" name="outputSelection" value="screen" checked={filters.outputSelection === "screen"} onChange={update} /> Screen</label>
          <label><input type="radio" name="outputSelection" value="printer" checked={filters.outputSelection === "printer"} onChange={update} /> Printer</label>
          {allowExcel ? <label><input type="radio" name="outputSelection" value="excel" checked={filters.outputSelection === "excel"} onChange={update} /> Excel</label> : null}
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
      if (filters.outputSelection === "printer") window.setTimeout(() => window.print(), 150);
      if (filters.outputSelection === "excel" && exportRows) exportRowsToExcel(exportRows(result.data), `${endpoint}-${filters.month}-${filters.year}.xlsx`);
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

function PayrollProcessPage() {
  const [filters, setFilters] = useState(payrollDefaultFilters());
  const [result, setResult] = useState(null);
  const [runs, setRuns] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const loadRuns = async () => {
    const data = await getPayrollRuns(filters);
    setRuns(data.data || []);
  };

  const run = async () => {
    if (!window.confirm(`This will calculate payroll for ${filters.month}/${filters.year}. Continue?`)) return;
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const data = await processPayroll(filters);
      setResult(data.data);
      setStatus({ type: "success", message: data.message });
      await loadRuns();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
      await loadRuns();
    } finally {
      setLoading(false);
    }
  };

  const reopenFirstRun = async () => {
    if (!runs.length) return;
    try {
      await reopenPayrollRun(runs[0].id);
      setStatus({ type: "success", message: "Payroll run reopened." });
      await loadRuns();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <section className="employee-entry-panel arrear-report-panel">
      <PayrollFilter title="Payroll" filters={filters} setFilters={setFilters} onRun={run} onCancel={() => { setResult(null); setStatus({ type: "", message: "" }); }} loading={loading} />
      {status.message ? <p className={`form-status ${status.type || "neutral"} no-print`}>{status.message}</p> : null}
      {runs.some((runItem) => ["processed", "locked"].includes(runItem.status)) ? <button className="refresh-button no-print" type="button" onClick={reopenFirstRun}>Reopen</button> : null}
      {result ? (
        <div className="arrear-report-print-area">
          <ReportLetterhead title="Payroll Process Summary" filterSummary={`${filters.month}/${filters.year} | Dept ${filters.deptCode}`} />
          <table className="print-report-table"><thead><tr><th>Employee Code</th><th>Name</th><th>Gross</th><th>Deductions</th><th>Net</th></tr></thead><tbody>{result.items.map((row) => <tr key={row.employeeCode}><td>{row.employeeCode}</td><td>{row.name}</td><td className="amount-cell">{formatCurrency(row.grossPay)}</td><td className="amount-cell">{formatCurrency(row.totalDeductions)}</td><td className="amount-cell">{formatCurrency(row.netPay)}</td></tr>)}<tr className="report-total-row"><td colSpan="2">Grand Total</td><td className="amount-cell">{formatCurrency(result.totals.grossPay)}</td><td className="amount-cell">{formatCurrency(result.totals.totalDeductions)}</td><td className="amount-cell">{formatCurrency(result.totals.netPay)}</td></tr></tbody></table>
        </div>
      ) : null}
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
      if (outputSelection === "printer") window.setTimeout(() => window.print(), 150);
      if (outputSelection === "excel") exportRowsToExcel(result.data.rows || [], `budget-requirement-${endingDate}.xlsx`);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return <section className="employee-entry-panel arrear-report-panel"><div className="form-title-row"><div><p>Payroll</p><h2>Budget Requirement</h2></div></div><div className="report-filter-panel no-print"><label><span>Ending Date</span><input type="date" value={endingDate} onChange={(e) => setEndingDate(e.target.value)} /></label><fieldset><legend>Output Selection</legend><label><input type="radio" value="screen" checked={outputSelection === "screen"} onChange={(e) => setOutputSelection(e.target.value)} /> Screen</label><label><input type="radio" value="printer" checked={outputSelection === "printer"} onChange={(e) => setOutputSelection(e.target.value)} /> Printer</label><label><input type="radio" value="excel" checked={outputSelection === "excel"} onChange={(e) => setOutputSelection(e.target.value)} /> Excel</label></fieldset><div className="report-filter-actions"><button type="button" onClick={run}>OK</button><button type="button" onClick={() => { setReport(null); setEndingDate(today); }}>Cancel</button></div></div>{status.message ? <p className={`form-status ${status.type}`}>{status.message}</p> : null}{report ? <div className="arrear-report-print-area"><ReportLetterhead title="Budget Requirement" filterSummary={`Ending Date: ${endingDate}`} /><table className="print-report-table"><thead><tr><th>Wage Code</th><th>Description</th><th>Projected Total</th></tr></thead><tbody>{(report.rows || []).map((row) => <tr key={row.wageCode}><td>{row.wageCode}</td><td>{row.description}</td><td className="amount-cell">{formatCurrency(row.totalAmount)}</td></tr>)}<tr className="report-total-row"><td colSpan="2">Grand Total</td><td className="amount-cell">{formatCurrency(report.grandTotal)}</td></tr></tbody></table></div> : null}</section>;
}

function PaySlipsPage() {
  return <PayrollReportShell title="Pay Slips" endpoint="payslips">{(report, filters) => <PayslipView slips={report.slips || []} filters={filters} />}</PayrollReportShell>;
}

function PayslipView({ slips, filters }) {
  return <div className="arrear-report-print-area">{slips.map((slip) => <section className="print-bill-section payslip-section" key={slip.employeeCode}><ReportLetterhead title="Pay Slip" filterSummary={`${filters.month}/${filters.year}`} /><div className="print-section-head"><strong>{slip.employeeCode} - {slip.name}</strong><span>{slip.department}</span><span>{slip.designation}</span><span>BPS {slip.bps}</span></div><table className="print-report-table"><thead><tr><th>Code</th><th>Description</th><th>Amount</th></tr></thead><tbody>{(slip.details || []).map((d, i) => <tr key={i}><td>{d.wageCode}</td><td>{d.description}</td><td className="amount-cell">{formatCurrency(d.amount)}</td></tr>)}</tbody></table><div className="print-subtotal-row"><span>Gross {formatCurrency(slip.grossPay)}</span><span>Deductions {formatCurrency(slip.totalDeductions)}</span><strong>Net {formatCurrency(slip.netPay)}</strong></div></section>)}{!slips.length ? <p className="empty-report-note">No pay slips found.</p> : null}</div>;
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
      if (filters.outputSelection === "printer") window.setTimeout(() => window.print(), 150);
    } catch (error) {
      setSlip(null);
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return <section className="employee-entry-panel arrear-report-panel"><div className="form-title-row"><div><p>Payroll</p><h2>Single Pay Slips</h2></div></div><div className="report-filter-panel no-print"><label><span>Employee No</span><input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} /></label><label><span>Month Of Payment</span><input type="number" value={filters.month} onChange={(e) => setFilters((c) => ({ ...c, month: e.target.value }))} /></label><label><span>Payment Year</span><input type="number" value={filters.year} onChange={(e) => setFilters((c) => ({ ...c, year: e.target.value }))} /></label><fieldset><legend>Output Selection</legend><label><input type="radio" value="screen" checked={filters.outputSelection === "screen"} onChange={(e) => setFilters((c) => ({ ...c, outputSelection: e.target.value }))} /> Screen</label><label><input type="radio" value="printer" checked={filters.outputSelection === "printer"} onChange={(e) => setFilters((c) => ({ ...c, outputSelection: e.target.value }))} /> Printer</label></fieldset><div className="report-filter-actions"><button type="button" onClick={run} disabled={loading}>{loading ? "Loading..." : "OK"}</button><button type="button" onClick={() => { setEmployeeCode(""); setSlip(null); }}>Cancel</button></div></div>{status.message ? <p className={`form-status ${status.type}`}>{status.message}</p> : null}{slip ? <PayslipView slips={[slip]} filters={filters} /> : null}</section>;
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
      if (filters.outputSelection === "printer") window.setTimeout(() => window.print(), 150);
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
  const today = new Date();
  const [filters, setFilters] = useState({ employeeCode: "", fromMonth: "1", toMonth: String(today.getMonth() + 1), year: String(today.getFullYear()), outputSelection: "screen" });
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const run = async () => {
    try {
      const result = await getReportModule("payslips-for-months", filters);
      setReport(result.data);
      if (filters.outputSelection === "printer") window.setTimeout(() => window.print(), 150);
    } catch (error) { setStatus({ type: "error", message: error.message }); }
  };
  return <section className="employee-entry-panel arrear-report-panel"><div className="form-title-row"><div><p>Reports</p><h2>Single Pay Slips For Months</h2></div></div><div className="report-filter-panel no-print"><label><span>Employee No</span><input value={filters.employeeCode} onChange={(e) => setFilters((c) => ({ ...c, employeeCode: e.target.value }))} /></label><label><span>From Month</span><input type="number" value={filters.fromMonth} onChange={(e) => setFilters((c) => ({ ...c, fromMonth: e.target.value }))} /></label><label><span>To Month</span><input type="number" value={filters.toMonth} onChange={(e) => setFilters((c) => ({ ...c, toMonth: e.target.value }))} /></label><label><span>Payment Year</span><input type="number" value={filters.year} onChange={(e) => setFilters((c) => ({ ...c, year: e.target.value }))} /></label><fieldset><legend>Output</legend><label><input type="radio" value="screen" checked={filters.outputSelection === "screen"} onChange={(e) => setFilters((c) => ({ ...c, outputSelection: e.target.value }))} /> Screen</label><label><input type="radio" value="printer" checked={filters.outputSelection === "printer"} onChange={(e) => setFilters((c) => ({ ...c, outputSelection: e.target.value }))} /> Printer</label></fieldset><div className="report-filter-actions"><button type="button" onClick={run}>OK</button><button type="button" onClick={() => setReport(null)}>Cancel</button></div></div>{status.message ? <p className={`form-status ${status.type}`}>{status.message}</p> : null}{report ? <PayslipView slips={report.slips || []} filters={{ month: `${filters.fromMonth}-${filters.toMonth}`, year: filters.year }} /> : null}</section>;
}

function DesignationWiseListPage() {
  const [filters, setFilters] = useState(payrollDefaultFilters({ designationCode: "999" }));
  const [report, setReport] = useState(null);
  const run = async () => {
    const result = await getReportModule("designation-wise-list", filters);
    setReport(result.data);
    if (filters.outputSelection === "printer") window.setTimeout(() => window.print(), 150);
  };
  return <section className="employee-entry-panel arrear-report-panel"><PayrollFilter title="Designation Wise List" filters={filters} setFilters={setFilters} onRun={run} onCancel={() => setReport(null)} loading={false} simple /><div className="report-filter-panel no-print"><label><span>Designation Code</span><input value={filters.designationCode} onChange={(e) => setFilters((c) => ({ ...c, designationCode: e.target.value }))} /></label></div>{report ? <div className="arrear-report-print-area"><ReportLetterhead title="Designation Wise List" filterSummary={`${filters.month}/${filters.year}`} />{(report.designations || []).map((g) => <section className="print-employee-section" key={g.designation}><div className="print-employee-head"><strong>{g.designation}</strong></div><table className="print-report-table"><thead><tr><th>Code</th><th>Name</th><th>Dept</th><th>Net Pay</th></tr></thead><tbody>{g.rows.map((r) => <tr key={r.employeeCode}><td>{r.employeeCode}</td><td>{r.name}</td><td>{r.department}</td><td className="amount-cell">{formatCurrency(r.netPay)}</td></tr>)}</tbody></table><div className="print-subtotal-row"><span>Subtotal</span><strong>PKR {formatCurrency(g.subtotal)}</strong></div></section>)}<div className="print-grand-total-row"><span>Grand Total</span><strong>PKR {formatCurrency(report.grandTotal)}</strong></div></div> : null}</section>;
}

function AnnualIncomeTaxSchedulePage() {
  const year = String(new Date().getFullYear());
  const [filters, setFilters] = useState({ reportFor: "All", fromMonth: "1", fromYear: year, toMonth: "12", toYear: year, code: "G12713", outputSelection: "screen" });
  const [report, setReport] = useState(null);
  const run = async () => {
    const result = await getReportModule("annual-income-tax-schedule", filters);
    setReport(result.data);
    if (filters.outputSelection === "printer") window.setTimeout(() => window.print(), 150);
  };
  return <section className="employee-entry-panel arrear-report-panel"><div className="form-title-row"><div><p>Reports</p><h2>Annual Income Tax Schedule</h2></div></div><div className="report-filter-panel no-print"><label><span>Report For</span><select value={filters.reportFor} onChange={(e) => setFilters((c) => ({ ...c, reportFor: e.target.value }))}><option>All</option><option>Regular</option><option>Contract</option></select></label><label><span>From Month</span><input type="number" value={filters.fromMonth} onChange={(e) => setFilters((c) => ({ ...c, fromMonth: e.target.value }))} /></label><label><span>From Year</span><input type="number" value={filters.fromYear} onChange={(e) => setFilters((c) => ({ ...c, fromYear: e.target.value }))} /></label><label><span>To Month</span><input type="number" value={filters.toMonth} onChange={(e) => setFilters((c) => ({ ...c, toMonth: e.target.value }))} /></label><label><span>To Year</span><input type="number" value={filters.toYear} onChange={(e) => setFilters((c) => ({ ...c, toYear: e.target.value }))} /></label><label><span>Code</span><input value={filters.code} onChange={(e) => setFilters((c) => ({ ...c, code: e.target.value }))} /></label><div className="report-filter-actions"><button type="button" onClick={run}>OK</button><button type="button" onClick={() => setReport(null)}>Cancel</button></div></div>{report ? <div className="arrear-report-print-area"><ReportLetterhead title="Annual Income Tax Schedule" filterSummary={`${filters.fromMonth}/${filters.fromYear} to ${filters.toMonth}/${filters.toYear}`} /><table className="print-report-table"><thead><tr><th>Code</th><th>Name</th>{(report.months || []).map((m) => <th key={m}>{m}</th>)}<th>Annual Total</th></tr></thead><tbody>{(report.rows || []).map((r) => <tr key={r.employee_code}><td>{r.employee_code}</td><td>{r.name}</td>{report.months.map((m) => <td className="amount-cell" key={m}>{formatCurrency(r.months[m])}</td>)}<td className="amount-cell">{formatCurrency(r.annualTotal)}</td></tr>)}<tr className="report-total-row"><td colSpan="2">Grand Total</td>{report.months.map((m) => <td className="amount-cell" key={m}>{formatCurrency(report.totals[m])}</td>)}<td className="amount-cell">{formatCurrency(report.grandTotal)}</td></tr></tbody></table></div> : null}</section>;
}

function PostAuditPage() {
  const year = String(new Date().getFullYear());
  const [filters, setFilters] = useState({ employeeCode: "", fromMonth: "1", fromYear: year, outputSelection: "screen" });
  const [report, setReport] = useState(null);
  const run = async () => {
    const result = await getReportModule("post-audit", filters);
    setReport(result.data);
    if (filters.outputSelection === "printer") window.setTimeout(() => window.print(), 150);
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
      if (filters.outputSelection === "printer") window.setTimeout(() => window.print(), 150);
    } catch (error) {
      notifyError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="module-card report-page">
      <ReportToolbar title={title} onPrint={() => window.print()} />
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

export default function DashboardPage({ user, onLogout, initialPage = "Dashboard" }) {
  const [openSection, setOpenSection] = useState("Transactions");
  const [activeItem, setActiveItem] = useState(initialPage);
  const [employeeSummary, setEmployeeSummary] = useState({
    activeEmployees: 0,
    departments: 0,
    withBankAccounts: 0,
    departmentBreakdown: [],
    bpsBreakdown: []
  });

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

        <div className="sidebar-author">
          <span>autor: Atif Mehmood</span>
          <span>Phone: 03147656724</span>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="topbar">
          <div>
            <p>Wazirabad Cardiology Hospital</p>
            <h1>{activeItem}</h1>
          </div>
          <div className="user-actions">
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
          <PayrollProcessPage />
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
          <PayDedSchedulePage title="Income Tax Schedule" defaultCodeKey="incomeTax" defaultCode="G12713" />
        ) : activeItem === "G.P. Fund Schedule" ? (
          <PayDedSchedulePage title="G.P. Fund Schedule" defaultCodeKey="gpFund" defaultCode="G06103" />
        ) : activeItem === "Other Schedules" ? (
          <PayDedSchedulePage title="Any Pay/Ded. Schedule" />
        ) : activeItem === "PGHSF Schedule" ? (
          <PayDedSchedulePage title="PGHSF Schedule" defaultCodeKey="pghsf" defaultCode="G11278" allowExcel />
        ) : activeItem === "Single Pay Slips For Months" ? (
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
