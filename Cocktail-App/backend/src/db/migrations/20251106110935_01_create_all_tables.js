/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // --- importance_levels (Önem Seviyeleri) ---
  await knex.schema.createTable("importance_levels", (table) => {
    table.increments("level_id").primary(); // 1, 2, 3...
    table.string("level_name").notNullable(); // 'Gerekli', 'Süsleme'
    table.string("color_code");
  });

  // --- ingredient_categories (Malzeme Kategorileri) ---
  await knex.schema.createTable("ingredient_categories", (table) => {
    table.increments("category_id").primary();
    table.string("category_name").notNullable().unique(); // 'Alkol', 'Soft', 'Şurup'
    table.string("parent_category_name"); // 'Soft' kategorisi için 'Asitli', 'Asitsiz' gibi alt gruplar
  });

  // --- users (Kullanıcılar) ---
  await knex.schema.createTable("users", (table) => {
    table.increments("user_id").primary();
    table.string("firebase_uid").notNullable().unique(); // Firebase'den gelen 'abc123xyz' gibi eşsiz ID
    table.string("email").notNullable().unique();
    table.boolean("is_pro").defaultTo(false);
    table.timestamps(true, true); // created_at ve updated_at
  });

  // --- cocktails (Kokteyller) ---
  await knex.schema.createTable("cocktails", (table) => {
    table.increments("cocktail_id").primary();

    // YENİ EKLENENLER:
    table.string("api_id").unique(); // TheCocktailDB ID'si (Tekrarı önlemek için unique)
    table.string("glass_type"); // 'Highball glass'
    table.text("tags"); // 'IBA,Vegan,Citrus' (Uzun olabilir diye text)
    table.boolean("is_alcoholic").defaultTo(true); // true/false

    // MEVCUT ALANLAR:
    table.string("name").notNullable().unique();
    table.text("instructions").notNullable();
    table.string("image_url");
    table.text("history_notes");
  });

  //   // ADIM 2: "Bağımlı" Tabloları Oluştur (Foreign Key içerenler) 1-1

  // --- ingredients (Malzemeler) ---
  await knex.schema.createTable("ingredients", (table) => {
    table.increments("ingredient_id").primary();
    table.string("name").notNullable().unique();
    // 'ingredient_categories' tablosuna bağlanır:
    table
      .integer("category_id")
      .unsigned()
      .references("category_id")
      .inTable("ingredient_categories")
      .onDelete("SET NULL");
  });

  // --- user_profiles (Kullanıcı Profilleri) ---
  await knex.schema.createTable("user_profiles", (table) => {
    table.increments("profile_id").primary();
    // "users" table connection;
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

  //   // ADIM 3: "İlişki" Tablolarını Oluştur (Çoka Çok İlişkiler)

  // --- cocktail_requirements (Kokteyl Gereksinimleri) ---
  // AÇIKLAMA: Projemizin kalbi. Hangi kokteyl, hangi malzemeden, ne kadar önemli?
  await knex.schema.createTable("cocktail_requirements", (table) => {
    table.increments("requirement_id").primary();
    table.string("amount").notNullable();

    // Coctails table connect
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

  // --- recipe_alternatives (Tarife Özel Alternatifler) [PRO] ---
  // GÜNCELLEME: Burası 'akıllı' versiyonla değiştirildi (Sizin öneriniz).
  await knex.schema.createTable("recipe_alternatives", (table) => {
    table.increments("alternative_id").primary();

    // GÜNCELLEME: 'alternative_recipe_text' (düz metin) sütunu kaldırıldı.
    // table.text("alternative_recipe_text").notNullable();

    // GÜNCELLEME: Yerine 'alternative_ingredient_id' (malzeme ID'si) eklendi.
    // Bu, "Barmen'in Asistanı" ('Elimde Votka var') özelliğimiz için GEREKLİDİR.
    table
      .integer("alternative_ingredient_id")
      .unsigned()
      .notNullable()
      .references("ingredient_id")
      .inTable("ingredients");

    // GÜNCELLEME: Alternatifin miktarı eklendi.
    table.string("alternative_amount").notNullable(); // örn: "60 ml"

    // Hangi kokteyl için bu alternatif? (Bu satırlar aynı kaldı)
    table
      .integer("cocktail_id")
      .unsigned()
      .notNullable()
      .references("cocktail_id")
      .inTable("cocktails")
      .onDelete("CASCADE");

    // Hangi malzeme yerine bu alternatif? (Bu satırlar aynı kaldı)
    table
      .integer("original_ingredient_id")
      .unsigned()
      .references("ingredient_id")
      .inTable("ingredients");
  });

  // --- barmens_corner_posts (Barmen Köşesi Gönderileri) [PRO] ---
  await knex.schema.createTable("barmens_corner_posts", (table) => {
    table.increments("post_id").primary();
    table.string("image_url").notNullable();
    table.text("caption"); // "Hafta sonu denemem!"
    table.timestamps(true, true);

    // Kim paylaştı?
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("user_id")
      .inTable("users")
      .onDelete("CASCADE"); // Kullanıcı silinirse gönderileri de silinir.

    // Hangi kokteyli etiketledi? (Opsiyonel)
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
  // YUKARIDAKİ İŞLEMLERİN TAM TERSİ SIRASIYLA TÜM TABLOLARI SİL
  // (Bağımlılık zincirini kırmamak için)

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
