const db = require("../knex");

/**
 * @desc    Tüm kokteylleri çeker.
 * @returns {Promise<Array>} JSONB yapısında kokteyl listesi
 */
const getAllCocktails = () => {
  return (
    db("cocktails")
      .select(
        "cocktail_id",
        "api_id",
        "name", // { en: "...", tr: "...", es: "..." }
        "instructions",
        "glass_type",
        "tags",
        "is_alcoholic",
        "image_url"
      )
      // EKLEME: Listeyi her zaman İngilizce isme göre A-Z sırala.
      // Bu, arayüzde listenin düzgün durmasını sağlar.
      .orderByRaw("name->>'en' ASC")
  );
};

/**
 * @desc    ID'ye göre tek bir kokteyl ve malzemelerini getirir.
 */
const getCocktailById = async (id) => {
  // 1. KOKTEYL DETAYI
  const cocktail = await db("cocktails")
    .select(
      "cocktail_id",
      "name",
      "instructions",
      "history_notes",
      "glass_type",
      "image_url",
      "is_alcoholic"
    )
    .where({ cocktail_id: id })
    .first();

  if (!cocktail) return undefined;

  // 2. MALZEMELER (JOIN işlemleri)
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

      // JSONB Objeleri olduğu gibi seçiliyor:
      "ing.name",
      "req.amount",
      "lvl.level_name",
      "lvl.color_code",

      // Alternatifler
      "alt.alternative_amount",
      "alt_ing.ingredient_id as alt_id",
      "alt_ing.name as alternative_name"
    )
    .where("req.cocktail_id", id);

  // 3. GRUPLAMA (Mapping)
  // Buradaki mantık zaten gelen objeyi (name: {...}) olduğu gibi
  // alt objelere taşıdığı için KUSURSUZ çalışır. Dokunmaya gerek yok.
  const ingredientsMap = new Map();

  rawIngredients.forEach((row) => {
    if (!ingredientsMap.has(row.ingredient_id)) {
      ingredientsMap.set(row.ingredient_id, {
        requirement_id: row.requirement_id,
        ingredient_id: row.ingredient_id,
        name: row.name, // Obje
        amount: row.amount, // Obje
        level_name: row.level_name, // Obje
        color_code: row.color_code,
        has_alternative: false,
        alternatives: [],
      });
    }

    if (row.alt_id) {
      const ingredient = ingredientsMap.get(row.ingredient_id);
      ingredient.has_alternative = true;
      ingredient.alternatives.push({
        ingredient_id: row.alt_id,
        name: row.alternative_name, // Obje
        amount: row.alternative_amount, // Obje
      });
    }
  });

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
