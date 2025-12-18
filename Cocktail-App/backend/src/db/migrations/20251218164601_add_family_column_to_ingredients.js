/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // ingredients tablosuna 'family' sütunu ekliyoruz
  await knex.schema.table("ingredients", function (table) {
    table.string("family").nullable().index();
    // index() ekledik çünkü rehber modunda buraya çok sorgu atacağız, hızlı olsun.
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Geri almak istersek sütunu siler
  await knex.schema.table("ingredients", function (table) {
    table.dropColumn("family");
  });
};
