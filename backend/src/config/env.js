import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5050),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || "PAyroll_Syatems",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || ""
  },
  jwtSecret: process.env.JWT_SECRET || "change_this_secret_for_production",
  reportScheduleDefaults: {
    incomeTax: process.env.REPORT_INCOME_TAX_WAGE_CODE || "G12713",
    gpFund: process.env.REPORT_GP_FUND_WAGE_CODE || "G06103",
    pghsf: process.env.REPORT_PGHSF_WAGE_CODE || "G11278"
  }
};
