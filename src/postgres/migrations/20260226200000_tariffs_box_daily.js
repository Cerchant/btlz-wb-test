/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("tariffs_box_daily", (table) => {
        table.date("date").notNullable();
        table.text("warehouse_name").notNullable();
        table.text("geo_name");

        table.decimal("box_delivery_base");
        table.decimal("box_delivery_coef_expr");
        table.decimal("box_delivery_liter");

        table.decimal("box_delivery_marketplace_base");
        table.decimal("box_delivery_marketplace_coef_expr");
        table.decimal("box_delivery_marketplace_liter");

        table.decimal("box_storage_base");
        table.decimal("box_storage_coef_expr");
        table.decimal("box_storage_liter");

        table.jsonb("raw").notNullable();
        table
            .timestamp("fetched_at", { useTz: true })
            .notNullable()
            .defaultTo(knex.fn.now());

        table.unique(["date", "warehouse_name"]);
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("tariffs_box_daily");
}
