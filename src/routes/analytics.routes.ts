import { Router } from "express";

import { getAnalyticsSummaryController } from "../controllers/analytics.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const analyticsRoutes = Router();

analyticsRoutes.get("/summary", asyncHandler(getAnalyticsSummaryController));
