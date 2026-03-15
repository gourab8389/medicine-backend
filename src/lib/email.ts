import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "../config/logger";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}:`, error);
    throw new Error("Failed to send email. Please try again.");
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export function otpEmailTemplate(otp: string, purpose: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2E86AB, #1A5276); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">💊 MediStore</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
        <p style="color: #555;">Your OTP for <strong>${purpose}</strong> is:</p>
        <div style="background: #2E86AB; color: white; font-size: 36px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #777; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          If you did not request this, please ignore this email or contact our support.
        </p>
      </div>
    </div>
  `;
}

export function sellerApprovalEmailTemplate(businessName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2E86AB, #1A5276); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">💊 MediStore</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #27AE60;">🎉 Congratulations! Your seller account has been approved.</h2>
        <p>Dear <strong>${businessName}</strong>,</p>
        <p>Your seller account on MediStore has been <strong>approved</strong> by our admin team.</p>
        <p>You can now log in and start listing your products.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
          Please ensure you subscribe to our monthly plan to keep selling.
        </p>
      </div>
    </div>
  `;
}

export function sellerRejectionEmailTemplate(businessName: string, reason?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #C0392B, #922B21); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">💊 MediStore</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #C0392B;">Seller Application Update</h2>
        <p>Dear <strong>${businessName}</strong>,</p>
        <p>Unfortunately, your seller application has been <strong>rejected</strong>.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>Please contact our support team if you believe this is an error.</p>
      </div>
    </div>
  `;
}

export function orderConfirmationEmailTemplate(orderCode: string, totalAmount: number): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2E86AB, #1A5276); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">💊 MediStore</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #27AE60;">✅ Order Confirmed!</h2>
        <p>Your order <strong>#${orderCode}</strong> has been confirmed.</p>
        <p>Total Amount: <strong>₹${totalAmount.toFixed(2)}</strong></p>
        <p>You will receive updates as your order is processed and shipped.</p>
      </div>
    </div>
  `;
}

export function withdrawApprovedEmailTemplate(amount: number): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2E86AB, #1A5276); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">💊 MediStore</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
        <h2 style="color: #27AE60;">💸 Withdrawal Approved!</h2>
        <p>Your withdrawal request of <strong>₹${amount.toFixed(2)}</strong> has been approved.</p>
        <p>The amount will be transferred to your registered bank account within 2-3 business days.</p>
      </div>
    </div>
  `;
}
