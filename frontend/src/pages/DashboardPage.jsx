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
import {
  createEmployee,
  deleteEmployee,
  getEmployeeAllowances,
  getEmployeeByCode,
  getEmployees,
  saveEmployeeAllowances,
  updateEmployee
} from "../services/api.js";

const sidebarSections = [
  { title: "Dashboard", icon: Home, items: [] },
  {
    title: "Transactions",
    icon: ReceiptText,
    items: [
      "Employee Basic Data Inquiry",
      "Employee Pay Allowance Inquiry",
      "Pay Allowances Entry",
      "New Employee Entry",
      "Special Pay Edit",
      "Check BOP",
      "Check SDA",
      "Allowances To Excel",
      "Tax Schedule To Excel"
    ]
  },
  {
    title: "Arrear Bill",
    icon: FileText,
    items: [
      "Arrear Bill Entry",
      "Budget/Expense Entry",
      "Arrear Bill Print",
      "Arrear Bill Of An Employee Document Wise",
      "Arrear Bill Of An Employee Code Wise",
      "Document Printing",
      "Budget Position",
      "Arrear Bill Correction",
      "Budget/Expense Edit"
    ]
  },
  {
    title: "Proofs",
    icon: FileCheck2,
    items: [
      "Salary Proof List",
      "Salary Proof List 2",
      "Allowance Proof List",
      "Inactive Proof List",
      "Scale Audit Proof Printing"
    ]
  },
  {
    title: "Payroll",
    icon: Banknote,
    items: [
      "Budget Requirement",
      "Bank Summary",
      "Non Bank Salary",
      "Grand Bank Summary",
      "Budget Requirement",
      "Payment List",
      "Payroll",
      "List Of Payment",
      "Scale Audit Register",
      "Pay Slips",
      "Single Pay Slips"
    ]
  },
  {
    title: "Reports",
    icon: BarChart3,
    items: [
      "Income Tax Schedule",
      "G.P. Fund Schedule",
      "Other Schedules",
      "PGHSF Schedule",
      "Single Pay Slips For Months",
      "Designation Wise List",
      "Annual Income Tax Schedule",
      "Post Audit",
      "Active Inactive Complete",
      "Active Inactive For The Month",
      "To Excel"
    ]
  },
  {
    title: "M.Process",
    icon: CircleDollarSign,
    items: [
      "Salary Calculation",
      "New Percent Allowance Creation",
      "Fixed Amount Allowance Creation",
      "Annual Increment"
    ]
  },
  {
    title: "Management",
    icon: BriefcaseBusiness,
    items: [
      "Department Code Making/Edit",
      "Designation Code Making/Edit",
      "Bank Branch Code Making/Edit",
      "Bank Code Making/Edit",
      "Accounts Code Making",
      "Wage Type Code Making",
      "Department Code List",
      "Designation Code List",
      "Bank Code List",
      "Account Code List",
      "Wage Type Code List",
      "Reindexing",
      "Basic Setup",
      "Password Change",
      "Authorisation",
      "Clear Password"
    ]
  }
];

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
  { label: "Designation", name: "designation" },
  { label: "BPS", name: "bps" },
  { label: "Gaz/NG", name: "gazNg", type: "select", options: ["Gazetted", "Non Gazetted"] },
  { label: "D.O.B.", name: "dateOfBirth", type: "date" },
  { label: "Date Of Joining", name: "dateOfJoining", type: "date" },
  { label: "Department", name: "department" },
  { label: "Service Type", name: "serviceType" },
  { label: "Bank", name: "bank" },
  { label: "Account No.", name: "accountNo" },
  { label: "GPF A/C No.", name: "gpfAccountNo" },
  { label: "NTN No.", name: "ntnNo" },
  { label: "PGHSF No.", name: "pghsfNo" },
  { label: "Religion", name: "religion" },
  { label: "SAP #", name: "sapNo" },
  { label: "Stop Date", name: "stopDate", type: "date" },
  { label: "Special Designation", name: "specialDesignation" }
];

function NewEmployeeEntryForm() {
  const initialForm = Object.fromEntries(
    newEmployeeFields.map((field) => [field.name, field.defaultValue || ""])
  );
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleReset = () => {
    setForm(initialForm);
    setStatus({ type: "", message: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await createEmployee(form);
      setStatus({ type: "success", message: result.message });
      setForm((current) => ({ ...initialForm, employeeNo: current.employeeNo }));
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

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
                required={field.name === "employeeNo" || field.name === "name"}
              />
            )}
          </label>
        ))}

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

function EmployeeBasicDataInquiry() {
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState({ type: "", message: "Loading employees..." });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
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
      const records = await getEmployees();
      setEmployees(records);
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
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setSavingEdit(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await updateEmployee(editingEmployee.id, editForm);
      setStatus({ type: "success", message: result.message });
      cancelEdit();
      await loadEmployees();
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
    <section className="employee-entry-panel" aria-label="Employee basic data inquiry">
      <div className="form-title-row">
        <div>
          <p>Transactions</p>
          <h2>Employee Basic Data Inquiry</h2>
        </div>
        <button className="refresh-button" type="button" onClick={loadEmployees} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
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
                  <div className="row-icon-actions">
                    <button type="button" onClick={() => startEdit(employee)} title="Edit employee">
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteEmployee(employee)}
                      title="Delete employee"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadEmployee = async () => {
    if (!employeeCode.trim()) {
      setStatus({ type: "error", message: "Please enter employee code." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const foundEmployee = await getEmployeeByCode(employeeCode.trim());
      const savedAllowances = await getEmployeeAllowances(foundEmployee.id);
      setEmployee(foundEmployee);
      setAllowances(savedAllowances.length ? savedAllowances : defaultAllowanceRows);
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

  const updateAllowance = (rowIndex, field, value) => {
    setAllowances((current) =>
      current.map((row, index) => (index === rowIndex ? { ...row, [field]: value } : row))
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

      <div className="allowance-table-wrap">
        <table className="allowance-table">
          <thead>
            <tr>
              <th>Sr #</th>
              <th>Code</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Upto</th>
            </tr>
          </thead>
          <tbody>
            {allowances.map((row, index) => (
              <tr key={`${row.srNo}-${index}`}>
                <td>{index + 1}</td>
                <td>
                  <input
                    value={row.allowanceCode}
                    onChange={(event) => updateAllowance(index, "allowanceCode", event.target.value)}
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
    </section>
  );
}

export default function DashboardPage({ user, onLogout }) {
  const [openSection, setOpenSection] = useState("Transactions");
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [employeeSummary, setEmployeeSummary] = useState({ activeEmployees: 0, departments: 0 });

  const summaryCards = [
    { label: "Active Employees", value: employeeSummary.activeEmployees, icon: Users },
    { label: "Monthly Payroll", value: "PKR 0", icon: Banknote },
    { label: "Departments", value: employeeSummary.departments, icon: Building2 },
    { label: "Pending Proofs", value: "0", icon: ShieldCheck }
  ];

  const selectMainSection = (section) => {
    setActiveItem(section.title);
    if (section.items.length) {
      setOpenSection((current) => (current === section.title ? "" : section.title));
    }
  };

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
          departments: departments.size
        });
      } catch {
        setEmployeeSummary({ activeEmployees: 0, departments: 0 });
      }
    }

    loadDashboardSummary();
  }, [activeItem]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Building2 size={26} />
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
                        onClick={() => setActiveItem(item)}
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
            <span>{user?.name || "Hospital Admin"}</span>
            <button type="button" onClick={onLogout}>
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </header>

        {activeItem === "Dashboard" ? (
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
        ) : null}

        {activeItem === "Employee Basic Data Inquiry" ? (
          <EmployeeBasicDataInquiry />
        ) : activeItem === "Pay Allowances Entry" ? (
          <PayAllowancesEntry />
        ) : activeItem === "New Employee Entry" ? (
          <NewEmployeeEntryForm />
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
