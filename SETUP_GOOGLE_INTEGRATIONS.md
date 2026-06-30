# Google Drive & Google SMTP Setup

This project has groundwork laid for two Google integrations. They're **disabled by default** and won't affect anything until you explicitly turn them on.

## Google Drive (auto-upload ticket files)

When enabled, ticket files (PDFs/images) are automatically uploaded to Google Drive after being saved in Supabase storage.

### How to enable

1. Set up a Google Cloud project and enable the Google Drive API
2. Create a service account and download the JSON key
3. Share your target Google Drive folder with the service account email
4. Add these environment variables:

```
GOOGLE_DRIVE_ENABLED=true
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### What still needs code work

Open `lib/googleDrive.ts` and uncomment/implement the TODO block:

```
// TODO: Implement actual Google Drive API upload.
// 1. Initialize Google Auth with service account.
// 2. Create Google Drive client.
// 3. Check/create folder structure: Billsheet/{year}/{category}/{subcategory}.
// 4. Upload file with name: {date}_{category}_{subcategory}.pdf.
// 5. Return the file ID or public URL.
```

You'll need to install `googleapis` (`npm install googleapis`).

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
