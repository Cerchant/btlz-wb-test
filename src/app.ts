import knex, { migrate, seed } from "#postgres/knex.js";
import env, { getSyncCron } from "#config/env/env.js";
import log4js from "log4js";
import cron from "node-cron";
import { createServer } from "node:http";
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

const port = env.APP_PORT ?? 3000;

const server = createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/health") {
        try {
            await knex.raw("SELECT 1");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "ok" }));
        } catch (err) {
            logger.error({ message: "Health check failed", error: String(err) });
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "error" }));
        }
        return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
});

server.listen(port, () => {
    logger.info({ message: "HTTP server listening", port });
});