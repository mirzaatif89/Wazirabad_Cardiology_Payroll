import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5050),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminName: process.env.ADMIN_NAME || "Hospital Admin",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || "PAyroll_Syatems",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || ""
  },
  jwtSecret: process.env.JWT_SECRET || "change_this_secret_for_production",
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    user: process.env.SMTP_USER || "",
    password: process.env.SMTP_PASSWORD || "",
    from: process.env.SMTP_FROM || process.env.SMTP_USER || ""
  },
  reportScheduleDefaults: {
    incomeTax: process.env.REPORT_INCOME_TAX_WAGE_CODE || "6002",
    gpFund: process.env.REPORT_GP_FUND_WAGE_CODE || "G06103",
    pghsf: process.env.REPORT_PGHSF_WAGE_CODE || "G11278"
  },
  payrollLedgerDefaults: {
    salaryPayableAccountCode: process.env.PAYROLL_SALARY_PAYABLE_ACCOUNT_CODE || "L03001"
  },
  arrearLedgerDefaults: {
    arrearExpenseAccountCode: process.env.ARREAR_EXPENSE_ACCOUNT_CODE || "E03001",
    salaryPayableAccountCode: process.env.ARREAR_SALARY_PAYABLE_ACCOUNT_CODE || process.env.PAYROLL_SALARY_PAYABLE_ACCOUNT_CODE || "L03001"
  }
};
