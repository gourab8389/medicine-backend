import winston from "winston";
import { env } from "./env";

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(errors({ stack: true }), timestamp({ format: "YYYY-MM-DD HH:mm:ss" })),
  transports:
    env.NODE_ENV === "production"
      ? [
          new winston.transports.File({ filename: "logs/error.log", level: "error", format: json() }),
          new winston.transports.File({ filename: "logs/combined.log", format: json() }),
        ]
      : [
          new winston.transports.Console({
            format: combine(colorize({ all: true }), devFormat),
          }),
        ],
});