import { Router } from "express";

import {
  healthCheck,
  dbHealthCheck,
} from "../controllers/health.controller.js";

export const healthRoutes = Router();

healthRoutes.get("/", healthCheck);
healthRoutes.get("/db", dbHealthCheck);
