const db = require("../knex");
/**
 * @desc    Tüm kokteylleri çeker.
 * @returns {Promise<Array>} JSONB yapısında kokteyl listesi
 */
const getAllCocktails = () => {
  // SORGUMUZ ARTIK TERTEMİZ:
  // Veritabanındaki JSONB sütunlarını (name, instructions vb.) olduğu gibi istiyoruz.
  return db("cocktails").select(
    "cocktail_id",
    "api_id",
    "name", // { en: "...", tr: "..." } olarak gelecek
    "instructions", // { en: "...", tr: "..." } olarak gelecek
    "glass_type",
    "tags",
    "is_alcoholic",
    "image_url"
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

      // ARTIK _tr, _en YOK. Direkt sütun ismini alıyoruz:
      "ing.name", // { en: "Gin", tr: "Cin" }
      "req.amount", // { en: "4 cl", tr: "4 cl" }
      "lvl.level_name", // { en: "Required", tr: "Gerekli" }
      "lvl.color_code",

      // Alternatifler
      "alt.alternative_amount", // { en:..., tr:... }
      "alt_ing.ingredient_id as alt_id",
      "alt_ing.name as alternative_name" // { en:..., tr:... }
    )
    .where("req.cocktail_id", id);

  // 3. GRUPLAMA (Mapping)
  const ingredientsMap = new Map();

  rawIngredients.forEach((row) => {
    if (!ingredientsMap.has(row.ingredient_id)) {
      ingredientsMap.set(row.ingredient_id, {
        requirement_id: row.requirement_id,
        ingredient_id: row.ingredient_id,
        name: row.name, // DİKKAT: Artık obje
        amount: row.amount, // DİKKAT: Artık obje
        level_name: row.level_name, // DİKKAT: Artık obje
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
        name: row.alternative_name, // DİKKAT: Artık obje
        amount: row.alternative_amount, // DİKKAT: Artık obje
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
