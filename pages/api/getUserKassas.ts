import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from "../../lib/supabase";
import { requireAuth } from "../../lib/authMiddleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user, authorized } = await requireAuth(req, res);
  if (!authorized || !user) return;

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("kassa")
      .select("*")
      .eq("uid", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user kassas:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ kassas: data });
  } catch (error) {
    console.error("Get user kassas error:", error);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
