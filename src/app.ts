import knex, { migrate, seed } from "#postgres/knex.js";
import env, { getSyncCron } from "#config/env/env.js";
import log4js from "log4js";
import cron from "node-cron";
import { wbTariffsIngest } from "#wb/ingest.js";
import { googleSheetsExport } from "#gsheets/export.js";

const logger = log4js.getLogger("app");
logger.level = "info";

await migrate.latest();
logger.info("Migrations applied");

if (env.NODE_ENV === "development") {
    await seed.run();
    logger.info("Seeds executed (development mode)");
}

const cronExpr = getSyncCron();

cron.schedule(cronExpr, async () => {
    try {
        await wbTariffsIngest();
    } catch (err) {
        logger.error({ message: "Ingest job failed", error: String(err) });
    }

    try {
        await googleSheetsExport();
    } catch (err) {
        logger.error({ message: "Export job failed", error: String(err) });
    }
});

logger.info({
    message: "Application started",
    nodeEnv: env.NODE_ENV ?? "undefined",
    syncFrequency: env.SYNC_FREQUENCY,
    syncCron: cronExpr,
});