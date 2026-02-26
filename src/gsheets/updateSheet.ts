import log4js from "log4js";
import { getSheetsClient } from "./client.js";

const logger = log4js.getLogger("gsheets");
logger.level = "info";

/**
 * Очищает лист и записывает заголовок + строки данных.
 *
 * @param spreadsheetId — ID таблицы Google Sheets
 * @param sheetName     — имя листа (вкладки)
 * @param headers       — массив заголовков первой строки
 * @param rows          — двумерный массив значений
 */
export async function updateSheet(
    spreadsheetId: string,
    sheetName: string,
    headers: string[],
    rows: (string | number | null)[][],
): Promise<void> {
    const sheets = getSheetsClient();
    const range = `${sheetName}`;

    logger.info({
        message: "Clearing sheet",
        spreadsheetId,
        sheetName,
    });

    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
    });

    const values = [headers, ...rows];

    logger.info({
        message: "Writing sheet",
        spreadsheetId,
        sheetName,
        headerCount: headers.length,
        rowCount: rows.length,
    });

    const result = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "RAW",
        requestBody: { values },
    });

    logger.info({
        message: "Sheet updated",
        spreadsheetId,
        sheetName,
        updatedCells: result.data.updatedCells,
        updatedRows: result.data.updatedRows,
    });
}
