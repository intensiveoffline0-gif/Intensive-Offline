import { getCsvDataset, persistCsvDataset, parseServerCSVRows } from "./zohoSyncCore";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    try {
      const csv = await getCsvDataset();
      const rows = parseServerCSVRows(csv);
      const count = Math.max(0, rows.length - 1);
      return res.status(200).json({ csv, count });
    } catch (err: any) {
      console.error("[API /api/csv GET Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to retrieve student data" });
    }
  }

  if (req.method === "POST") {
    try {
      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch (_) {}
      }

      const csv = typeof body === "string" ? body : body?.csv;
      const pin = body?.pin || "";
      const expectedPin = process.env.ADMIN_PIN || "admin0929";

      if (pin && pin !== expectedPin) {
        return res.status(401).json({ error: "Invalid Admin PIN. Authentication required." });
      }

      if (!csv || typeof csv !== "string" || csv.trim().length === 0) {
        return res.status(400).json({ error: "CSV content cannot be empty." });
      }

      await persistCsvDataset(csv);
      const rows = parseServerCSVRows(csv);
      const count = Math.max(0, rows.length - 1);

      return res.status(200).json({
        success: true,
        message: "Student CSV successfully updated.",
        count
      });
    } catch (err: any) {
      console.error("[API /api/csv POST Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to save CSV" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
