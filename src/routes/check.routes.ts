import { Router } from "express";

import {
  createTextCheckController,
  getChecksController,
} from "../controllers/check.controller.js";
import {
  validateBody,
  validateQuery,
} from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createTextCheckSchema,
  getChecksQuerySchema,
} from "../validators/check.validator.js";

export const checkRoutes = Router();

checkRoutes.post(
  "/",
  validateBody(createTextCheckSchema),
  asyncHandler(createTextCheckController),
);
checkRoutes.get(
  "/",
  validateQuery(getChecksQuerySchema),
  asyncHandler(getChecksController),
);
