import { getSyncInfo, syncWithZohoLive, persistSyncInfo } from "../zohoSyncCore";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    try {
      const info = await getSyncInfo();
      return res.status(200).json(info);
    } catch (err: any) {
      console.error("[API /api/zoho/sync GET Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to retrieve sync status" });
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

      if (body?.onlyDate && body?.syncDate) {
        const info = {
          lastSync: body.syncDate,
          updatedAt: new Date().toISOString(),
          source: "Zoho Creator Live Report"
        };
        await persistSyncInfo(info);
        return res.status(200).json({ success: true, ...info });
      }

      const clientSyncTime = body?.clientSyncTime || body?.syncDate;
      const syncResult = await syncWithZohoLive(clientSyncTime);
      return res.status(200).json(syncResult);
    } catch (err: any) {
      console.error("[API /api/zoho/sync POST Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to execute Zoho sync" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
