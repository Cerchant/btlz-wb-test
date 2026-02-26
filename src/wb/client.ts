import env from "#config/env/env.js";
import log4js from "log4js";
import type { WbTariffsBoxResponse } from "./types.js";

const logger = log4js.getLogger("wb-client");
logger.level = "info";

export class WbApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly body: string,
    ) {
        super(`WB API responded with ${status}`);
        this.name = "WbApiError";
    }
}

/**
 * Запрашивает тарифы box у WB API за указанную дату.
 * @param date — формат YYYY-MM-DD
 */
export async function fetchTariffsBox(
    date: string,
): Promise<WbTariffsBoxResponse> {
    const url = new URL(env.WB_TARIFFS_BOX_URL);
    url.searchParams.set("date", date);

    logger.info({ message: "Fetching tariffs box", date, url: url.toString() });

    const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Authorization: env.WB_API_TOKEN },
    });

    if (!res.ok) {
        const body = await res.text();

        if (res.status === 401) {
            logger.error({ message: "Unauthorized — check WB_API_TOKEN", status: res.status });
        } else if (res.status === 429) {
            logger.warn({ message: "Rate-limited by WB API", status: res.status });
        } else if (res.status >= 500) {
            logger.error({ message: "WB API server error", status: res.status, body });
        } else {
            logger.error({ message: "Unexpected WB API error", status: res.status, body });
        }

        throw new WbApiError(res.status, body);
    }

    const json: WbTariffsBoxResponse = await res.json();

    logger.info({
        message: "Tariffs box fetched",
        date,
        warehouses: json.response.data.warehouseList.length,
    });

    return json;
}
