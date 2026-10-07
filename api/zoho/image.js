function getValidImageContentType(buffer, defaultType = "image/jpeg") {
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xD8) return "image/jpeg";
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return "image/png";
  if (buffer.length >= 3 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return "image/gif";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (buffer.toString("utf8", 0, 100).includes("<svg")) return "image/svg+xml";
  return defaultType.startsWith("image/") ? defaultType : "image/jpeg";
}

export default async function handler(req, res) {
  try {
    const rawUrl = req.query.url;
    if (!rawUrl || !rawUrl.startsWith("https://creatorapp.zohopublic.in")) {
      return res.status(400).send("Invalid image URL");
    }

    const upstream = await fetch(rawUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      }
    });

    if (!upstream.ok) {
      return res.status(upstream.status).send("Failed to fetch image from Zoho");
    }

    const rawContentType = upstream.headers.get("content-type") || "image/jpeg";
    const arr = await upstream.arrayBuffer();
    const buffer = Buffer.from(arr);
    const contentType = getValidImageContentType(buffer, rawContentType.split(";")[0]);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    return res.send(buffer);
  } catch (err) {
    console.error("Zoho image proxy error:", err);
    return res.status(500).send("Internal server error proxying image");
  }
}
