import { Router } from "express";

import {
  healthCheck,
  dbHealthCheck,
} from "../controllers/health.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const healthRoutes = Router();

healthRoutes.get("/", healthCheck);
healthRoutes.get("/db", asyncHandler(dbHealthCheck));
