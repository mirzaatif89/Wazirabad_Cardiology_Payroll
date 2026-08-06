import {
  createArrearPayment,
  getArrearBillsForPayment,
  getArrearPaymentById,
  getArrearPayments,
  getNextArrearPaymentNo,
  reverseArrearPaymentById
} from "../models/arrearPaymentModel.js";
import { logAuditAction } from "../models/auditLogModel.js";

export async function nextPaymentNo(_req, res) {
  try {
    return res.json({
      success: true,
      data: { paymentNo: await getNextArrearPaymentNo() },
      message: "Next arrear payment number loaded."
    });
  } catch (error) {
    console.error("Next arrear payment number failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Next arrear payment number failed." });
  }
}

export async function listPayableBills(req, res) {
  try {
    const bills = await getArrearBillsForPayment({
      employeeCode: req.query.employee_code || "",
      billStatus: req.query.status || ""
    });

    return res.json({ success: true, data: bills, message: "Payable arrear bills loaded." });
  } catch (error) {
    console.error("Payable arrear bill list failed:", error);
    return res.status(500).json({ success: false, data: [], message: "Payable arrear bill list failed." });
  }
}

export async function listPayments(req, res) {
  try {
    const payments = await getArrearPayments({
      employeeCode: req.query.employee_code || "",
      status: req.query.status || "",
      billNo: req.query.bill_no || "",
      dateFrom: req.query.date_from || "",
      dateTo: req.query.date_to || ""
    });

    return res.json({ success: true, data: payments, message: "Arrear payments loaded." });
  } catch (error) {
    console.error("Arrear payment list failed:", error);
    return res.status(500).json({ success: false, data: [], message: "Arrear payment list failed." });
  }
}

export async function findPayment(req, res) {
  try {
    const payment = await getArrearPaymentById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, data: null, message: "Arrear payment not found." });
    }

    return res.json({ success: true, data: payment, message: "Arrear payment loaded." });
  } catch (error) {
    console.error("Arrear payment lookup failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Arrear payment lookup failed." });
  }
}

export async function createPayment(req, res) {
  try {
    const result = await createArrearPayment(req.body || {});

    if (result.status === "invalid") {
      return res.status(400).json({ success: false, data: null, message: result.message || "Invalid arrear payment." });
    }

    if (result.status === "not_found") {
      return res.status(404).json({ success: false, data: null, message: "Arrear bill not found." });
    }

    if (result.status === "locked") {
      return res.status(409).json({ success: false, data: null, message: result.message || "Arrear bill cannot be paid." });
    }

    if (result.status === "error") {
      return res.status(500).json({ success: false, data: null, message: result.message || "Arrear payment failed." });
    }

    await logAuditAction({
      action: "payment",
      documentType: "arrear",
      documentNo: result.payment?.billNo || req.body?.arrearBillNo || null,
      performedBy: req.body?.paidBy || "Hospital Admin",
      notes: `Arrear payment posted for bill ${result.payment?.billNo || req.body?.arrearBillId || ""}.`
    });

    return res.status(201).json({
      success: true,
      data: result,
      message: result.billStatus?.status === "paid" ? "Arrear bill paid successfully." : "Arrear payment posted successfully."
    });
  } catch (error) {
    console.error("Arrear payment save failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Arrear payment save failed." });
  }
}

export async function reversePayment(req, res) {
  try {
    const result = await reverseArrearPaymentById(req.params.id, req.body?.reversedBy || "Hospital Admin");

    if (result.status === "not_found") {
      return res.status(404).json({ success: false, data: null, message: "Arrear payment not found." });
    }

    if (result.status === "locked") {
      return res.status(409).json({ success: false, data: null, message: "Arrear payment is already reversed." });
    }

    await logAuditAction({
      action: "reverse",
      documentType: "arrear",
      documentNo: result.payment?.billNo || null,
      performedBy: req.body?.reversedBy || "Hospital Admin",
      notes: "Reversed arrear payment."
    });

    return res.json({ success: true, data: result, message: "Arrear payment reversed successfully." });
  } catch (error) {
    console.error("Arrear payment reverse failed:", error);
    return res.status(500).json({ success: false, data: null, message: "Arrear payment reverse failed." });
  }
}
