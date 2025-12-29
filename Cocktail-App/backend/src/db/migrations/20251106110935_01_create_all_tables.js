/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. IMPORTANCE LEVELS
  await knex.schema.createTable("importance_levels", (table) => {
    table.increments("level_id").primary();
    // JSONB: { "en": "Required", "tr": "Gerekli" ... }
    table.jsonb("level_name").notNullable();
    table.string("color_code");
  });

  // 2. INGREDIENT CATEGORIES
  await knex.schema.createTable("ingredient_categories", (table) => {
    table.increments("category_id").primary();
    // JSONB: { "en": "Spirits", "tr": "Ana İçkiler" ... }
    table.jsonb("category_name").notNullable();
    table.jsonb("parent_category_name"); // Opsiyonel
  });

  // 3. USERS
  await knex.schema.createTable("users", (table) => {
    table.increments("user_id").primary();
    table.string("firebase_uid").notNullable().unique();
    table.string("email").notNullable().unique();
    table.boolean("is_pro").defaultTo(false);
    table.timestamps(true, true);
  });

  // 4. COCKTAILS (Çok Dilli Ana Tablo)
  await knex.schema.createTable("cocktails", (table) => {
    table.increments("cocktail_id").primary();
    table.string("api_id").unique();

    // --- EVRENSEL ALANLAR (JSONB) ---
    table.jsonb("name").notNullable(); // { "en": "Mojito", "tr": "Mojito" }
    table.jsonb("instructions").notNullable(); // { "en": "Mix...", "tr": "Karıştır..." }
    table.jsonb("glass_type"); // { "en": "Highball", "tr": "Highball bardağı" }
    table.jsonb("tags"); // { "en": ["Sour"], "tr": ["Ekşi"] }
    table.jsonb("history_notes");

    // --- ORTAK ALANLAR ---
    table.boolean("is_alcoholic").defaultTo(true);
    table.string("image_url"); // Resim URL'i evrenseldir
  });

  // 5. INGREDIENTS
  await knex.schema.createTable("ingredients", (table) => {
    table.increments("ingredient_id").primary();
    // { "en": "Lime", "tr": "Misket Limonu" }
    table.jsonb("name").notNullable();

    table
      .integer("category_id")
      .unsigned()
      .references("category_id")
      .inTable("ingredient_categories")
      .onDelete("SET NULL");
  });

  // 6. USER PROFILES
  await knex.schema.createTable("user_profiles", (table) => {
    table.increments("profile_id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("username").unique();
    table.string("profile_image_url");
  });

  // 7. COCKTAIL REQUIREMENTS
  await knex.schema.createTable("cocktail_requirements", (table) => {
    table.increments("requirement_id").primary();

    // Miktar: { "en": "2 oz", "tr": "6 cl" }
    table.jsonb("amount").notNullable();

    table
      .integer("cocktail_id")
      .unsigned()
      .notNullable()
      .references("cocktail_id")
      .inTable("cocktails")
      .onDelete("CASCADE");
    table
      .integer("ingredient_id")
      .unsigned()
      .notNullable()
      .references("ingredient_id")
      .inTable("ingredients")
      .onDelete("CASCADE");
    table
      .integer("level_id")
      .unsigned()
      .notNullable()
      .references("level_id")
      .inTable("importance_levels");
  });

  // 8. RECIPE ALTERNATIVES
  await knex.schema.createTable("recipe_alternatives", (table) => {
    table.increments("alternative_id").primary();

    table
      .integer("alternative_ingredient_id")
      .unsigned()
      .notNullable()
      .references("ingredient_id")
      .inTable("ingredients");

    table.jsonb("alternative_amount").notNullable();

    table
      .integer("cocktail_id")
      .unsigned()
      .notNullable()
      .references("cocktail_id")
      .inTable("cocktails")
      .onDelete("CASCADE");

    table
      .integer("original_ingredient_id")
      .unsigned()
      .references("ingredient_id")
      .inTable("ingredients");
  });

  // 9. BARMENS CORNER
  await knex.schema.createTable("barmens_corner_posts", (table) => {
    table.increments("post_id").primary();
    table.string("image_url").notNullable();
    table.text("caption");
    table.timestamps(true, true);

    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE");

    table
      .integer("cocktail_id")
      .unsigned()
      .references("cocktail_id")
      .inTable("cocktails")
      .onDelete("SET NULL");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("barmens_corner_posts");
  await knex.schema.dropTableIfExists("recipe_alternatives");
  await knex.schema.dropTableIfExists("cocktail_requirements");
  await knex.schema.dropTableIfExists("user_profiles");
  await knex.schema.dropTableIfExists("cocktails");
  await knex.schema.dropTableIfExists("ingredients");
  await knex.schema.dropTableIfExists("user_profiles"); // Tekrar kontrol
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("ingredient_categories");
  await knex.schema.dropTableIfExists("importance_levels");
};
