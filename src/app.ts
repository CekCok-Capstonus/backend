import express from "express";
import cors from "cors";

import { healthRoutes } from "./routes/health.routes.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { checkRoutes } from "./routes/check.routes.js";
import { analyticsRoutes } from "./routes/analytics.routes.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api/checks", checkRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
