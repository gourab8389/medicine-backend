import { db } from "../config/database";
import { AppSettings } from "../types";

export async function getAppSettings(): Promise<AppSettings> {
  const settings = await db.appSetting.findMany();
  const map: Record<string, string> = {};
  settings.forEach((s) => (map[s.key] = s.value));

  return {
    GST_PERCENTAGE: Number(map.GST_PERCENTAGE ?? 6),
    DELIVERY_CHARGE: Number(map.DELIVERY_CHARGE ?? 50),
    FREE_DELIVERY_ABOVE: Number(map.FREE_DELIVERY_ABOVE ?? 500),
    MONTHLY_SUBSCRIPTION_AMOUNT: Number(map.MONTHLY_SUBSCRIPTION_AMOUNT ?? 999),
    SELLER_WITHDRAW_MINIMUM: Number(map.SELLER_WITHDRAW_MINIMUM ?? 1000),
  };
}

export function calculateOrderAmounts(
  subtotal: number,
  settings: AppSettings
): { deliveryCharge: number; gstAmount: number; totalAmount: number } {
  const deliveryCharge = subtotal >= settings.FREE_DELIVERY_ABOVE ? 0 : settings.DELIVERY_CHARGE;
  const gstAmount = ((subtotal + deliveryCharge) * settings.GST_PERCENTAGE) / 100;
  const totalAmount = subtotal + deliveryCharge + gstAmount;
  return { deliveryCharge, gstAmount, totalAmount };
}
