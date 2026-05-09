import express from "express";

import { healthRoutes } from "./routes/health.routes.js";

export const app = express();

app.use(express.json());

app.use("/health", healthRoutes);
