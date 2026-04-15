import { db } from "../../config/database";
import {
  RegisterSellerInput,
  SellerLoginInput,
  SetSellerPasswordInput,
  UpdateSellerProfileInput,
} from "./seller.schema";
import { generateOTP, getOTPExpiry, isOTPExpired } from "../../lib/otp";
import { otpEmailTemplate, sendEmail } from "../../lib/email";
import { comparePassword, hashPassword } from "../../lib/hash";
import { generateTokenPair, verifyRefreshToken } from "../../lib/jwt";

const SELLER_SAFE_SELECT = {
  id: true,
  email: true,
  phone: true,
  businessName: true,
  ownerName: true,
  panCardNumber: true,
  panCardImageUrl: true,
  gstNumber: true,
  addressLine: true,
  city: true,
  state: true,
  pincode: true,
  bankAccountName: true,
  bankAccountNumber: true,
  bankIfscCode: true,
  isVerified: true,
  status: true,
  expectedDeliveryDays: true,
  createdAt: true,
  updatedAt: true,
};

export const SellerService = {
  async register(data: RegisterSellerInput) {
    const existingEmail = await db.seller.findUnique({
      where: {
        email: data.email,
      },
    });
    if (existingEmail) throw new Error("Email already registered");

    const existingPhone = await db.seller.findUnique({
      where: {
        phone: data.phone,
      },
    });
    if (existingPhone) throw new Error("Phone number already registered");

    const existingPan = await db.seller.findUnique({
      where: {
        panCardNumber: data.panCardNumber,
      },
    });
    if (existingPan) throw new Error("PAN card number already registered");

    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    const seller = await db.seller.create({
      data: {
        ...data,
        otpCode: otp,
        otpExpiry,
      },
      select: {
        id: true,
        email: true,
        businessName: true,
      },
    });

    await sendEmail({
      to: data.email,
      subject: "Verify your email - MediStore Seller",
      html: otpEmailTemplate(otp, "seller registration"),
    });

    return seller;
  },

  async verifyOtp(email: string, otp: string) {
    const seller = await db.seller.findUnique({
      where: { email },
    });
    if (!seller) throw new Error("Seller not found");
    if (seller.isVerified) throw new Error("Seller already verified");

    if (!seller.otpCode || seller.otpCode !== otp)
      throw new Error("Invalid OTP");
    if (isOTPExpired(seller.otpExpiry))
      throw new Error("OTP expired. Please request a new one.");

    await db.seller.update({
      where: { email },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiry: null,
      },
    });

    return true;
  },

  async setPassword(data: SetSellerPasswordInput) {
    const seller = await db.seller.findUnique({
      where: { email: data.email },
    });
    if (!seller) throw new Error("Seller not found");
    if (!seller.isVerified) throw new Error("Seller not verified");
    if (seller.password) throw new Error("Password already set. Please login.");

    const hashed = await hashPassword(data.password);
    await db.seller.update({
      where: { email: data.email },
      data: {
        password: hashed,
      },
    });
    return true;
  },

  async resendOtp(email: string) {
    const seller = await db.seller.findUnique({ where: { email } });
    if (!seller) throw new Error("Seller not found");
    if (seller.isVerified) throw new Error("Email already verified");

    const otp = generateOTP();
    await db.seller.update({
      where: { email },
      data: { otpCode: otp, otpExpiry: getOTPExpiry() },
    });
    await sendEmail({
      to: email,
      subject: "New OTP - MediStore Seller",
      html: otpEmailTemplate(otp, "seller registration"),
    });
    return true;
  },

  async login(data: SellerLoginInput) {
    const seller = await db.seller.findUnique({
      where: { email: data.email },
    });
    if (!seller) throw new Error("Seller not found");
    if (!seller.isVerified) throw new Error("Seller not verified");
    if (!seller.password)
      throw new Error("Password not set. Please set your password.");
    if (seller.status === "BLACKLISTED")
      throw new Error(
        "Your account has been blacklisted. Please contact support.",
      );
    if (seller.status === "PENDING")
      throw new Error(
        "Your account is pending approval. Please wait for confirmation.",
      );
    if (seller.status === "REJECTED")
      throw new Error(
        "Your account registration was rejected. Please contact support.",
      );

    const isValid = await comparePassword(data.password, seller.password);
    if (!isValid) throw new Error("Invalid password");

    const tokens = generateTokenPair({
      id: seller.id,
      role: "SELLER",
      email: seller.email,
    });
    const { password: _, otpCode: __, otpExpiry: ___, ...safeSeller } = seller;
    return { seller: safeSeller, ...tokens };
  },

  async refreshToken(token: string) {
    const decoded = await verifyRefreshToken(token);
    if (!decoded) throw new Error("Invalid refresh token");
    if (decoded.role !== "SELLER") throw new Error("Invalid token");

    const seller = await db.seller.findUnique({
      where: {
        id: decoded.id,
      },
    });
    if (!seller) throw new Error("Seller not found");
    if (seller.status === "BLACKLISTED")
      throw new Error(
        "Your account has been blacklisted. Please contact support.",
      );

    return generateTokenPair({
      id: seller.id,
      role: "SELLER",
      email: seller.email,
    });
  },

  async getProfile(sellerId: string) {
    const seller = await db.seller.findUnique({
      where: { id: sellerId },
      select: {
        ...SELLER_SAFE_SELECT,
        subscription: { select: { status: true, endDate: true } },
        wallet: { select: { balance: true } },
        _count: { select: { products: true, orderItems: true, ratings: true } },
      },
    });
    if (!seller) throw new Error("Seller not found");
    return seller;
  },

    async updateProfile(sellerId: string, data: UpdateSellerProfileInput) {
    const seller = await db.seller.update({
      where: { id: sellerId },
      data,
      select: SELLER_SAFE_SELECT,
    });
    return seller;
  },
};
