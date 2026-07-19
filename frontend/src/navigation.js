export const sidebarSections = [
  { title: "Dashboard", items: [] },
  {
    title: "Transactions",
    items: [
      "Employee List",
      "Employee Pay Allowance Inquiry",
      "Pay Allowances Entry",
      "Special Pay Edit",
      "Check BOP",
      "Check SDA",
      "Allowances To Excel",
      "Tax Schedule To Excel"
    ]
  },
  {
    title: "Arrear Bill",
    items: [
      "Arrear Bill Entry",
      "Budget/Expense Entry",
      "Document Printing",
      "Budget Position"
    ]
  },
  {
    title: "Proofs",
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
    items: [
      "Budget Requirement",
      "Bank Summary",
      "Non Bank Salary",
      "Grand Bank Summary",
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
    items: [
      "Salary Calculation",
      "New Percent Allowance Creation",
      "Fixed Amount Allowance Creation",
      "Annual Increment"
    ]
  },
  {
    title: "Management",
    items: [
      "Department Code List",
      "Designation Code List",
      "Bank Branch Code List",
      "Bank Code List",
      "Accounts Code List",
      "Wage Type Code List",
      "Reset Data",
      "Password Change",
      "Clear Password"
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
      if (!result[item]) {
        result[item] = slugify(item);
      }
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
