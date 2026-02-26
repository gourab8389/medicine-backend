import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || "admin@medicinestore.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "Admin@123456";
  const hashed = await bcrypt.hash(password, 12);

  const admin = await prisma.superAdmin.upsert({
    where: { email },
    update: {},
    create: { email, password: hashed, name: "Super Admin" },
  });

  // Default app settings
  const settings = [
    { key: "GST_PERCENTAGE", value: "6" },
    { key: "DELIVERY_CHARGE", value: "50" },
    { key: "FREE_DELIVERY_ABOVE", value: "500" },
    { key: "MONTHLY_SUBSCRIPTION_AMOUNT", value: "999" },
    { key: "SELLER_WITHDRAW_MINIMUM", value: "1000" },
  ];

  for (const setting of settings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(`✅ Super admin seeded: ${admin.email}`);
  console.log(`✅ App settings seeded`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());