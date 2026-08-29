export const sidebarSections = [
  { title: "Dashboard", items: [] },
  {
    title: "Transactions",
    items: [
      "Employee List",
      "Pay Allowances Entry",
      "Employee Pay Allowance Inquiry"
    ]
  },
  {
    title: "Arrear Bill",
    items: [
      "Arrear Bill Entry",
      "Arrear Payment",
      "Budget/Expense Entry",
      "Document Printing",
      "Budget Position"
    ]
  },
  {
    title: "Proofs",
    items: [
      "Allowance Proof List",
      "Inactive Proof List",
      "Scale Audit Proof Printing"
    ]
  },
  {
    title: "Payroll",
    items: [
      {
        label: "Run Payroll",
        items: [
          "Payroll",
          "Budget Requirement"
        ]
      },
      {
        label: "Bank Payments",
        items: [
          "Bank Summary",
          "Non Bank Salary",
          "Grand Bank Summary"
        ]
      },
      {
        label: "Payment Reports",
        items: [
          "Payment List",
          "List Of Payment"
        ]
      },
      {
        label: "Payslips & Audit",
        items: [
          "Pay Slips",
          "Single Pay Slips",
          "Scale Audit Register"
        ]
      }
    ]
  },
  {
    title: "Reports",
    items: [
      "Income Tax Schedule",
      "G.P. Fund Schedule",
      "Other Schedules",
      "PGHSF Schedule",
      "Slip Reprint History",
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
    items: [
      "New Percent Allowance Creation",
      "Fixed Amount Allowance Creation",
      "Annual Increment"
    ]
  },
  {
    title: "Management",
    items: [
      {
        label: "Departments",
        items: [
          "Department Code List",
          "Designation Code List"
        ]
      },
      {
        label: "Banks",
        items: [
          "Bank Code List",
          "Bank Branch Code List"
        ]
      },
      {
        label: "Payroll Setup",
        items: [
          "Accounts Code List",
          "Wage Type Code List",
          "Fiscal Year Settings",
          "Tax Slab Settings",
          "Employee Advances"
        ]
      },
      {
        label: "Admin",
        items: [
          "Reset Data",
          "Password Change",
          "Clear Password"
        ]
      }
    ]
  }
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const pageSlugMap = sidebarSections.reduce(
  (result, section) => {
    result[section.title] = slugify(section.title);

    section.items.forEach((item) => {
      const pages = typeof item === "string" ? [item] : item.items || [];

      pages.forEach((page) => {
        if (!result[page]) {
          result[page] = slugify(page);
        }
      });
    });

    return result;
  },
  { Dashboard: "index" }
);

export const slugPageMap = Object.fromEntries(
  Object.entries(pageSlugMap).map(([page, slug]) => [slug, page])
);

export const staticPages = Object.entries(pageSlugMap)
  .filter(([, slug]) => slug !== "index")
  .map(([page, slug]) => ({ page, slug }));

export function getPageSlug(page) {
  return pageSlugMap[page] || slugify(page);
}

export function getPageFromLocation(pathname) {
  const fileName = pathname.split("/").pop() || "index.html";
  const slug = fileName.replace(/\.html$/i, "") || "index";
  return slugPageMap[slug] || "Dashboard";
}
