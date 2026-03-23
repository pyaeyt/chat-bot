import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
  return transporter;
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.MAIL_FROM?.trim());
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  resetToken: string;
  appUrl?: string;
}): Promise<void> {
  const from = process.env.MAIL_FROM?.trim();
  const t = getTransporter();
  if (!t || !from) return;

  const base = opts.appUrl?.replace(/\/$/, "") || "http://localhost:5173";
  const link = `${base}/?reset=${encodeURIComponent(opts.resetToken)}`;

  await t.sendMail({
    from,
    to: opts.to,
    subject: "Reset your campus assistant password",
    text: `Use this link to reset your password (valid 1 hour):\n${link}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Reset your password (link valid 1 hour):</p><p><a href="${escapeHtml(link)}">${escapeHtml(
      link
    )}</a></p><p>If you did not request this, you can ignore this email.</p>`,
  });
}

export async function sendNewStudentMessageEmail(opts: {
  to: string;
  professorName: string;
  studentName: string;
  subject: string;
  bodyPreview: string;
  appUrl?: string;
}): Promise<void> {
  const from = process.env.MAIL_FROM?.trim();
  const t = getTransporter();
  if (!t || !from) return;

  const preview =
    opts.bodyPreview.length > 400 ? `${opts.bodyPreview.slice(0, 400)}…` : opts.bodyPreview;

  const html = `
    <p>Hello ${escapeHtml(opts.professorName)},</p>
    <p><strong>${escapeHtml(opts.studentName)}</strong> sent you a message in the campus assistant.</p>
    <p><strong>Subject:</strong> ${escapeHtml(opts.subject)}</p>
    <blockquote style="border-left:3px solid #ccc;padding-left:12px;margin:12px 0;">${escapeHtml(
      preview
    )}</blockquote>
    ${opts.appUrl ? `<p><a href="${escapeHtml(opts.appUrl)}">Open the app</a> to reply.</p>` : ""}
  `;

  await t.sendMail({
    from,
    to: opts.to,
    subject: `[Campus assistant] New message: ${opts.subject}`,
    text: `New message from ${opts.studentName}\nSubject: ${opts.subject}\n\n${preview}`,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
