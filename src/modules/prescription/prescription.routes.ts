import { Router } from "express";
import { authenticate, requireUser, checkBlacklist } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { uploadPrescriptionSchema } from "./prescription.schema";
import { db } from "../../config/database";
import { createdResponse, successResponse, notFoundResponse } from "../../lib/response";
import { AuthRequest } from "../../types";
import { Response, NextFunction } from "express";

const router = Router();

router.use(authenticate, requireUser, checkBlacklist);

// Upload prescription (just save the URL from uploadthing)
router.post("/", validate(uploadPrescriptionSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prescription = await db.prescription.create({
      data: { userId: req.user!.id, imageUrl: req.body.imageUrl },
    });
    createdResponse(res, "Prescription uploaded", prescription);
  } catch (error) { next(error); }
});

// Get user's prescriptions
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prescriptions = await db.prescription.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    successResponse(res, "Prescriptions fetched", prescriptions);
  } catch (error) { next(error); }
});

// Get single prescription
router.get("/:id", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const prescription = await db.prescription.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
    });
    if (!prescription) { notFoundResponse(res, "Prescription not found"); return; }
    successResponse(res, "Prescription fetched", prescription);
  } catch (error) { next(error); }
});

export default router;
