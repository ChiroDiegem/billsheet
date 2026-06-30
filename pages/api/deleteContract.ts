import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from "../../lib/supabase";
import { requireAdmin } from "../../lib/authMiddleware";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { authorized } = await requireAdmin(req, res);
  if (!authorized) return;

  try {
    const supabase = createAdminClient();
    const contractId = req.query.id as string;

    if (!contractId) {
      return res.status(400).json({ error: "Contract ID is required" });
    }

    const { data: contract, error: fetchError } = await supabase
      .from("contracts")
      .select("file")
      .eq("id", contractId)
      .single();

    if (fetchError) {
      console.error("Fetch contract error:", fetchError);
      return res.status(404).json({ error: "Contract not found" });
    }

    if (contract?.file) {
      const { error: storageError } = await supabase.storage
        .from("bill_images")
        .remove([contract.file]);

      if (storageError) {
        console.error("Contract file deletion error:", storageError);
      }
    }

    const { error: deleteError } = await supabase
      .from("contracts")
      .delete()
      .eq("id", contractId);

    if (deleteError) {
      console.error("Delete contract error:", deleteError);
      return res.status(500).json({ error: deleteError.message });
    }

    return res
      .status(200)
      .json({ message: "Contract succesvol verwijderd" });
  } catch (error) {
    console.error("Delete contract error:", error);
    return res.status(500).json({ error: "Unexpected server error" });
  }
}
