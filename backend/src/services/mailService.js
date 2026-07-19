import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logoPath = path.resolve(__dirname, "../../../logo.png");

function assertSmtpConfigured() {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.password || !env.smtp.from) {
    throw new Error("SMTP is not configured. Please set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM.");
  }
}

export async function sendPasswordResetOtp({ to, otp }) {
  assertSmtpConfigured();

  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.password
    }
  });

  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: "Cardiology Hospital Wazirabad - Password Reset OTP",
    text: `Cardiology Hospital Wazirabad Payroll System\n\nYour password reset OTP is ${otp}.\nThis OTP will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `
      <!doctype html>
      <html>
        <body style="margin:0;padding:0;background:#edf5f4;font-family:Arial,Helvetica,sans-serif;color:#17383c;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#edf5f4;padding:28px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border:1px solid #d8e4e2;border-radius:12px;overflow:hidden;box-shadow:0 18px 42px rgba(14,39,44,0.16);">
                  <tr>
                    <td style="background:#0f3d42;padding:24px 28px;text-align:center;">
                      <img src="cid:payroll-logo" width="78" height="78" alt="Cardiology Hospital Wazirabad" style="display:block;margin:0 auto 12px;border-radius:10px;background:#ffffff;padding:6px;object-fit:contain;" />
                      <div style="color:#d9f3ee;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Cardiology Hospital Wazirabad</div>
                      <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;line-height:1.25;">Payroll Password Reset</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px;">
                      <p style="margin:0 0 14px;color:#315257;font-size:15px;line-height:1.6;">Use this one-time password to reset your Payroll System login password.</p>
                      <div style="margin:20px 0;padding:18px;border:1px dashed #0b746b;border-radius:10px;background:#effaf7;text-align:center;">
                        <div style="margin:0 0 8px;color:#607478;font-size:12px;font-weight:800;text-transform:uppercase;">Your OTP Code</div>
                        <div style="color:#0b746b;font-size:36px;font-weight:900;letter-spacing:8px;line-height:1;">${otp}</div>
                      </div>
                      <p style="margin:0;color:#5c6f73;font-size:14px;line-height:1.6;">This OTP will expire in <strong>10 minutes</strong>. If you did not request this reset, you can ignore this email.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 28px;background:#f7fbfa;border-top:1px solid #e2ecea;color:#607478;font-size:12px;text-align:center;">
                      Wazirabad Cardiology Hospital Payroll System
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    attachments: [
      {
        filename: "logo.png",
        path: logoPath,
        cid: "payroll-logo"
      }
    ]
  });
}
