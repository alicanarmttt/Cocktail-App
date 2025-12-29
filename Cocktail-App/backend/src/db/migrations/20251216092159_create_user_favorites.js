/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // USER FAVORITES (Kullanıcı Favorileri)
  await knex.schema.createTable("user_favorites", (table) => {
    table.increments("favorite_id").primary(); // Benzersiz ID

    // Hangi Kullanıcı?
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE"); // Kullanıcı silinirse favorileri de silinsin

    // Hangi Kokteyl?
    table
      .integer("cocktail_id")
      .unsigned()
      .notNullable()
      .references("cocktail_id")
      .inTable("cocktails")
      .onDelete("CASCADE"); // Kokteyl silinirse favorilerden de kalksın

    // Ne zaman eklendi?
    table.timestamp("created_at").defaultTo(knex.fn.now());

    // MÜKERRER KAYDI ÖNLEME:
    // Bir kullanıcı aynı kokteyli 2 kere favorileyemesin
    table.unique(["user_id", "cocktail_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("user_favorites");
};
