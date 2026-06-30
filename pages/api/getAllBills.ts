import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from "../../lib/supabase";
import { requireAuth } from "../../lib/authMiddleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { user, authorized } = await requireAuth(req, res);
  if (!authorized) return;

  try {
    const supabase = createAdminClient();
    let query = supabase.from("bills").select("*");

    if (!user?.admin) {
      const allowedPosts = user?.allowed_posts
        ? user.allowed_posts.split(",").map((p) => p.trim()).filter(Boolean)
        : [];

      if (allowedPosts.includes("leiding")) {
        // Leiding post admins can see all bills.
      } else if (allowedPosts.length > 0) {
        query = query.in("post", allowedPosts);
      } else {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bills:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ bills: data });
  } catch (error) {
    console.error("Get all bills error:", error);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
