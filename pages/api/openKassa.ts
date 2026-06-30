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
    const { category, sub_category, opening_amount, opening_total } = req.body;

    if (!category || !sub_category) {
      return res.status(400).json({ error: "Categorie en subcategorie zijn verplicht" });
    }

    if (opening_amount === undefined || opening_total === undefined) {
      return res.status(400).json({ error: "Openingsbedrag is verplicht" });
    }

    const { data, error } = await supabase
      .from("kassa")
      .insert({
        uid: user.id,
        opened_by: user.name || "",
        category,
        sub_category,
        opening_amount,
        opening_total: Number(opening_total),
        is_open: true,
        booked: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Open kassa error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: "OK", data });
  } catch (error) {
    console.error("Open kassa error:", error);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
