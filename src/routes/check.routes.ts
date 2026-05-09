import { Router } from "express";

import { createTextCheckController } from "../controllers/check.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createTextCheckSchema } from "../validators/check.validator.js";

export const checkRoutes = Router();

checkRoutes.post(
  "/",
  validateBody(createTextCheckSchema),
  asyncHandler(createTextCheckController),
);
