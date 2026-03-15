import { env } from "../config/env";

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


export function getOTPExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + env.OTP_EXPIRY_MINUTES);
  return expiry;
}

export function isOTPExpired(expiry: Date | null): boolean {
  if (!expiry) return true;
  return new Date() > expiry;
}
