import { getSyncInfo } from "../zohoSyncCore.ts";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const info = await getSyncInfo();
    return res.status(200).json(info);
  } catch (err: any) {
    console.error("[API /api/zoho/sync Error]:", err);
    return res.status(500).json({ error: err.message || "Failed to retrieve sync status" });
  }
}
