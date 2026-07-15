import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { ensureAllowancesTable } from "./models/allowanceModel.js";
import { ensureEmployeesTable } from "./models/employeeModel.js";
import allowanceRoutes from "./routes/allowanceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Cardiology Hospital Payroll API",
    database: env.db.database
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/allowances", allowanceRoutes);

async function startServer() {
  try {
    await ensureEmployeesTable();
    await ensureAllowancesTable();
    console.log("Employees table is ready.");
  } catch (error) {
    console.error("Database initialization failed:", error.message);
  }

  app.listen(env.port, () => {
    console.log(`Backend running on http://localhost:${env.port}`);
  });
}

startServer();
