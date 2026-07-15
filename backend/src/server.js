import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { ensureAccountCodesTable } from "./models/accountCodeModel.js";
import { ensureAllowancesTable } from "./models/allowanceModel.js";
import { ensureAdminUsersTable } from "./models/authModel.js";
import { ensureArrearBillTables } from "./models/arrearBillModel.js";
import { ensureAuditLogTable } from "./models/auditLogModel.js";
import { ensureBankTables } from "./models/bankModel.js";
import { ensureBudgetTransactionTables } from "./models/budgetTransactionModel.js";
import { ensureChartOfAccountsTable } from "./models/chartOfAccountsModel.js";
import { ensureDepartmentsTable } from "./models/departmentModel.js";
import { ensureDesignationsTable } from "./models/designationModel.js";
import { ensureEmployeesTable } from "./models/employeeModel.js";
import { ensureWageCodesTable } from "./models/wageCodeModel.js";
import accountCodeRoutes from "./routes/accountCodeRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import arrearBillRoutes from "./routes/arrearBillRoutes.js";
import allowanceRoutes from "./routes/allowanceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { bankBranchRouter, bankRouter } from "./routes/bankRoutes.js";
import { budgetPosition, budgetSummary } from "./controllers/budgetTransactionController.js";
import budgetTransactionRoutes from "./routes/budgetTransactionRoutes.js";
import chartOfAccountsRoutes from "./routes/chartOfAccountsRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import designationRoutes from "./routes/designationRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import { findDocument } from "./controllers/documentController.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import wageCodeRoutes from "./routes/wageCodeRoutes.js";

const app = express();

const allowedOrigins = new Set(
  [env.frontendUrl, "http://localhost:5173", "http://127.0.0.1:5173"].filter(Boolean)
);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  }
}));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Cardiology Hospital Payroll API",
    database: env.db.database
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/arrear-bills", arrearBillRoutes);
app.use("/api/budget-transactions", budgetTransactionRoutes);
app.get("/api/budget-summary", budgetSummary);
app.get("/api/budget-position", budgetPosition);
app.get("/api/documents/:documentNo", findDocument);
app.use("/api/documents", documentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/allowances", allowanceRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/designations", designationRoutes);
app.use("/api/banks", bankRouter);
app.use("/api/bank-branches", bankBranchRouter);
app.use("/api/account-codes", accountCodeRoutes);
app.use("/api/chart-of-accounts", chartOfAccountsRoutes);
app.use("/api/wage-codes", wageCodeRoutes);

async function startServer() {
  try {
    await ensureAdminUsersTable();
    await ensureChartOfAccountsTable();
    await ensureAccountCodesTable();
    await ensureBankTables();
    await ensureDepartmentsTable();
    await ensureDesignationsTable();
    await ensureEmployeesTable();
    await ensureAllowancesTable();
    await ensureWageCodesTable();
    await ensureArrearBillTables();
    await ensureBudgetTransactionTables();
    await ensureAuditLogTable();
    console.log("Payroll database tables are ready.");
  } catch (error) {
    console.error("Database initialization failed:", error.message);
  }

  app.listen(env.port, () => {
    console.log(`Backend running on http://localhost:${env.port}`);
  });
}

startServer();
