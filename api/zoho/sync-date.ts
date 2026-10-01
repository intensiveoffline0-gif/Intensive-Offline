import { persistSyncInfo, getSyncInfo } from "../zohoSyncCore";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (_) {}
    }

    const { syncDate } = body || {};
    if (!syncDate) {
      return res.status(400).json({ error: "Missing syncDate field" });
    }

    const currentInfo = await getSyncInfo();
    const updated = {
      ...currentInfo,
      lastSync: syncDate,
      updatedAt: new Date().toISOString()
    };
    await persistSyncInfo(updated);

    return res.status(200).json({ success: true, lastSync: syncDate });
  } catch (err: any) {
    console.error("[API /api/zoho/sync-date Error]:", err);
    return res.status(500).json({ error: err.message || "Failed to update sync date" });
  }
}
