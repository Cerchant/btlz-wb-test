import { google, sheets_v4 } from "googleapis";
import env from "#config/env/env.js";
import log4js from "log4js";

const logger = log4js.getLogger("gsheets");
logger.level = "info";

let sheetsInstance: sheets_v4.Sheets | null = null;

export function getSheetsClient(): sheets_v4.Sheets {
    if (sheetsInstance) return sheetsInstance;

    const creds = env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const auth = new google.auth.JWT(
        creds.client_email as string,
        undefined,
        creds.private_key as string,
        ["https://www.googleapis.com/auth/spreadsheets"],
    );

    sheetsInstance = google.sheets({ version: "v4", auth });

    logger.info({
        message: "Google Sheets client initialized",
        clientEmail: creds.client_email,
    });

    return sheetsInstance;
}
