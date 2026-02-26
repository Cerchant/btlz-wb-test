import knex from "#postgres/knex.js";
import log4js from "log4js";
import { fetchTariffsBox } from "./client.js";
import { parseRuNumber } from "#utils/parseRuNumber.js";
import type { WbBoxWarehouse } from "./types.js";

const logger = log4js.getLogger("wb-ingest");
logger.level = "info";

function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}

function mapWarehouseRow(date: string, wh: WbBoxWarehouse) {
    return {
        date,
        warehouse_name: wh.warehouseName,
        geo_name: wh.geoName ?? null,
        box_delivery_base: parseRuNumber(wh.boxDeliveryBase),
        box_delivery_coef_expr: parseRuNumber(wh.boxDeliveryAndStorageExpr),
        box_delivery_liter: parseRuNumber(wh.boxDeliveryLiter),
        box_delivery_marketplace_base: parseRuNumber(wh.boxDeliveryMarketplaceBase),
        box_delivery_marketplace_coef_expr: parseRuNumber(wh.boxDeliveryMarketplaceCoefExpr),
        box_delivery_marketplace_liter: parseRuNumber(wh.boxDeliveryMarketplaceLiter),
        box_storage_base: parseRuNumber(wh.boxStorageBase),
        box_storage_coef_expr: parseRuNumber(wh.boxStorageCoefExpr),
        box_storage_liter: parseRuNumber(wh.boxStorageLiter),
        raw: JSON.stringify(wh),
        fetched_at: knex.fn.now(),
    };
}

const UPSERT_MERGE_COLUMNS = [
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
    "raw",
    "fetched_at",
] as const;

export async function wbTariffsIngest(): Promise<void> {
    const date = todayISO();
    const start = performance.now();

    logger.info({ message: "Ingest started", date });

    let response;
    try {
        response = await fetchTariffsBox(date);
    } catch (err) {
        const durationMs = Math.round(performance.now() - start);
        logger.error({
            message: "Ingest failed at fetch stage",
            date,
            durationMs,
            error: String(err),
        });
        throw err;
    }

    const { dtNextBox, dtTillMax, warehouseList } = response.response.data;
    const rows = warehouseList.map((wh) => mapWarehouseRow(date, wh));

    logger.debug({
        message: "WB tariff metadata",
        date,
        dtNextBox,
        dtTillMax,
        warehousesReceived: warehouseList.length,
    });

    if (rows.length === 0) {
        logger.warn({ message: "No warehouses returned, skipping upsert", date });
        return;
    }

    await knex("tariffs_box_daily")
        .insert(rows)
        .onConflict(["date", "warehouse_name"])
        .merge([...UPSERT_MERGE_COLUMNS]);

    const durationMs = Math.round(performance.now() - start);

    logger.info({
        message: "Ingest completed",
        date,
        rowsCount: rows.length,
        durationMs,
        dtNextBox,
    });
}
