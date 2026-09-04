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
});
