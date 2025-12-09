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

  // === MOD: FLEXIBLE (MSSQL DÜZELTMESİ) ===
  if (mode === "flexible") {
    // Alt Sorgu: Eksik Malzeme Sayısını Hesapla (db.raw yerine subquery)
    const missingCountSubquery = db("cocktail_requirements as r")
      .count("*") // COUNT(*)
      // db.ref() sayesinde 'c.cocktail_id'nin dış tablodan geldiğini Knex anlar
      .where("r.cocktail_id", db.ref("c.cocktail_id"))
      .andWhere("r.level_id", 1)
      .whereNotIn("r.ingredient_id", inventoryIds)
      .whereNotExists((qb) => {
        qb.select(1)
          .from("recipe_alternatives as a")
          // db.ref ile korelasyon (Correlation)
          .where("a.original_ingredient_id", db.ref("r.ingredient_id"))
          .andWhere("a.cocktail_id", db.ref("c.cocktail_id"))
          .whereIn("a.alternative_ingredient_id", inventoryIds);
      })
      .as("missing_count"); // Sütun adı

    const smartMatches = await db("cocktails as c")
      // A) ÖN FİLTRELEME
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
          .where("req.cocktail_id", db.ref("c.cocktail_id")) // Raw yerine db.ref
          .andWhere((subQb) => {
            subQb
              .whereIn("req.ingredient_id", inventoryIds)
              .orWhereIn("alt.alternative_ingredient_id", inventoryIds);
          });
      })
      // B) SEÇME (Subquery'yi buraya ekliyoruz)
      .select(
        "c.cocktail_id",
        "c.name_tr",
        "c.name_en",
        "c.image_url",
        missingCountSubquery // <--- Hesaplama burada
      )
      // C) SIRALAMA
      .orderBy("missing_count", "asc")
      .orderBy("c.name_en", "asc");

    return smartMatches;
  }

  // === MOD: STRICT (Geri Uyumluluk) ===
  if (mode === "strict") {
    const exactMatches = await db("cocktails as c")
      .whereNotExists((qb) => {
        qb.select(1) // .from öncesi select eklemek best practice'tir
          .from("cocktail_requirements as req")
          .where("req.cocktail_id", db.ref("c.cocktail_id")) // Raw yerine ref
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
      .select("c.cocktail_id", "c.name_tr", "c.name_en", "c.image_url");

    return exactMatches.map((c) => ({ ...c, missing_count: 0 }));
  }

  return [];
};

module.exports = {
  findRecipesByIngredients,
};
