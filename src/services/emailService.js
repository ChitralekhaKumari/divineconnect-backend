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

// ─── Calendar reminder emails ───────────────────────────────────────────────
const CLIENT_URL = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

function isEmailConfigured() {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function escapeHtml(v) {
    return String(v == null ? '' : v)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Shared shell so reminder emails match the OTP emails' look.
function reminderShell({ heading, intro, bodyHtml, ctaLabel, ctaUrl, footer }) {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf3e8;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf3e8;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#2d1a0e,#5c3317);padding:28px;text-align:center;">
            <p style="margin:0;font-size:26px;">🕉️</p>
            <h1 style="margin:8px 0 0;color:#f9bb5c;font-size:20px;font-family:Georgia,serif;letter-spacing:1px;">DivineConnect</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px;">
            <h2 style="margin:0 0 8px;color:#2d1a0e;font-size:22px;font-family:Georgia,serif;">${heading}</h2>
            <p style="margin:0 0 20px;color:#6b5b4d;font-size:14px;line-height:1.6;">${intro}</p>
            ${bodyHtml}
            <p style="margin:24px 0 0;text-align:center;">
              <a href="${ctaUrl}" style="display:inline-block;background:#e07c0a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:999px;">${ctaLabel}</a>
            </p>
            <p style="margin:20px 0 0;color:#9c8672;font-size:12px;line-height:1.6;">${footer}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fdfaf5;border-top:1px solid #edd9b3;padding:16px 36px;text-align:center;">
            <p style="margin:0;color:#9c8672;font-size:11px;">© DivineConnect · Made with 🙏 in India</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const TYPE_EMOJI = { event: '📅', task: '✅', meeting: '👥', birthday: '🎂', anniversary: '💞' };
const TYPE_LABEL = { event: 'Event', task: 'Task', meeting: 'Meeting', birthday: 'Birthday', anniversary: 'Anniversary' };

function detailRow(label, value) {
    if (!value) return '';
    return `<tr>
      <td style="padding:6px 0;color:#9c8672;font-size:12px;width:90px;vertical-align:top;">${label}</td>
      <td style="padding:6px 0;color:#2d1a0e;font-size:14px;font-weight:600;">${value}</td>
    </tr>`;
}

// ev: { title, event_type, whenLabel, location, description }
async function sendEventReminderEmail(to, name, ev) {
    const emoji = TYPE_EMOJI[ev.event_type] || '📅';
    const label = TYPE_LABEL[ev.event_type] || 'Event';
    const html = reminderShell({
        heading: `${emoji} ${escapeHtml(ev.title)}`,
        intro: `Namaste ${escapeHtml(name)}! 🙏 Here's your reminder for an upcoming ${label.toLowerCase()}.`,
        bodyHtml: `<div style="background:#fff8f0;border:1px solid #f5d9a0;border-radius:12px;padding:16px 20px;">
          <table cellpadding="0" cellspacing="0" width="100%">
            ${detailRow('Type', label)}
            ${detailRow('When', escapeHtml(ev.whenLabel))}
            ${detailRow('Where', escapeHtml(ev.location))}
            ${detailRow('Notes', escapeHtml(ev.description).replace(/\n/g, '<br>'))}
          </table></div>`,
        ctaLabel: 'Open Calendar',
        ctaUrl: `${CLIENT_URL()}/calendar`,
        footer: 'You are receiving this because you turned on an email reminder for this item in your DivineConnect calendar. Edit the event to change or remove the reminder.',
    });
    await transporter.sendMail({
        from: `"DivineConnect" <${process.env.SMTP_USER}>`,
        to,
        subject: `${emoji} Reminder: ${ev.title}`,
        html,
    });
}

// festivals: [{ name, dateLabel, description }]
async function sendFestivalReminderEmail(to, name, { traditionLabel, daysBefore, festivals }) {
    const when = daysBefore === 0 ? 'today' : daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`;
    const rows = festivals.map(f => `
      <div style="padding:10px 0;border-bottom:1px solid #f5e6c8;">
        <p style="margin:0;color:#2d1a0e;font-size:15px;font-weight:700;">🪔 ${escapeHtml(f.name)}</p>
        <p style="margin:2px 0 0;color:#c9882a;font-size:12px;font-weight:600;">${escapeHtml(f.dateLabel)}</p>
        ${f.description ? `<p style="margin:4px 0 0;color:#6b5b4d;font-size:13px;line-height:1.5;">${escapeHtml(f.description)}</p>` : ''}
      </div>`).join('');
    const first = festivals[0].name;
    const html = reminderShell({
        heading: festivals.length === 1 ? `🪔 ${escapeHtml(first)} is ${when}` : `🪔 ${festivals.length} festivals ${when}`,
        intro: `Namaste ${escapeHtml(name)}! 🙏 A gentle reminder from your ${escapeHtml(traditionLabel)} calendar.`,
        bodyHtml: `<div style="background:#fff8f0;border:1px solid #f5d9a0;border-radius:12px;padding:6px 20px;">${rows}</div>`,
        ctaLabel: 'View Calendar',
        ctaUrl: `${CLIENT_URL()}/calendar`,
        footer: 'You are receiving this because you set a festival reminder in your DivineConnect calendar. You can change or remove it any time from Quick Actions → Set Festival Reminders.',
    });
    await transporter.sendMail({
        from: `"DivineConnect" <${process.env.SMTP_USER}>`,
        to,
        subject: festivals.length === 1
            ? `🪔 Reminder: ${first} is ${when}`
            : `🪔 ${festivals.length} festivals ${when} — ${traditionLabel} calendar`,
        html,
    });
}

module.exports = { sendOtpEmail, sendEventReminderEmail, sendFestivalReminderEmail, isEmailConfigured };
