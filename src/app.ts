import knex, { migrate, seed } from "#postgres/knex.js";
import env, { getSyncCron } from "#config/env/env.js";
import log4js from "log4js";
import cron from "node-cron";
import { wbTariffsIngest } from "#wb/ingest.js";

const logger = log4js.getLogger("app");
logger.level = "info";

await migrate.latest();
await seed.run();

logger.info({
    message: "Application started",
    syncFrequency: env.SYNC_FREQUENCY,
    syncCron: getSyncCron(),
});

logger.info("All migrations and seeds have been run");

const cronExpr = getSyncCron();

cron.schedule(cronExpr, () => {
    wbTariffsIngest().catch((err) => {
        logger.error({ message: "Ingest job failed", error: String(err) });
    });
});

logger.info({ message: "Ingest cron scheduled", cron: cronExpr });