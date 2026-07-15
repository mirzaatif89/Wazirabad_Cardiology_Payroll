import { getChartOfAccounts } from "../models/chartOfAccountsModel.js";

export async function listChartOfAccounts(req, res) {
  try {
    const accounts = await getChartOfAccounts(req.query.search || "");
    return res.json({
      success: true,
      data: accounts,
      message: "Chart of accounts loaded."
    });
  } catch (error) {
    console.error("Chart of accounts list failed:", error);
    return res.status(500).json({
      success: false,
      data: [],
      message: "Chart of accounts list failed."
    });
  }
}
