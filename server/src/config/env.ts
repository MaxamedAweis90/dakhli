import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Resolve root .env path across multiple execution and compile contexts
const envCandidates = [
  path.resolve(__dirname, "../../../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(process.cwd(), "../.env"),
  path.resolve(process.cwd(), ".env"),
];

const resolvedEnvPath = envCandidates.find((candidatePath) =>
  fs.existsSync(candidatePath),
);

if (resolvedEnvPath) {
  dotenv.config({ path: resolvedEnvPath });
} else {
  dotenv.config();
}

export interface EnvConfig {
  PORT: number;
  NODE_ENV: "development" | "production" | "test" | string;
  MONGODB_URI: string;
  JWT_SECRET: string;
  CLIENT_URL: string;
  JWT_EXPIRES_IN: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASS: string;
  EMAIL_FROM: string;
  BLOB_READ_WRITE_TOKEN?: string;
}

const criticalEnvKeys: Array<keyof EnvConfig> = ["MONGODB_URI", "JWT_SECRET"];

for (const key of criticalEnvKeys) {
  if (!process.env[key]) {
    throw new Error(
      `[Env] Fatal Configuration Error: Missing required environment variable "${key}".`,
    );
  }
}

export const ENV: EnvConfig = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  SMTP_SECURE:
    process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  EMAIL_FROM:
    process.env.EMAIL_FROM || '"Dakhli OS" <notifications@dakhli.app>',
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN || "",
};
