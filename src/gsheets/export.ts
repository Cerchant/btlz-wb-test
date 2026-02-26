import knex from "#postgres/knex.js";
import env from "#config/env/env.js";
import log4js from "log4js";
import { updateSheet } from "./updateSheet.js";

const logger = log4js.getLogger("gsheets-export");
logger.level = "info";

const SHEET_HEADERS = [
    "date",
    "warehouse_name",
    "geo_name",
    "box_delivery_base",
    "box_delivery_coef_expr",
    "box_delivery_liter",
    "box_delivery_marketplace_base",
    "box_delivery_marketplace_coef_expr",
    "box_delivery_marketplace_liter",
    "box_storage_base",
    "box_storage_coef_expr",
    "box_storage_liter",
];

type TariffRow = Record<string, string | number | null>;

function tariffToRow(row: TariffRow): (string | number | null)[] {
    return SHEET_HEADERS.map((col) => row[col] ?? null);
}

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

async function fetchCurrentTariffs(date: string): Promise<TariffRow[]> {
    return knex("tariffs_box_daily")
        .select(SHEET_HEADERS)
        .where("date", date)
        .orderBy("box_delivery_coef_expr", "asc");
}

async function fetchArchiveTariffs(date: string): Promise<TariffRow[]> {
    const since = new Date(date);
    since.setDate(since.getDate() - env.ARCHIVE_DAYS);
    const sinceISO = since.toISOString().slice(0, 10);

    return knex("tariffs_box_daily")
        .select(SHEET_HEADERS)
        .where("date", ">=", sinceISO)
        .orderBy([
            { column: "date", order: "desc" },
            { column: "box_delivery_coef_expr", order: "asc" },
        ]);
}

async function getSpreadsheetIds(): Promise<string[]> {
    const rows: { spreadsheet_id: string }[] = await knex("spreadsheets").select("spreadsheet_id");
    return rows.map((r) => r.spreadsheet_id);
}

export async function googleSheetsExport(): Promise<void> {
    const date = todayISO();
    const start = performance.now();

    logger.info({ message: "Export started", date });

    const spreadsheetIds = await getSpreadsheetIds();
    if (spreadsheetIds.length === 0) {
        logger.warn("No spreadsheets found, skipping export");
        return;
    }

    const [currentRows, archiveRows] = await Promise.all([
        fetchCurrentTariffs(date),
        fetchArchiveTariffs(date),
    ]);

    logger.info({
        message: "Tariffs queried",
        date,
        currentCount: currentRows.length,
        archiveCount: archiveRows.length,
        archiveDays: env.ARCHIVE_DAYS,
    });

    const currentData = currentRows.map(tariffToRow);
    const archiveData = archiveRows.map(tariffToRow);

    for (const spreadsheetId of spreadsheetIds) {
        try {
            await updateSheet(spreadsheetId, "stocks_coefs", SHEET_HEADERS, currentData);
        } catch (err) {
            logger.error({
                message: "Failed to export current tariffs",
                spreadsheetId,
                error: String(err),
            });
        }

        try {
            await updateSheet(spreadsheetId, "stocks_coefs_archive", SHEET_HEADERS, archiveData);
        } catch (err) {
            logger.error({
                message: "Failed to export archive tariffs",
                spreadsheetId,
                error: String(err),
            });
        }
    }

    const durationMs = Math.round(performance.now() - start);
    logger.info({
        message: "Export completed",
        date,
        spreadsheets: spreadsheetIds.length,
        durationMs,
    });
}
