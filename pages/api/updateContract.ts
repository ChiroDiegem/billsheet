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
      name,
      category,
      date,
      desc,
      security_deposit,
      rent,
      security_deposit_received,
      rent_received,
      deposit_returned,
      booked,
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Contract ID is required" });
    }

    const updates = {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(date !== undefined && { date }),
      ...(desc !== undefined && { desc }),
      ...(security_deposit !== undefined && { security_deposit }),
      ...(rent !== undefined && { rent }),
      ...(security_deposit_received !== undefined && {
        security_deposit_received,
      }),
      ...(rent_received !== undefined && { rent_received }),
      ...(deposit_returned !== undefined && { deposit_returned }),
      ...(booked !== undefined && { booked }),
    };

    const { error, data } = await supabase
      .from("contracts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update contract error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "OK", data });
  } catch (error) {
    console.error("Update contract error:", error);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
