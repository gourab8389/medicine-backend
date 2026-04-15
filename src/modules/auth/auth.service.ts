import { db } from "../../config/database";
import { LoginInput, RegisterUserInput } from "./auth.schema";
import { comparePassword, hashPassword } from "../../lib/hash";
import { generateOTP, getOTPExpiry, isOTPExpired } from "../../lib/otp";
import { otpEmailTemplate, sendEmail } from "../../lib/email";
import { generateTokenPair, verifyRefreshToken } from "../../lib/jwt";

export const AuthService = {
  async registerUser(data: RegisterUserInput) {
    const existingEmail = await db.user.findUnique({
      where: {
        email: data.email,
      },
    });
    if (existingEmail) throw new Error("Email already registered");

    const existingPhone = await db.user.findUnique({
      where: { phone: data.phone },
    });
    if (existingPhone) throw new Error("Phone number already registered");

    const hashedPassword = await hashPassword(data.password);
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        otpCode: otp,
        otpExpiry,
      },
      select: { id: true, email: true, name: true },
    });

    await sendEmail({
      to: data.email,
      subject: "Verify your email - MediStore",
      html: otpEmailTemplate(otp, "email verification"),
    });

    return user;
  },
  async verifyOtp(email: string, otp: string) {
    const user = await db.user.findUnique({
      where: { email },
    });
    if (!user) throw new Error("User not found");
    if (user.isVerified) throw new Error("User already verified");
    if (!user.otpCode || user.otpCode !== otp) throw new Error("Invalid OTP");
    if (isOTPExpired(user.otpExpiry)) throw new Error("OTP expired");

    const updated = await db.user.update({
      where: { email },
      data: { isVerified: true, otpCode: null, otpExpiry: null },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isVerified: true,
      },
    });

    const tokens = generateTokenPair({
      id: updated.id,
      role: "USER",
      email: updated.email,
    });
    return { user: updated, ...tokens };
  },

  async resendOtp(email: string) {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");
    if (user.isVerified) throw new Error("User already verified");

    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    await db.user.update({
      where: { email },
      data: { otpCode: otp, otpExpiry },
    });
    await sendEmail({
      to: email,
      subject: "Resend OTP - MediStore",
      html: otpEmailTemplate(otp, "email verification"),
    });
    return true;
  },

  async login(data: LoginInput) {
    const user = await db.user.findUnique({
      where: { email: data.email },
    });
    if (!user) throw new Error("Invalid email or password");
    if (!user.isVerified) throw new Error("Email not verified");
    if (user.status === "BLACKLISTED")
      throw new Error(
        "Your account has been blacklisted. Please contact support.",
      );

    const isValidPassword = await comparePassword(data.password, user.password);
    if (!isValidPassword) throw new Error("Invalid email or password");

    const tokens = generateTokenPair({
      id: user.id,
      role: "USER",
      email: user.email,
    });
    const { password: _, otpCode: __, otpExpiry: ___, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  },

  async refreshToken(token: string) {
    const decoded = verifyRefreshToken(token);
    if (decoded.role !== "USER") throw new Error("Invalid token");

    const user = await db.user.findUnique({
      where: { id: decoded.id },
    });
    if (!user) throw new Error("User not found");
    if (user.status === "BLACKLISTED")
      throw new Error(
        "Your account has been blacklisted. Please contact support.",
      );

    const tokens = generateTokenPair({
      id: user.id,
      role: "USER",
      email: user.email,
    });
    return tokens;
  },
};
