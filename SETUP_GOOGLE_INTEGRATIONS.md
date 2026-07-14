# Google Drive & Google SMTP Setup

This project has groundwork laid for two Google integrations. They're **disabled by default** and won't affect anything until you explicitly turn them on.

## Google Drive (auto-upload ticket files)

When enabled, ticket files (PDFs/images) are automatically uploaded to Google Drive after being saved in Supabase storage.

### How to enable

1. Set up a Google Cloud project and enable the Google Drive API
2. Create a service account and download the JSON key
3. Create a target Google Drive folder and **share it with the service account
   email** (Editor access). A service account has no Drive storage of its own,
   so all uploads must go into a folder that has been shared with it. Use a
   **different folder (and typically a different service account) for
   development vs production.**
4. Copy the shared folder's ID from its URL
   (`https://drive.google.com/drive/folders/<THIS_IS_THE_ID>`).
5. Add these environment variables:

```
GOOGLE_DRIVE_ENABLED=true
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=your-shared-folder-id
```

> The private key is stored on a single line with literal `\n` sequences; the
> code converts those back into real newlines at runtime.

### How it works

The upload is implemented in `lib/googleDrive.ts` (`uploadToGoogleDrive`) and
exposed through the `POST /api/uploadBillToDrive` endpoint. After a bill is
saved client-side, `components/Form.tsx` sends a background (fire-and-forget)
request to that endpoint, which:

1. Authenticates as the service account (JWT).
2. Downloads the just-uploaded file from Supabase storage (`bill_images`).
3. Uploads the file straight into the shared folder (`GOOGLE_DRIVE_FOLDER_ID`),
   de-duplicating the name as needed.
4. On success, stores the Drive file ID on the bill row (`bills.drive_file_id`)
   so the UI can show upload status.

Background upload failures are logged server-side and never block the user's
submission. In the admin bills view, each row has a Drive button (green =
uploaded, red = not uploaded / failed) that an admin can click to re-upload.

### File naming scheme

Files are uploaded as: `yyyy_mm_dd_categorie_subcategorie.ext` with `_1`, `_2` etc. for duplicates.

## Google SMTP (send emails via Google Workspace)

When enabled, all bill emails are sent through Google's SMTP servers instead of Resend.

### How to enable

1. Make sure your Google Workspace account has SMTP access enabled
2. Generate an app password (if using 2FA) or use your regular password
3. Add these environment variables:

```
GOOGLE_SMTP_ENABLED=true
GOOGLE_SMTP_HOST=smtp.gmail.com
GOOGLE_SMTP_PORT=587
GOOGLE_SMTP_USER=your@chirodiegem.be
GOOGLE_SMTP_PASS=your-app-password
GOOGLE_SMTP_FROM=your@chirodiegem.be
```

### What still needs code work

Open `lib/mail.ts` and uncomment/implement the TODO block (uses nodemailer — install with `npm install nodemailer`):

```
// const nodemailer = require('nodemailer');
// const transporter = nodemailer.createTransport({
//   host: process.env.GOOGLE_SMTP_HOST || 'smtp.gmail.com',
//   port: parseInt(process.env.GOOGLE_SMTP_PORT || '587'),
//   secure: false,
//   auth: {
//     user: process.env.GOOGLE_SMTP_USER,
//     pass: process.env.GOOGLE_SMTP_PASS,
//   },
// });
```

### Fallback behavior

When `GOOGLE_SMTP_ENABLED` is not `true`, the app falls back to the existing Resend-based email sending — so you can enable/disable without breaking anything.
