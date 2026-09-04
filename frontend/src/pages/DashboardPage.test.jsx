import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  getEmployeeAdvances: vi.fn(),
  getEmployees: vi.fn(),
  getNextEmployeeAdvanceNo: vi.fn(),
  getPayrollMonthDifference: vi.fn(),
  getPayrollRuns: vi.fn()
}));

vi.mock("../services/api.js", async () => {
  const actual = await vi.importActual("../services/api.js");
  return { ...actual, ...apiMocks };
});

import {
  EmployeeCodeLookupModal,
  EmployeeAdvancesPage,
  MonthDifferencePage,
  PayslipView,
  formatServiceLength,
  getBankBranchesForBank
} from "./DashboardPage.jsx";

describe("Employee advances help", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getEmployeeAdvances.mockResolvedValue([]);
    apiMocks.getEmployees.mockResolvedValue([]);
    apiMocks.getNextEmployeeAdvanceNo.mockResolvedValue({ data: { advanceNo: 1 } });
  });

  test("opens a field-specific guide and closes it from the same help button", async () => {
    const user = userEvent.setup();
    render(<EmployeeAdvancesPage />);

    const helpButton = screen.getByRole("button", { name: "? How Advances Work" });
    expect(helpButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("complementary", { name: "How employee advances work" })).not.toBeInTheDocument();

    await user.click(helpButton);

    expect(helpButton).toHaveAttribute("aria-expanded", "true");
    const helpPanel = screen.getByRole("complementary", { name: "How employee advances work" });
    expect(helpPanel).toBeVisible();
    expect(within(helpPanel).getByText(/deduction wage code 4002/i)).toBeVisible();
    expect(within(helpPanel).getByText("Percentage")).toBeVisible();
    expect(within(helpPanel).getByText("Fixed amount")).toBeVisible();
    expect(within(helpPanel).getByText("Hold")).toBeVisible();

    await user.click(helpButton);
    expect(screen.queryByRole("complementary", { name: "How employee advances work" })).not.toBeInTheDocument();
  });
});

describe("Employee code lookup keyboard selection", () => {
  test("selects the first visible bank when Enter is pressed in the search input", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    function LookupHarness() {
      const [search, setSearch] = React.useState("");
      return (
        <EmployeeCodeLookupModal
          lookup={{
            fieldName: "bankCode",
            eyebrow: "Bank Code",
            title: "Bank Code Lookup",
            emptyMessage: "No bank code found.",
            rows: [
              { key: "bank-bop", code: "BOP", description: "Bank of Punjab" },
              { key: "bank-nbp", code: "NBP", description: "National Bank" }
            ]
          }}
          search={search}
          onSearch={setSearch}
          onClose={() => {}}
          onSelect={onSelect}
        />
      );
    }

    render(<LookupHarness />);
    const searchInput = screen.getByPlaceholderText("Search code or description");
    await user.type(searchInput, "Punjab{Enter}");

    expect(onSelect).toHaveBeenCalledWith({
      key: "bank-bop",
      code: "BOP",
      description: "Bank of Punjab"
    });
  });
});

describe("Bank and branch relationship", () => {
  const branches = [
    { id: 1, bankCode: "BOP", code: "001", branch: "Main", isActive: 1, bankIsActive: 1 },
    { id: 2, bankCode: "NBP", code: "001", branch: "City", isActive: 1, bankIsActive: 1 },
    { id: 3, bankCode: "BOP", code: "002", branch: "Old", isActive: 0, bankIsActive: 1 }
  ];

  test("shows only active branches belonging to the selected bank", () => {
    expect(getBankBranchesForBank(branches, "BOP")).toEqual([branches[0]]);
    expect(getBankBranchesForBank(branches, "NBP")).toEqual([branches[1]]);
  });

  test("does not offer a branch until a bank is selected", () => {
    expect(getBankBranchesForBank(branches, "")).toEqual([]);
  });
});

describe("Month Difference user flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getPayrollRuns.mockResolvedValue({ data: [] });
  });

  test("compares two selected months and shows employee and total differences", async () => {
    const user = userEvent.setup();
    apiMocks.getPayrollMonthDifference.mockResolvedValue({
      data: {
        previousPeriod: { month: 7, year: 2026, available: true },
        currentPeriod: { month: 8, year: 2026, available: true },
        employeeCounts: { previous: 1, current: 1, compared: 1 },
        rows: [{
          employeeCode: "01",
          name: "Rehan Aslam",
          department: "GENERAL",
          previousNet: 56000,
          currentNet: 56392,
          netDifference: 392,
          changeType: "Changed"
        }],
        totals: { previousNet: 56000, currentNet: 56392, netDifference: 392 }
      }
    });

    render(<MonthDifferencePage />);
    await waitFor(() => expect(apiMocks.getPayrollRuns).toHaveBeenCalled());
    await user.selectOptions(screen.getByLabelText("Previous Month"), "7");
    await user.clear(screen.getByLabelText("Previous Year"));
    await user.type(screen.getByLabelText("Previous Year"), "2026");
    await user.selectOptions(screen.getByLabelText("Current Month"), "8");
    await user.clear(screen.getByLabelText("Current Year"));
    await user.type(screen.getByLabelText("Current Year"), "2026");
    await user.click(screen.getByRole("button", { name: "Compare" }));

    expect(await screen.findByText("1 employee record(s) compared successfully.")).toBeVisible();
    expect(screen.getByText("Rehan Aslam")).toBeVisible();
    expect(screen.getByText("Changed")).toBeVisible();
    expect(screen.getAllByText("392.00").length).toBeGreaterThan(0);
    expect(apiMocks.getPayrollMonthDifference).toHaveBeenCalledWith(expect.objectContaining({
      previousMonth: "7",
      previousYear: "2026",
      currentMonth: "8",
      currentYear: "2026"
    }));
  });

  test("explains that both months must be posted instead of showing a false difference", async () => {
    const user = userEvent.setup();
    apiMocks.getPayrollMonthDifference.mockResolvedValue({
      data: {
        previousPeriod: { month: 7, year: 2026, available: true },
        currentPeriod: { month: 8, year: 2026, available: false },
        employeeCounts: { previous: 0, current: 0, compared: 0 },
        rows: [],
        totals: { previousNet: 0, currentNet: 0, netDifference: 0 }
      }
    });

    render(<MonthDifferencePage />);
    await user.selectOptions(screen.getByLabelText("Previous Month"), "7");
    await user.selectOptions(screen.getByLabelText("Current Month"), "8");
    await user.click(screen.getByRole("button", { name: "Compare" }));

    expect(await screen.findByText(/No posted payroll was found/)).toHaveTextContent("8/");
    expect(screen.queryByText("Previous Total")).not.toBeInTheDocument();
  });
});

describe("Payslip user view", () => {
  const slip = {
    employeeCode: "67",
    name: "Rehan Aslam",
    department: "GENERAL",
    designation: "Telephone Operator",
    bps: "11",
    cnicNo: "35201-1378226-3",
    dateOfJoining: "2019-01-01",
    serviceType: "Regular",
    placeOfPosting: "Hospital",
    gpfAccountNo: "124310",
    ntnNo: "12345",
    pghsfNo: "7788",
    sapNo: "32198754",
    bankCode: "0968",
    bankName: "CIRCULAR ROAD WAZIRABAD",
    accountNo: "277217592",
    grossPay: 59417,
    totalDeductions: 3025,
    netPay: 56392,
    details: [
      { wageCode: "0002", numericCode: 2, description: "PAY OF STAFF", amount: 28730 },
      { wageCode: "1002", numericCode: 1002, description: "HOUSE RENT ALLOWANCE", amount: 1854 },
      { wageCode: "5007", numericCode: 5007, description: "INCOME TAX", amount: 94 },
      { wageCode: "5008", numericCode: 5008, description: "G.P FUND", amount: 1920 }
    ]
  };

  test("shows the supplied form fields and places payments beside deductions", () => {
    render(<PayslipView slips={[slip]} filters={{ month: "7", year: "2026" }} />);

    expect(screen.getByRole("heading", { name: "Wazirabad Institute Of Cardiology" })).toBeVisible();
    expect(screen.getByText("Slip For The Month of July 2026")).toBeVisible();
    expect(screen.getByText("Name:- Rehan Aslam")).toBeVisible();
    expect(screen.getByText("CNIC 35201-1378226-3")).toBeVisible();
    expect(screen.getByText("SAP #:-").parentElement).toHaveTextContent("32198754");

    const firstRow = screen.getByText("PAY OF STAFF").closest("tr");
    expect(within(firstRow).getByText("0002")).toBeVisible();
    expect(within(firstRow).getByText("INCOME TAX")).toBeVisible();
    expect(within(firstRow).getByText("5007")).toBeVisible();
    expect(screen.getByText("Bank 0968 - CIRCULAR ROAD WAZIRABAD")).toBeVisible();
    expect(screen.getByText("Account # 277217592")).toBeVisible();
    expect(screen.getByText("56,392.00")).toBeVisible();
  });

  test("prints a dash for optional employee details that have not been entered", () => {
    render(<PayslipView slips={[{ ...slip, cnicNo: null, ntnNo: null, bankCode: null, bankName: null, accountNo: null }]} filters={{ month: "7", year: "2026" }} />);
    expect(screen.getByText("CNIC -")).toBeVisible();
    expect(screen.getByText("Bank -")).toBeVisible();
    expect(screen.getByText("Account # -")).toBeVisible();
  });

  test("calculates service length as of the selected payroll month", () => {
    expect(formatServiceLength("2019-01-15", 7, 2026)).toBe("7 Yrs 6 Months");
    expect(formatServiceLength(null, 7, 2026)).toBe("-");
  });
});
