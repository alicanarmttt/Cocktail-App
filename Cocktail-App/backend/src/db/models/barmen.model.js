const knexConfig = require("../../../knexfile").development;
const db = require("knex")(knexConfig);

/**
 * @desc    Verilen malzeme listesine göre kokteylleri filtreler ve EKSİK SAYISINI hesaplar.
 */
const findRecipesByIngredients = async (inventoryIds, mode = "strict") => {
  // 1. Boş kontrolü
  if (!inventoryIds || inventoryIds.length === 0) {
    return [];
  }

  // === MOD: FLEXIBLE (AKILLI SIRALAMA) ===
  if (mode === "flexible") {
    // Alt Sorgu: Eksik Malzeme Sayısını Hesapla
    const missingCountSubquery = db("cocktail_requirements as r")
      .count("*")
      .where("r.cocktail_id", db.ref("c.cocktail_id"))
      .andWhere("r.level_id", 1) // Sadece ZORUNLU malzemeleri say
      .whereNotIn("r.ingredient_id", inventoryIds)
      .whereNotExists((qb) => {
        qb.select(1)
          .from("recipe_alternatives as a")
          .where("a.original_ingredient_id", db.ref("r.ingredient_id"))
          .andWhere("a.cocktail_id", db.ref("c.cocktail_id"))
          .whereIn("a.alternative_ingredient_id", inventoryIds);
      })
      .as("missing_count");

    const smartMatches = await db("cocktails as c")
      // A) ÖN FİLTRELEME (Eşleşme mantığı aynı kalıyor)
      .whereExists((qb) => {
        qb.select(1)
          .from("cocktail_requirements as req")
          .leftJoin("recipe_alternatives as alt", function () {
            this.on(
              "req.ingredient_id",
              "=",
              "alt.original_ingredient_id"
            ).andOn("req.cocktail_id", "=", "alt.cocktail_id");
          })
          .where("req.cocktail_id", db.ref("c.cocktail_id"))
          .andWhere((subQb) => {
            subQb
              .whereIn("req.ingredient_id", inventoryIds)
              .orWhereIn("alt.alternative_ingredient_id", inventoryIds);
          });
      })
      // B) SEÇME (GÜNCELLENDİ: JSONB Yapısı)
      .select(
        "c.cocktail_id",
        "c.name", // { en: "Mojito", tr: "Mojito" } olarak döner
        "c.image_url",
        missingCountSubquery
      )
      // C) SIRALAMA (GÜNCELLENDİ: JSON İçindeki EN isme göre)
      .orderBy("missing_count", "asc")
      .orderByRaw("c.name->>'en' ASC"); // PostgreSQL JSON operatörü

    return smartMatches;
  }

  // === MOD: STRICT (TAM EŞLEŞME) ===
  if (mode === "strict") {
    const exactMatches = await db("cocktails as c")
      .whereNotExists((qb) => {
        qb.select(1)
          .from("cocktail_requirements as req")
          .where("req.cocktail_id", db.ref("c.cocktail_id"))
          .andWhere("req.level_id", 1)
          .whereNotIn("req.ingredient_id", inventoryIds)
          .whereNotExists((subQb) => {
            subQb
              .select(1)
              .from("recipe_alternatives as alt")
              .where("alt.original_ingredient_id", db.ref("req.ingredient_id"))
              .andWhere("alt.cocktail_id", db.ref("c.cocktail_id"))
              .whereIn("alt.alternative_ingredient_id", inventoryIds);
          });
      })
      // GÜNCELLENDİ: JSONB Yapısı
      .select("c.cocktail_id", "c.name", "c.image_url");

    return exactMatches.map((c) => ({ ...c, missing_count: 0 }));
  }

  return [];
};

module.exports = {
  findRecipesByIngredients,
};
