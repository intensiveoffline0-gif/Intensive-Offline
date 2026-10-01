// api/logo.ts
import * as fs2 from "fs";

// api/zohoSyncCore.ts
import * as fs from "fs";
import * as path from "path";
function getFilePath(fileName) {
  const cwdPath = path.join(process.cwd(), fileName);
  if (process.env.VERCEL) {
    const tmpPath = path.join("/tmp", fileName);
    if (fs.existsSync(tmpPath)) return tmpPath;
    if (fs.existsSync(cwdPath)) {
      try {
        fs.copyFileSync(cwdPath, tmpPath);
        return tmpPath;
      } catch (_) {
      }
    }
    return tmpPath;
  }
  return cwdPath;
}

// api/logo.ts
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  const logoFile = getFilePath("custom_logo.txt");
  if (req.method === "GET") {
    try {
      if (fs2.existsSync(logoFile)) {
        const logo = await fs2.promises.readFile(logoFile, "utf8");
        return res.status(200).json({ logo });
      }
      return res.status(200).json({ logo: null });
    } catch (err) {
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
        } catch (_) {
        }
      }
      const { logo } = body || {};
      if (logo && typeof logo === "string") {
        await fs2.promises.writeFile(logoFile, logo, "utf8");
        return res.status(200).json({ success: true, message: "Logo updated successfully" });
      } else {
        if (fs2.existsSync(logoFile)) {
          await fs2.promises.unlink(logoFile);
        }
        return res.status(200).json({ success: true, message: "Logo reset to default" });
      }
    } catch (err) {
      console.error("[API /api/logo POST Error]:", err);
      return res.status(500).json({ error: err.message || "Failed to save logo" });
    }
  }
  return res.status(405).json({ error: "Method Not Allowed" });
}
export {
  handler as default
};
