import { db } from "../../config/database";
import { CreateAddressInput, UpdateAddressInput } from "./address.schema";

const MAX_ADDRESSES = 3;

export const AddressService = {
  async create(userId: string, data: CreateAddressInput) {
    const count = await db.address.count({ where: { userId } });
    if (count >= MAX_ADDRESSES) throw new Error(`Maximum ${MAX_ADDRESSES} addresses allowed`);

    // If setting as default, unset others
    if (data.isDefault) {
      await db.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    return db.address.create({ data: { ...data, userId } });
  },

  async getByUser(userId: string) {
    return db.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  },

  async getById(addressId: string, userId: string) {
    return db.address.findFirst({ where: { id: addressId, userId } });
  },

  async update(addressId: string, userId: string, data: UpdateAddressInput) {
    const address = await db.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new Error("Address not found");

    if (data.isDefault) {
      await db.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    return db.address.update({ where: { id: addressId }, data });
  },

  async delete(addressId: string, userId: string) {
    const address = await db.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw new Error("Address not found");
    await db.address.delete({ where: { id: addressId } });
    return true;
  },
};
