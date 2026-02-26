/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.alterTable("tariffs_box_daily", (table) => {
        table.index(["date"], "idx_tariffs_box_daily_date");
        table.index(
            ["date", "box_delivery_coef_expr"],
            "idx_tariffs_box_daily_date_coef",
        );
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.alterTable("tariffs_box_daily", (table) => {
        table.dropIndex([], "idx_tariffs_box_daily_date_coef");
        table.dropIndex([], "idx_tariffs_box_daily_date");
    });
}
