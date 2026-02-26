import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const syncFrequencies = ["minutely", "hourly"] as const;
type SyncFrequency = (typeof syncFrequencies)[number];

const SYNC_CRON_MAP: Record<SyncFrequency, string> = {
    minutely: "*/1 * * * *",
    hourly: "0 * * * *",
};

const envSchema = z.object({
    NODE_ENV: z.union([z.undefined(), z.enum(["development", "production"])]),
    POSTGRES_HOST: z.union([z.undefined(), z.string()]),
    POSTGRES_PORT: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((value) => parseInt(value)),
    POSTGRES_DB: z.string(),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    APP_PORT: z.union([
        z.undefined(),
        z
            .string()
            .regex(/^[0-9]+$/)
            .transform((value) => parseInt(value)),
    ]),
    SYNC_FREQUENCY: z.enum(syncFrequencies),
});

const env = envSchema.parse({
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
    APP_PORT: process.env.APP_PORT,
    SYNC_FREQUENCY: process.env.SYNC_FREQUENCY,
});

export function getSyncCron(): string {
    return SYNC_CRON_MAP[env.SYNC_FREQUENCY];
}

export default env;
