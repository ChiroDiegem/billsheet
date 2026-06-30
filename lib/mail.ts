export function isGoogleSmtpEnabled(): boolean {
  return process.env.GOOGLE_SMTP_ENABLED === 'true';
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: { filename: string; content: Buffer }[];
}): Promise<boolean> {
  if (isGoogleSmtpEnabled()) {
    // TODO: Implement Google SMTP sending with nodemailer.
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
    // await transporter.sendMail({
    //   from: process.env.GOOGLE_SMTP_FROM,
    //   to: options.to,
    //   subject: options.subject,
    //   text: options.text,
    //   html: options.html,
    //   attachments: options.attachments?.map(a => ({
    //     filename: a.filename,
    //     content: a.content,
    //   })),
    // });
    console.log('[Mail] Google SMTP would send email to:', options.to);
    return true;
  }

  return false;
}
