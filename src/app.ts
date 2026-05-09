import express from "express";

import { healthRoutes } from "./routes/health.routes.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

export const app = express();

app.use(express.json());

app.use("/health", healthRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
