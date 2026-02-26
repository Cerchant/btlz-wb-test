import { readFileSync } from "node:fs";
import { google, sheets_v4 } from "googleapis";
import env from "#config/env/env.js";
import log4js from "log4js";

const logger = log4js.getLogger("gsheets");
logger.level = "info";

interface ServiceAccountKey {
    client_email: string;
    private_key: string;
}

function loadServiceAccountKey(): ServiceAccountKey {
    const raw = readFileSync(env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH, "utf-8");
    const parsed = JSON.parse(raw) as ServiceAccountKey;

    if (!parsed.client_email || !parsed.private_key) {
        throw new Error(
            `Invalid service account key at ${env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH}: ` +
                "missing client_email or private_key",
        );
    }

    return parsed;
}

let sheetsInstance: sheets_v4.Sheets | null = null;

export function getSheetsClient(): sheets_v4.Sheets {
    if (sheetsInstance) return sheetsInstance;

    const creds = loadServiceAccountKey();
    const auth = new google.auth.JWT(
        creds.client_email,
        undefined,
        creds.private_key,
        ["https://www.googleapis.com/auth/spreadsheets"],
    );

    sheetsInstance = google.sheets({ version: "v4", auth });

    logger.info({
        message: "Google Sheets client initialized",
        credentialsPath: env.GOOGLE_SERVICE_ACCOUNT_JSON_PATH,
        clientEmail: creds.client_email,
    });

    return sheetsInstance;
}
