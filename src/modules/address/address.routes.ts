// src/modules/address/address.routes.ts
import { Router } from "express";
import { AddressController } from "./address.controller";
import { validate } from "../../middleware/validate";
import { authenticate, requireUser, checkBlacklist } from "../../middleware/auth";
import { createAddressSchema, updateAddressSchema } from "./address.schema";

const router = Router();

router.use(authenticate, requireUser, checkBlacklist);

router.post("/", validate(createAddressSchema), AddressController.create);
router.get("/", AddressController.getAll);
router.put("/:id", validate(updateAddressSchema), AddressController.update);
router.delete("/:id", AddressController.delete);

export default router;
