import { getDocumentByNumber } from "../models/documentModel.js";

export async function findDocument(req, res) {
  const documentNo = Number(req.params.documentNo || 0);
  const type = req.query.type || "";

  if (!documentNo) {
    return res.status(400).json({ success: false, data: [], message: "Document number is required." });
  }

  if (type && !["arrear", "budget"].includes(type)) {
    return res.status(400).json({ success: false, data: [], message: "Document type must be arrear or budget." });
  }

  try {
    const documents = await getDocumentByNumber(documentNo, type);

    if (!documents.length) {
      return res.status(404).json({ success: false, data: [], message: "Document not found." });
    }

    return res.json({ success: true, data: documents, message: "Document loaded." });
  } catch (error) {
    console.error("Document lookup failed:", error);
    return res.status(500).json({ success: false, data: [], message: "Document lookup failed." });
  }
}
