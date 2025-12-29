/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table("users", (table) => {
    // avatar_id sütunu ekliyoruz.
    // integer olsun (1, 2, 3...).
    // defaultTo(1) -> Kullanıcı seçmezse otomatik 1. resim olsun.
    table.integer("avatar_id").defaultTo(1);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table("users", (table) => {
    // Geri alma işlemi (Rollback) için sütunu sil
    table.dropColumn("avatar_id");
  });
};
