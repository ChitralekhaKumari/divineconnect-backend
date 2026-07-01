const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

function otpEmailHtml(name, otp, type) {
    const isReset = type === 'reset';
    const title = isReset ? 'Reset Your Password' : 'Verify Your Email';
    const subtitle = isReset ? 'Use the OTP below to reset your DivineConnect password.' : 'Use the OTP below to verify your DivineConnect account.';
    const footer = isReset ? "If you didn't request a password reset, you can safely ignore this email." : "If you didn't create an account, you can safely ignore this email.";

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf3e8;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf3e8;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2d1a0e,#5c3317);padding:32px;text-align:center;">
            <p style="margin:0;font-size:28px;">🕉️</p>
            <h1 style="margin:8px 0 0;color:#f9bb5c;font-size:22px;font-family:Georgia,serif;letter-spacing:1px;">DivineConnect</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:12px;">Your Sacred Digital Sanctuary</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 8px;color:#2d1a0e;font-size:22px;font-family:Georgia,serif;">${title}</h2>
            <p style="margin:0 0 24px;color:#6b5b4d;font-size:14px;line-height:1.6;">
              Namaste ${name}! 🙏<br>${subtitle}
            </p>
            <!-- OTP Box -->
            <div style="background:#fff8f0;border:2px dashed #e07c0a;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
              <p style="margin:0 0 8px;color:#6b5b4d;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Your OTP</p>
              <p style="margin:0;color:#e07c0a;font-size:40px;font-weight:800;letter-spacing:12px;font-family:monospace;">${otp}</p>
              <p style="margin:12px 0 0;color:#9c8672;font-size:12px;">⏱ Valid for 10 minutes</p>
            </div>
            <p style="margin:0 0 8px;color:#9c8672;font-size:12px;line-height:1.6;">${footer}</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#fdfaf5;border-top:1px solid #edd9b3;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#9c8672;font-size:11px;">© 2026 DivineConnect · Made with 🙏 in India</p>
            <p style="margin:4px 0 0;color:#9c8672;font-size:11px;">namaste@divineconnect.in</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendOtpEmail(email, name, otp, type) {
    const subject = type === 'verify'
        ? '🕉️ DivineConnect – Verify Your Email'
        : '🕉️ DivineConnect – Password Reset OTP';

    await transporter.sendMail({
        from: `"DivineConnect" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        html: otpEmailHtml(name, otp, type),
    });
}

module.exports = { sendOtpEmail };
