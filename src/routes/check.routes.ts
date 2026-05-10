import { Router } from "express";

import {
  createTextCheckController,
  getCheckByIdController,
  getChecksController,
} from "../controllers/check.controller.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  checkIdParamSchema,
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

checkRoutes.get(
  "/:id",
  validateParams(checkIdParamSchema),
  asyncHandler(getCheckByIdController),
);
