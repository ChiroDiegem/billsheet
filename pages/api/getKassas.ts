import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from "../../lib/supabase";
import { requireAdmin } from "../../lib/authMiddleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { authorized } = await requireAdmin(req, res);
  if (!authorized) return;

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("kassa")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching kassas:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ kassas: data });
  } catch (error) {
    console.error("Get kassas error:", error);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
