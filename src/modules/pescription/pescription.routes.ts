import { authenticate, checkBlacklist, requireUser } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { Router, Response, NextFunction } from "express";
import { uploadPrescriptionSchema } from "./pescription.schema";
import { AuthRequest } from "../../types";
import { db } from "../../config/database";
import { createdResponse, notFoundResponse, successResponse } from "../../lib/response";

const router = Router();

router.use(authenticate, requireUser, checkBlacklist);

// Upload a prescription
router.post(
  "/",
  validate(uploadPrescriptionSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const pescription = await db.prescription.create({
        data: {
          userId: req.user!.id,
          imageUrl: req.body.imageUrl,
        },
      });
      createdResponse(res, "Prescription uploaded successfully", pescription);
    } catch (error) {
      next(error);
    }
  },
);

// Get all prescriptions for the authenticated user
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const pescription = await db.prescription.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    successResponse(res, "Prescriptions retrieved successfully", pescription);
  } catch (error) {
    next(error);
  }
});

// Get a specific prescription by ID
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
