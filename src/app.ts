import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import { corsOptions } from "./config/cors";
import compression from "compression";
import { env } from "./config/env";
import morgan from "morgan";
import { logger } from "./config/logger";
import { generalLimiter } from "./config/rateLimit";

import apiRoutes from "./routes/index";
import { globalErrorHandler, notFoundHandler } from "./middleware/errorHandler";

const app: Application = express();

// security middleware

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);
app.use(cors(corsOptions));

// general middleware

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// request logging middleware

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    }),
  );
}

// rate limiting middleware

app.use("/api", generalLimiter);

// api routes

app.use("/api/v1", apiRoutes);

// 404 handler
app.use(notFoundHandler);

// global error handler

app.use(globalErrorHandler);

export default app;
