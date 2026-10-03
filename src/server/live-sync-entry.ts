import { syncWithZohoLive } from "./zohoSyncCore";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

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

    const clientSyncTime = body?.clientSyncTime;
    const syncResult = await syncWithZohoLive(clientSyncTime);
    return res.status(200).json(syncResult);
  } catch (error: any) {
    console.error("[API /api/zoho/live-sync Error]:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to sync live values from Zoho Creator report" 
    });
  }
}
