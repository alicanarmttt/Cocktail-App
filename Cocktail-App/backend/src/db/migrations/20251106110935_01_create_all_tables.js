/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. IMPORTANCE LEVELS (Önem Seviyeleri - Çevirili)
  await knex.schema.createTable("importance_levels", (table) => {
    table.increments("level_id").primary();
    table.string("level_name_tr").notNullable(); // 'Gerekli'
    table.string("level_name_en").notNullable(); // 'Required'
    table.string("color_code");
  });

  // 2. INGREDIENT CATEGORIES (Malzeme Kategorileri - Çevirili)
  await knex.schema.createTable("ingredient_categories", (table) => {
    table.increments("category_id").primary();
    // Türkçe
    table.string("category_name_tr").notNullable(); // 'Alkol'
    table.string("parent_category_name_tr");
    // İngilizce
    table.string("category_name_en").notNullable(); // 'Alcohol'
    table.string("parent_category_name_en");
  });

  // 3. USERS (Kullanıcılar - Değişmedi, email evrenseldir)
  await knex.schema.createTable("users", (table) => {
    table.increments("user_id").primary();
    table.string("firebase_uid").notNullable().unique();
    table.string("email").notNullable().unique();
    table.boolean("is_pro").defaultTo(false);
    table.timestamps(true, true);
  });

  // 4. COCKTAILS (Kokteyller - Çevirili)
  await knex.schema.createTable("cocktails", (table) => {
    table.increments("cocktail_id").primary();
    table.string("api_id").unique();

    // --- TÜRKÇE ALANLAR ---
    table.string("name_tr").notNullable();
    table.text("instructions_tr").notNullable();
    table.string("glass_type_tr"); // 'Yüksek bardak'
    table.text("tags_tr"); // 'Ekşi,Yaz,Parti'
    table.text("history_notes_tr");

    // --- İNGİLİZCE ALANLAR ---
    table.string("name_en").notNullable();
    table.text("instructions_en").notNullable();
    table.string("glass_type_en"); // 'Highball glass'
    table.text("tags_en"); // 'Sour,Summer,Party'
    table.text("history_notes_en");

    // --- ORTAK ALANLAR ---
    table.boolean("is_alcoholic").defaultTo(true);
    table.string("image_url");
  });

  // 5. INGREDIENTS (Malzemeler - Çevirili)
  await knex.schema.createTable("ingredients", (table) => {
    table.increments("ingredient_id").primary();

    table.string("name_tr").notNullable(); // 'Misket Limonu'
    table.string("name_en").notNullable(); // 'Lime'

    // Benzersizlik kontrolü: Artık tek başına name değil, tr ve en kombinasyonu veya ayrı ayrı unique olabilir.
    // Genelde api'den gelen unique name_en olur ama biz ikisine de index atabiliriz.
    // table.unique('name_en');

    table
      .integer("category_id")
      .unsigned()
      .references("category_id")
      .inTable("ingredient_categories")
      .onDelete("SET NULL");
  });

  // 6. USER PROFILES (Değişmedi)
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

  // 7. COCKTAIL REQUIREMENTS (Gereksinimler - Miktar Çevirili)
  await knex.schema.createTable("cocktail_requirements", (table) => {
    table.increments("requirement_id").primary();

    // Miktar metin olduğu için çevrilmeli (örn: "Juice of 1" vs "1 adet suyu")
    table.string("amount_tr").notNullable();
    table.string("amount_en").notNullable();

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

  // 8. RECIPE ALTERNATIVES (Alternatifler - Miktar Çevirili)
  await knex.schema.createTable("recipe_alternatives", (table) => {
    table.increments("alternative_id").primary();

    table
      .integer("alternative_ingredient_id")
      .unsigned()
      .notNullable()
      .references("ingredient_id")
      .inTable("ingredients");

    // Alternatif miktarı da dilli olmalı
    table.string("alternative_amount_tr").notNullable();
    table.string("alternative_amount_en").notNullable();

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

  // 9. BARMENS CORNER (Kullanıcı İçeriği - Çevrilmez)
  // Not: Kullanıcı gönderileri genelde orijinal dilinde kalır.
  await knex.schema.createTable("barmens_corner_posts", (table) => {
    table.increments("post_id").primary();
    table.string("image_url").notNullable();
    table.text("caption"); // Kullanıcının yazdığı dil neyse o kalır.
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
  await knex.schema.dropTableIfExists("ingredients");
  await knex.schema.dropTableIfExists("cocktails");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("ingredient_categories");
  await knex.schema.dropTableIfExists("importance_levels");
};
