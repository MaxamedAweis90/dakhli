import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { ENV } from '../config/env';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Singleton Nodemailer Transporter
 */
const transporter: Transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_SECURE,
  auth:
    ENV.SMTP_USER && ENV.SMTP_PASS
      ? {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASS,
        }
      : undefined,
});

/**
 * Verify transporter operational status on server boot without blocking startup
 */
export const verifyTransport = async (): Promise<boolean> => {
  if (!ENV.SMTP_USER || !ENV.SMTP_PASS) {
    console.log(
      `[EmailService] SMTP credentials not set (running in development mode). Emails will be dispatched to console.`
    );
    return false;
  }

  try {
    await transporter.verify();
    console.log(
      `[EmailService] Nodemailer SMTP transport verified successfully (${ENV.SMTP_HOST}:${ENV.SMTP_PORT}).`
    );
    return true;
  } catch (error: any) {
    console.warn(
      `[EmailService] Nodemailer transport verification warning: ${error.message}`
    );
    return false;
  }
};

/**
 * Base Email Layout Generator adhering to Dakhli Obsidian Theme
 * Canvas: #0D0E12 | Card: #13151B | Accent: #1A1D26 | Text: #EDEDED / #94A3B8
 */
export const renderEmailLayout = (
  contentHtml: string,
  previewText: string
): string => {
  const timestamp = new Date().toISOString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${previewText}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0D0E12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #EDEDED;">
  <!-- Hidden preheader preview text -->
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #0D0E12; opacity: 0;">
    ${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0D0E12; width: 100%; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 48px 16px;">
        <!-- Card Container (Max Width 560px) -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; width: 100%; background-color: #13151B; border: 1px solid #232735; border-radius: 8px; border-collapse: separate; overflow: hidden; text-align: left;">
          
          <!-- Header: Brand Mark -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #232735; background-color: #13151B;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="color: #94A3B8; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600;">
                      DAKHLI // PERSONAL FINANCE OS
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Injected Body Content -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer: Monospace Security Notice & Timestamp -->
          <tr>
            <td style="padding: 20px 32px 24px 32px; border-top: 1px solid #232735; background-color: #101217;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color: #64748B; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; line-height: 16px;">
                    <div>This is an automated system dispatch from your Dakhli instance. Do not reply to this email.</div>
                    <div style="margin-top: 4px; color: #475569;">Timestamp: ${timestamp}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Format Date to standard UTC display string
 */
const formatUtcDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return (
    d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }) + ' 00:00 UTC'
  );
};

/**
 * Core Send Method with Graceful Fallback
 */
export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  const { to, subject, html, text } = options;

  // Development / Test mode console output when credentials are not configured
  if (!ENV.SMTP_USER || !ENV.SMTP_PASS) {
    console.log(
      `\n================= [EmailService DEV DISPATCH] =================\n` +
        `To: ${to}\n` +
        `Subject: ${subject}\n` +
        `----------------- [Plain Text Payload] -----------------\n` +
        `${text}\n` +
        `===============================================================\n`
    );
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: ENV.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });

    console.log(
      `[EmailService] Email successfully dispatched to ${to} (MessageId: ${info.messageId})`
    );
    return true;
  } catch (error: any) {
    console.error(
      `[EmailService] Failed to send email to ${to}: ${error.message}`
    );

    // In development, also output to console so developer is not blocked
    if (ENV.NODE_ENV !== 'production') {
      console.log(
        `\n[EmailService FALLBACK DEV LOG for ${to}]:\n${text}\n`
      );
    }

    return false;
  }
};

/* ========================================================================= */
/* 5 TRANSACTIONAL EMAIL TEMPLATES                                           */
/* ========================================================================= */

/**
 * Template A: Verification OTP (VERIFY_OTP)
 * Trigger: Dispatched immediately upon local user registration or email update.
 */
export const sendVerificationOtp = async (
  email: string,
  name: string,
  otp: string
): Promise<boolean> => {
  const safeName = name?.trim() || 'User';
  const subject = `[Dakhli] Verify your email address — ${otp}`;
  const previewText = `Your Dakhli verification code is ${otp}`;
  const timestamp = new Date().toISOString();

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; color: #EDEDED; font-size: 20px; font-weight: 600; letter-spacing: -0.01em;">
      Verify your identity
    </h1>
    <p style="margin: 0 0 24px 0; color: #94A3B8; font-size: 14px; line-height: 22px;">
      Hello ${safeName},<br>
      Enter the following 6-digit verification code to activate your account and access your finance operating system. This code expires in 15 minutes.
    </p>

    <!-- Hero OTP Tile -->
    <div style="background-color: #1A1D26; border: 1px solid #2D3345; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #FFFFFF; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; line-height: 1;">
        ${otp}
      </div>
      <div style="margin-top: 10px; color: #64748B; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10.5px; letter-spacing: 0.05em; text-transform: uppercase;">
        EXPIRES IN 15 MINUTES
      </div>
    </div>

    <!-- Disclaimer -->
    <p style="margin: 24px 0 0 0; color: #64748B; font-size: 12px; line-height: 18px;">
      If you did not create a Dakhli account, no action is required. This registration request will automatically expire.
    </p>
  `;

  const text = `DAKHLI // PERSONAL FINANCE OS

Verify your identity

Hello ${safeName},
Enter the following 6-digit verification code to activate your account and access your finance operating system. This code expires in 15 minutes.

VERIFICATION CODE: ${otp}
(Expires in 15 minutes)

If you did not create a Dakhli account, no action is required. This registration request will automatically expire.

--
This is an automated system dispatch from your Dakhli instance. Do not reply to this email.
Timestamp: ${timestamp}`;

  const html = renderEmailLayout(contentHtml, previewText);
  return sendEmail({ to: email, subject, html, text });
};

/**
 * Template B: Password Reset OTP (RESET_PASSWORD_OTP)
 * Trigger: Dispatched when a user requests a password reset from /forgot-password.
 */
export const sendPasswordResetOtp = async (
  email: string,
  name: string,
  otp: string
): Promise<boolean> => {
  const safeName = name?.trim() || 'User';
  const subject = `[Dakhli] Password reset request — ${otp}`;
  const previewText = `Password reset authorization code: ${otp}`;
  const timestamp = new Date().toISOString();

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; color: #EDEDED; font-size: 20px; font-weight: 600; letter-spacing: -0.01em;">
      Reset your master password
    </h1>
    <p style="margin: 0 0 24px 0; color: #94A3B8; font-size: 14px; line-height: 22px;">
      Hello ${safeName},<br>
      A password reset was initiated for your Dakhli account. Use the authorization code below to complete the reset process.
    </p>

    <!-- Hero OTP Tile -->
    <div style="background-color: #1A1D26; border: 1px solid #2D3345; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #FFFFFF; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; line-height: 1;">
        ${otp}
      </div>
      <div style="margin-top: 10px; color: #64748B; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10.5px; letter-spacing: 0.05em; text-transform: uppercase;">
        EXPIRES IN 15 MINUTES
      </div>
    </div>

    <!-- Security Warning Notice -->
    <div style="background-color: #1A1D26; border-left: 3px solid #E5A855; padding: 12px 16px; border-radius: 4px; margin-top: 24px;">
      <p style="margin: 0; color: #94A3B8; font-size: 12px; line-height: 18px;">
        <strong style="color: #E5A855;">Security Notice:</strong> If you did not initiate this request, your account credentials may be compromised. Change your password immediately or contact support.
      </p>
    </div>
  `;

  const text = `DAKHLI // PERSONAL FINANCE OS

Reset your master password

Hello ${safeName},
A password reset was initiated for your Dakhli account. Use the authorization code below to complete the reset process.

RESET AUTHORIZATION CODE: ${otp}
(Expires in 15 minutes)

Security Notice: If you did not initiate this request, your account credentials may be compromised. Change your password immediately or contact support.

--
This is an automated system dispatch from your Dakhli instance. Do not reply to this email.
Timestamp: ${timestamp}`;

  const html = renderEmailLayout(contentHtml, previewText);
  return sendEmail({ to: email, subject, html, text });
};

/**
 * Template C: Welcome & Account Active (WELCOME)
 * Trigger: Dispatched immediately after successful OTP verification or first-time Google OAuth provisioning.
 */
export const sendWelcomeEmail = async (
  email: string,
  name: string
): Promise<boolean> => {
  const safeName = name?.trim() || 'User';
  const subject = `Welcome to Dakhli // Your private financial command center`;
  const previewText = `Your account has been verified. Welcome to Dakhli OS.`;
  const dashboardUrl = `${ENV.CLIENT_URL}/dashboard`;
  const timestamp = new Date().toISOString();

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; color: #EDEDED; font-size: 20px; font-weight: 600; letter-spacing: -0.01em;">
      Operating system online
    </h1>
    <p style="margin: 0 0 24px 0; color: #94A3B8; font-size: 14px; line-height: 22px;">
      Hello ${safeName},<br>
      Your account has been verified. Dakhli is configured for private, deliberate personal finance management with zero tracking overhead.
    </p>

    <!-- Architectural Checklist -->
    <div style="background-color: #1A1D26; border: 1px solid #2D3345; border-radius: 6px; padding: 18px 20px; margin: 24px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; line-height: 24px; color: #CBD5E1;">
      <div style="color: #10B981;">[x] Baseline income &amp; liquidity configured</div>
      <div style="color: #10B981;">[x] Recurring overhead billing ledger active</div>
      <div style="color: #10B981;">[x] Daily discretionary check-off engine initialized</div>
    </div>

    <!-- Action Button -->
    <div style="margin-top: 28px;">
      <a href="${dashboardUrl}" style="background-color: #FFFFFF; color: #0D0E12; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; font-weight: 600; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
        ACCESS COMMAND CENTER &rarr;
      </a>
    </div>
  `;

  const text = `DAKHLI // PERSONAL FINANCE OS

Operating system online

Hello ${safeName},
Your account has been verified. Dakhli is configured for private, deliberate personal finance management with zero tracking overhead.

ARCHITECTURAL CHECKLIST:
[x] Baseline income & liquidity configured
[x] Recurring overhead billing ledger active
[x] Daily discretionary check-off engine initialized

Access your command center: ${dashboardUrl}

--
This is an automated system dispatch from your Dakhli instance. Do not reply to this email.
Timestamp: ${timestamp}`;

  const html = renderEmailLayout(contentHtml, previewText);
  return sendEmail({ to: email, subject, html, text });
};

/**
 * Template D: Account Deactivation Notice (ACCOUNT_DEACTIVATED)
 * Trigger: Dispatched when a user executes "Deactivate Account" in Profile Settings.
 */
export const sendDeactivationNotice = async (
  email: string,
  name: string,
  deletionScheduledAt: Date
): Promise<boolean> => {
  const safeName = name?.trim() || 'User';
  const deletionFormatted = formatUtcDate(deletionScheduledAt);
  const subject = `[Dakhli Notice] Your account has been deactivated (30-day recovery active)`;
  const previewText = `Your account has been deactivated. 30-day recovery active until ${deletionFormatted}.`;
  const timestamp = new Date().toISOString();

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; color: #EDEDED; font-size: 20px; font-weight: 600; letter-spacing: -0.01em;">
      Account deactivated
    </h1>
    <p style="margin: 0 0 24px 0; color: #94A3B8; font-size: 14px; line-height: 22px;">
      Hello ${safeName},<br>
      Your Dakhli account has entered the 30-day deactivation grace period as requested.
    </p>

    <!-- Key Parameters Block -->
    <div style="background-color: #1A1D26; border: 1px solid #2D3345; border-radius: 6px; padding: 18px 20px; margin: 24px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; line-height: 24px; color: #CBD5E1;">
      <div><span style="color: #94A3B8;">Status:</span> <span style="color: #F87171; font-weight: 600;">DEACTIVATED</span></div>
      <div><span style="color: #94A3B8;">Permanent Deletion Date:</span> <span style="color: #EDEDED; font-weight: 600;">${deletionFormatted}</span></div>
      <div><span style="color: #94A3B8;">Recurring Overhead:</span> <span style="color: #EDEDED;">FROZEN (No bills will be flagged overdue)</span></div>
      <div><span style="color: #94A3B8;">Savings Deductions:</span> <span style="color: #EDEDED;">PAUSED (No phantom cuts will accrue)</span></div>
    </div>

    <!-- Recovery Instructions -->
    <p style="margin: 20px 0 0 0; color: #94A3B8; font-size: 13px; line-height: 20px;">
      To restore your account and resume normal tracking, simply log back into Dakhli with your credentials anytime before <span style="color: #EDEDED; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${deletionFormatted}</span>.
    </p>
  `;

  const text = `DAKHLI // PERSONAL FINANCE OS

Account deactivated

Hello ${safeName},
Your Dakhli account has entered the 30-day deactivation grace period as requested.

KEY PARAMETERS:
- Status: DEACTIVATED
- Permanent Deletion Date: ${deletionFormatted}
- Recurring Overhead: FROZEN (No bills will be flagged overdue)
- Savings Deductions: PAUSED (No phantom cuts will accrue)

To restore your account and resume normal tracking, simply log back into Dakhli with your credentials anytime before ${deletionFormatted}.

--
This is an automated system dispatch from your Dakhli instance. Do not reply to this email.
Timestamp: ${timestamp}`;

  const html = renderEmailLayout(contentHtml, previewText);
  return sendEmail({ to: email, subject, html, text });
};

/**
 * Template E: Account Restored Confirmation (ACCOUNT_RESTORED)
 * Trigger: Dispatched when a deactivated user signs in and clicks "Restore Account" on the interception screen.
 */
export const sendRestorationNotice = async (
  email: string,
  name: string
): Promise<boolean> => {
  const safeName = name?.trim() || 'User';
  const subject = `[Dakhli] Account restored successfully`;
  const previewText = `Your Dakhli account has been restored and scheduled deletion cancelled.`;
  const dashboardUrl = `${ENV.CLIENT_URL}/dashboard`;
  const timestamp = new Date().toISOString();

  const contentHtml = `
    <h1 style="margin: 0 0 16px 0; color: #EDEDED; font-size: 20px; font-weight: 600; letter-spacing: -0.01em;">
      Account reactivated &amp; ledger reconciled
    </h1>
    <p style="margin: 0 0 24px 0; color: #94A3B8; font-size: 14px; line-height: 22px;">
      Hello ${safeName},<br>
      Welcome back. Your Dakhli account has been restored and scheduled deletion cancelled.
    </p>

    <!-- Reconciliation Notice -->
    <div style="background-color: #1A1D26; border: 1px solid #2D3345; border-radius: 6px; padding: 18px 20px; margin: 24px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; line-height: 24px; color: #CBD5E1;">
      <div>&bull; All dormant months during your absence have been marked as SKIPPED.</div>
      <div>&bull; Your baseline reserves, active savings buckets, and historical logs remain fully intact without penalty deductions.</div>
      <div>&bull; Your recurring overhead bills are scheduled for the current cycle.</div>
    </div>

    <!-- Action Button -->
    <div style="margin-top: 28px;">
      <a href="${dashboardUrl}" style="background-color: #FFFFFF; color: #0D0E12; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; font-weight: 600; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
        RETURN TO DASHBOARD &rarr;
      </a>
    </div>
  `;

  const text = `DAKHLI // PERSONAL FINANCE OS

Account reactivated & ledger reconciled

Hello ${safeName},
Welcome back. Your Dakhli account has been restored and scheduled deletion cancelled.

RECONCILIATION NOTICE:
- All dormant months during your absence have been marked as SKIPPED.
- Your baseline reserves, active savings buckets, and historical logs remain fully intact without penalty deductions.
- Your recurring overhead bills are scheduled for the current cycle.

Return to dashboard: ${dashboardUrl}

--
This is an automated system dispatch from your Dakhli instance. Do not reply to this email.
Timestamp: ${timestamp}`;

  const html = renderEmailLayout(contentHtml, previewText);
  return sendEmail({ to: email, subject, html, text });
};

/**
 * Exported Email Service Object matching required interface
 */
export const emailService = {
  verifyTransport,
  sendEmail,
  sendVerificationOtp,
  sendPasswordResetOtp,
  sendWelcomeEmail,
  sendDeactivationNotice,
  sendRestorationNotice,
};

export default emailService;

