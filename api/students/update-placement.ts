import { updateStudentPlacement } from "../zohoSyncCore.ts";

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

    const {
      studentId,
      placedOrganisation,
      externalPlacedOrganisation,
      placementType,
      placedMonth,
      ctcLpa,
    } = body || {};

    if (!studentId) {
      return res.status(400).json({ error: "Missing required parameter 'studentId'" });
    }

    const result = await updateStudentPlacement(studentId, {
      placedOrganisation,
      externalPlacedOrganisation,
      placementType,
      placedMonth,
      ctcLpa,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("[API /api/students/update-placement Error]:", error);
    return res.status(500).json({
      error: error.message || "Failed to update student placement details",
    });
  }
}
