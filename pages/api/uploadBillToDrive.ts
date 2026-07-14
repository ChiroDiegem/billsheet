import { NextApiRequest, NextApiResponse } from "next";
import { createAdminClient } from "../../lib/supabase";
import { requireAuth } from "../../lib/authMiddleware";
import {
  isGoogleDriveEnabled,
  uploadToGoogleDrive,
} from "../../lib/googleDrive";

// Map common file extensions to MIME types for the Drive upload.
const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user, authorized } = await requireAuth(req, res);
  if (!authorized || !user) return;

  // Accept either a billId (admin re-upload) or the storage image path
  // (creation-time background upload). The image filename is a UUID and thus
  // unique per bill.
  const { billId, image } = req.body || {};
  if ((billId === undefined || billId === null) && !image) {
    return res
      .status(400)
      .json({ error: "Missing required field: billId or image" });
  }

  try {
    const supabase = createAdminClient();

    const lookup = supabase
      .from("bills")
      .select("id, uid, image, date, post, activity");
    const { data: bill, error: billError } = await (
      billId !== undefined && billId !== null
        ? lookup.eq("id", billId)
        : lookup.eq("image", image)
    ).single();

    if (billError || !bill) {
      return res.status(404).json({ error: "Bill not found" });
    }

    // Only the bill's owner or an admin (full or post-level) may trigger an
    // upload.
    const allowedPosts = user.allowed_posts
      ? user.allowed_posts.split(",").map((p) => p.trim()).filter(Boolean)
      : [];
    const isAdmin = Boolean(user.admin) || allowedPosts.length > 0;
    const isOwner = bill.uid === user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Nothing to do when the integration is off; report so the caller's
    // background request stays quiet.
    if (!isGoogleDriveEnabled()) {
      return res.status(200).json({ skipped: true });
    }

    if (!bill.image) {
      return res.status(400).json({ error: "Bill has no file to upload" });
    }

    const { data, error } = await supabase.storage
      .from("bill_images")
      .download(bill.image);

    if (error || !data) {
      console.error(
        "[Google Drive] Failed to download file from storage:",
        error?.message,
      );
      return res.status(404).json({ error: "File not found in storage" });
    }

    const fileBuffer = Buffer.from(await data.arrayBuffer());
    const extension = String(bill.image).split(".").at(-1)?.toLowerCase() || "";
    const contentType = CONTENT_TYPES[extension] || data.type || undefined;

    const fileId = await uploadToGoogleDrive(fileBuffer, {
      date: String(bill.date || ""),
      category: String(bill.post || ""),
      subcategory: String(bill.activity || ""),
      extension,
      contentType,
    });

    if (!fileId) {
      return res.status(500).json({ error: "Google Drive upload failed" });
    }

    // Persist the Drive file ID so the UI can show upload status.
    const { error: updateError } = await supabase
      .from("bills")
      .update({ drive_file_id: fileId })
      .eq("id", bill.id);

    if (updateError) {
      console.error(
        "[Google Drive] Failed to store drive_file_id:",
        updateError.message,
      );
      // The file did upload; surface success but note the tracking miss.
      return res.status(200).json({ fileId, tracked: false });
    }

    return res.status(200).json({ fileId, tracked: true });
  } catch (error: any) {
    console.error("[Google Drive] Upload endpoint error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Unexpected server error" });
  }
}
