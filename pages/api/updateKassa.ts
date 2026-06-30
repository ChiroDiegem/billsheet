import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from "../../lib/supabase";
import { requireAdmin } from "../../lib/authMiddleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { authorized } = await requireAdmin(req, res);
  if (!authorized) return;

  try {
    const supabase = createAdminClient();
    const {
      id,
      opened_by,
      closed_by,
      category,
      sub_category,
      opening_amount,
      opening_total,
      closing_amount,
      closing_total,
      is_open,
      booked,
      closed_at,
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Kassa ID is verplicht" });
    }

    const updates = {
      ...(opened_by !== undefined && { opened_by }),
      ...(closed_by !== undefined && { closed_by }),
      ...(category !== undefined && { category }),
      ...(sub_category !== undefined && { sub_category }),
      ...(opening_amount !== undefined && { opening_amount }),
      ...(opening_total !== undefined && { opening_total }),
      ...(closing_amount !== undefined && { closing_amount }),
      ...(closing_total !== undefined && { closing_total }),
      ...(is_open !== undefined && { is_open }),
      ...(booked !== undefined && { booked }),
      ...(closed_at !== undefined && { closed_at }),
    };

    const { data, error } = await supabase
      .from("kassa")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update kassa error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "OK", data });
  } catch (error) {
    console.error("Update kassa error:", error);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
