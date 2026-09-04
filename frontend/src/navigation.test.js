import { describe, expect, test } from "vitest";
import { getPageFromLocation, getPageSlug, sidebarSections } from "./navigation.js";

describe("Payroll navigation", () => {
  test("makes Month Difference available under Payment Reports", () => {
    const payroll = sidebarSections.find((section) => section.title === "Payroll");
    const paymentReports = payroll.items.find((group) => group.label === "Payment Reports");
    expect(paymentReports.items).toContain("Month Difference");
  });

  test("maps Month Difference to its standalone page URL", () => {
    expect(getPageSlug("Month Difference")).toBe("month-difference");
    expect(getPageFromLocation("/month-difference.html")).toBe("Month Difference");
  });

  test("uses one combined Banks & Branches management page", () => {
    const management = sidebarSections.find((section) => section.title === "Management");
    const banks = management.items.find((group) => group.label === "Banks");

    expect(banks.items).toEqual(["Banks & Branches"]);
    expect(getPageSlug("Banks & Branches")).toBe("banks-and-branches");
    expect(getPageFromLocation("/banks-and-branches.html")).toBe("Banks & Branches");
  });

  test("keeps old bank page URLs available as compatibility aliases", () => {
    expect(getPageFromLocation("/bank-code-list.html")).toBe("Bank Code List");
    expect(getPageFromLocation("/bank-branch-code-list.html")).toBe("Bank Branch Code List");
  });
});
