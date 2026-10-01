import fs from "fs";
import { getFilePath } from "./zohoSyncCore.ts";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const logoFile = getFilePath("custom_logo.txt");

  if (req.method === "GET") {
    try {
      if (fs.existsSync(logoFile)) {
        const logo = await fs.promises.readFile(logoFile, "utf8");
        return res.status(200).json({ logo });
      }
      return res.status(200).json({ logo: null });
    } catch (err: any) {
      console.error("[API /api/logo GET Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to load logo" });
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

      const { logo } = body || {};
      if (logo && typeof logo === "string") {
        await fs.promises.writeFile(logoFile, logo, "utf8");
        return res.status(200).json({ success: true, message: "Logo updated successfully" });
      } else {
        if (fs.existsSync(logoFile)) {
          await fs.promises.unlink(logoFile);
        }
        return res.status(200).json({ success: true, message: "Logo reset to default" });
      }
    } catch (err: any) {
      console.error("[API /api/logo POST Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to save logo" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
