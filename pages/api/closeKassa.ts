import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from "../../lib/supabase";
import { requireAuth } from "../../lib/authMiddleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user, authorized } = await requireAuth(req, res);
  if (!authorized || !user) return;

  try {
    const supabase = createAdminClient();
    const { id, closing_amount, closing_total, closed_at } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Kassa ID is verplicht" });
    }

    if (closing_amount === undefined || closing_total === undefined) {
      return res.status(400).json({ error: "Sluitingsbedrag is verplicht" });
    }

    const { data, error } = await supabase
      .from("kassa")
      .update({
        closing_amount,
        closing_total: Number(closing_total),
        is_open: false,
        closed_by: user.name || "",
        closed_at: closed_at || new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Close kassa error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "OK", data });
  } catch (error) {
    console.error("Close kassa error:", error);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
