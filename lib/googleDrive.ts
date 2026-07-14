import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";

export function isGoogleDriveEnabled(): boolean {
  return process.env.GOOGLE_DRIVE_ENABLED === "true";
}

// Full drive scope is required: the app needs to see and write inside a folder
// that was created and shared by a human (not created by the service account),
// which the narrower `drive.file` scope would not grant access to.
const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"];

// A Google service account has no personal "My Drive" storage quota, so every
// upload must land inside a folder that has been shared with the service
// account. That folder's ID is configured per-environment (dev vs prod).
function getRootFolderId(): string | null {
  return process.env.GOOGLE_DRIVE_FOLDER_ID || null;
}

let cachedDrive: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (cachedDrive) return cachedDrive;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Private keys are stored in env as a single line with literal "\n"
  // sequences; turn those back into real newlines before use.
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (!email || !privateKey) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
    );
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: DRIVE_SCOPES,
  });

  cachedDrive = google.drive({ version: "v3", auth });
  return cachedDrive;
}

// Escape a value for use inside a Drive query string literal.
function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

// Remove characters that are awkward in file/folder names and collapse
// whitespace. Keeps the name readable while avoiding path-like characters.
function sanitizeName(value: string): string {
  return (
    value
      .replace(/[\/\\:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .trim() || "onbekend"
  );
}

// Return true if a file with the exact name already exists in the folder.
async function fileNameExists(
  drive: drive_v3.Drive,
  name: string,
  folderId: string,
): Promise<boolean> {
  const q = [
    `name = '${escapeQueryValue(name)}'`,
    `'${escapeQueryValue(folderId)}' in parents`,
    "trashed = false",
  ].join(" and ");

  const res = await drive.files.list({
    q,
    fields: "files(id)",
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return (res.data.files?.length ?? 0) > 0;
}

// Produce a name that does not yet exist in the folder, appending _1, _2, ...
// before the extension when needed.
async function getUniqueFileName(
  drive: drive_v3.Drive,
  baseName: string,
  extension: string,
  folderId: string,
): Promise<string> {
  const ext = extension ? `.${extension.replace(/^\.+/, "")}` : "";

  let candidate = `${baseName}${ext}`;
  let counter = 1;
  while (await fileNameExists(drive, candidate, folderId)) {
    candidate = `${baseName}_${counter}${ext}`;
    counter += 1;
  }
  return candidate;
}

export interface DriveUploadMetadata {
  /** ISO-ish date string (yyyy-mm-dd). */
  date: string;
  /** Bill category (Dutch: "post"). */
  category: string;
  /** Bill subcategory (Dutch: "activity"). */
  subcategory: string;
  /** File extension without the dot, e.g. "pdf" or "jpg". */
  extension?: string;
  /** MIME type of the file, used for the Drive upload. */
  contentType?: string;
}

/**
 * Upload a ticket file straight into the shared Drive folder
 * (`GOOGLE_DRIVE_FOLDER_ID`) with the name
 * `yyyy_mm_dd_category_subcategory.ext` (suffixed with _1, _2, ... on
 * collision). Returns the created file's ID, or null when the integration is
 * disabled or not fully configured.
 */
export async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  metadata: DriveUploadMetadata,
): Promise<string | null> {
  if (!isGoogleDriveEnabled()) {
    console.log("[Google Drive] Skipping upload: Google Drive is not enabled");
    return null;
  }

  if (
    !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  ) {
    console.warn(
      "[Google Drive] Missing required environment variables (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)",
    );
    return null;
  }

  const rootFolderId = getRootFolderId();
  if (!rootFolderId) {
    console.warn(
      "[Google Drive] Missing GOOGLE_DRIVE_FOLDER_ID (the shared folder the service account uploads into)",
    );
    return null;
  }

  try {
    const drive = getDriveClient();

    const category = sanitizeName(metadata.category);
    const subcategory = sanitizeName(metadata.subcategory);

    // Upload straight into the shared folder — no subfolder tree.
    const dateForName = metadata.date.replace(/-/g, "_");
    const baseName = `${dateForName}_${category}_${subcategory}`;
    const fileName = await getUniqueFileName(
      drive,
      baseName,
      metadata.extension || "",
      rootFolderId,
    );

    const created = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [rootFolderId],
      },
      media: {
        mimeType: metadata.contentType || "application/octet-stream",
        body: Readable.from(fileBuffer),
      },
      fields: "id",
      supportsAllDrives: true,
    });

    if (!created.data.id) {
      console.warn("[Google Drive] Upload returned no file ID");
      return null;
    }

    console.log(
      `[Google Drive] Uploaded "${fileName}" (id: ${created.data.id})`,
    );
    return created.data.id;
  } catch (error: any) {
    console.error("[Google Drive] Upload failed:", error?.message || error);
    return null;
  }
}
