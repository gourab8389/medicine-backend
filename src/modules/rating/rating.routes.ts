import { Router } from "express";
import { RatingController } from "./rating.controller";
import { validate } from "../../middleware/validate";
import { authenticate, requireUser, checkBlacklist } from "../../middleware/auth";
import { createRatingSchema } from "./rating.schema";

const router = Router();

router.post("/", authenticate, requireUser, checkBlacklist, validate(createRatingSchema), RatingController.create);
router.get("/seller/:sellerId", RatingController.getSellerRatings);

export default router;
