const knexConfig = require("../../../knexfile.js").development; // Knex will start with development settings.

const db = require("knex")(knexConfig); //db object is tool to speak with database.

/**
 * @desc    Fetches all cocktails from the database.
 * @returns {Promise<Array>} An array of cocktail objects
 */
const getAllCocktails = () => {
  // SQL Karşılığı: SELECT * FROM cocktails

  return db("cocktails").select(
    "cocktail_id",
    "api_id",
    // Türkçe Alanlar
    "name_tr",
    "instructions_tr",
    "glass_type_tr",
    "tags_tr",
    // İngilizce Alanlar
    "name_en",
    "instructions_en",
    "glass_type_en",
    "tags_en",
    // Ortak Alanlar
    "is_alcoholic",
    "image_url"
  );
};

/**
 * @desc    Fetches a single cocktail by its ID.
 * @param   {number} id - The ID of the cocktail to search for
 * @returns {Promise<Object>} A single cocktail object
 */
const getCocktailById = async (id) => {
  // 1. KOKTEYL DETAYINI ÇEK
  const cocktail = await db("cocktails")
    .select(
      "cocktail_id",
      "name_tr",
      "instructions_tr",
      "history_notes_tr",
      "glass_type_tr",
      "name_en",
      "instructions_en",
      "history_notes_en",
      "glass_type_en",
      "image_url",
      "is_alcoholic"
    )
    .where({ cocktail_id: id })
    .first();

  if (!cocktail) return undefined;

  // 2. MALZEMELERİ VE ALTERNATİFLERİNİ ÇEK (JOIN ile)
  // Bu sorgu, çoklu alternatiflerde aynı malzemeyi tekrar eden satırlar döndürür.
  const rawIngredients = await db("cocktail_requirements as req")
    .join("ingredients as ing", "req.ingredient_id", "ing.ingredient_id")
    .join("importance_levels as lvl", "req.level_id", "lvl.level_id")
    .leftJoin("recipe_alternatives as alt", (join) => {
      join
        .on("req.cocktail_id", "=", "alt.cocktail_id")
        .andOn("req.ingredient_id", "=", "alt.original_ingredient_id");
    })
    .leftJoin(
      "ingredients as alt_ing",
      "alt.alternative_ingredient_id",
      "alt_ing.ingredient_id"
    )
    .select(
      "req.requirement_id",
      "ing.ingredient_id",
      // Malzeme Bilgileri
      "ing.name_tr",
      "ing.name_en",
      "req.amount_tr",
      "req.amount_en",
      "lvl.level_name_tr",
      "lvl.level_name_en",
      "lvl.color_code",
      // Alternatif Bilgileri (Varsa)
      "alt.alternative_amount_tr",
      "alt.alternative_amount_en",
      "alt_ing.ingredient_id as alt_id", // Alternatifin ID'si
      "alt_ing.name_tr as alternative_name_tr",
      "alt_ing.name_en as alternative_name_en"
    )
    .where("req.cocktail_id", id);

  // 3. GRUPLAMA (JAVASCRIPT LOGIC)
  // Gelen ham veriyi işleyerek duplicate (tekrar eden) malzemeleri birleştiriyoruz.

  const ingredientsMap = new Map();

  rawIngredients.forEach((row) => {
    // Eğer bu malzeme daha önce listeye eklenmediyse, ana iskeletini oluştur
    if (!ingredientsMap.has(row.ingredient_id)) {
      ingredientsMap.set(row.ingredient_id, {
        requirement_id: row.requirement_id,
        ingredient_id: row.ingredient_id,
        name_tr: row.name_tr,
        name_en: row.name_en,
        amount_tr: row.amount_tr,
        amount_en: row.amount_en,
        level_name_tr: row.level_name_tr,
        level_name_en: row.level_name_en,
        color_code: row.color_code,
        has_alternative: false, // Başlangıçta false
        alternatives: [], // Alternatifleri buraya dolduracağız
      });
    }

    // Eğer bu satırda bir alternatif varsa (alt_id null değilse)
    if (row.alt_id) {
      const ingredient = ingredientsMap.get(row.ingredient_id);

      // Bayrağı true yap
      ingredient.has_alternative = true;

      // Alternatifi listeye ekle
      ingredient.alternatives.push({
        ingredient_id: row.alt_id,
        name_tr: row.alternative_name_tr,
        name_en: row.alternative_name_en,
        amount_tr: row.alternative_amount_tr,
        amount_en: row.alternative_amount_en,
      });
    }
  });

  // Map yapısını tekrar diziye (Array) çevir
  const groupedIngredients = Array.from(ingredientsMap.values());

  return {
    ...cocktail,
    ingredients: groupedIngredients,
  };
};

module.exports = {
  getAllCocktails,
  getCocktailById,
};
