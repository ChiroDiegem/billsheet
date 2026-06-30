export function isGoogleDriveEnabled(): boolean {
  return process.env.GOOGLE_DRIVE_ENABLED === 'true';
}

export async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  metadata: { date: string; category: string; subcategory: string }
): Promise<string | null> {
  if (!isGoogleDriveEnabled()) {
    console.log('[Google Drive] Skipping upload: Google Drive is not enabled');
    return null;
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    console.warn('[Google Drive] Missing required environment variables (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)');
    return null;
  }

  // TODO: Implement actual Google Drive API upload.
  // 1. Initialize Google Auth with service account.
  // 2. Create Google Drive client.
  // 3. Check/create folder structure: Billsheet/{year}/{category}/{subcategory}.
  // 4. Upload file with name: {date}_{category}_{subcategory}.pdf.
  // 5. Return the file ID or public URL.
  console.log(`[Google Drive] Would upload file: ${metadata.date}_${metadata.category}_${metadata.subcategory}`);
  return null;
}
