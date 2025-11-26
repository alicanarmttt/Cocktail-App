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
    // 1. DÜZELTME: Soru İşaretlerini Dinamik Oluştur (?,?,?)
    // inventoryIds [1, 2, 3] ise -> placeholdersString "?,?,?" olur.
    const placeholders = inventoryIds.map(() => "?").join(",");

    const smartMatches = await db("cocktails as c")
      // A) ÖN FİLTRELEME
      .whereExists(function () {
        this.select(1)
          .from("cocktail_requirements as req")
          .leftJoin("recipe_alternatives as alt", function () {
            this.on(
              "req.ingredient_id",
              "=",
              "alt.original_ingredient_id"
            ).andOn("req.cocktail_id", "=", "alt.cocktail_id");
          })
          .whereRaw("req.cocktail_id = c.cocktail_id")
          .andWhere(function () {
            this.whereIn("req.ingredient_id", inventoryIds).orWhereIn(
              "alt.alternative_ingredient_id",
              inventoryIds
            );
          });
      })
      // B) HESAPLAMA VE SEÇME
      .select(
        "c.cocktail_id",
        "c.name_tr",
        "c.name_en",
        "c.image_url",
        // 2. DÜZELTME: db.raw içinde oluşturduğumuz string'i kullanıyoruz
        // ve parametreleri '...' (Spread Operator) ile tek tek yayıyoruz.
        db.raw(
          `(
            SELECT COUNT(*)
            FROM cocktail_requirements as r
            WHERE r.cocktail_id = c.cocktail_id
            AND r.level_id = 1 
            AND r.ingredient_id NOT IN (${placeholders}) -- Dinamik soru işaretleri
            AND NOT EXISTS (
                SELECT 1 
                FROM recipe_alternatives as a
                WHERE a.original_ingredient_id = r.ingredient_id
                AND a.cocktail_id = c.cocktail_id
                AND a.alternative_ingredient_id IN (${placeholders}) -- Dinamik soru işaretleri
            )
        ) as missing_count`,
          [...inventoryIds, ...inventoryIds]
        ) // DİKKAT: Diziyi yayıyoruz!
      )
      // C) SIRALAMA
      .orderBy("missing_count", "asc")
      .orderBy("c.name_en", "asc");

    return smartMatches;
  }

  // === MOD: STRICT (Geri Uyumluluk) ===
  if (mode === "strict") {
    // ... (Eski kodun aynı kalabilir) ...
    const exactMatches = await db("cocktails as c")
      .whereNotExists(function () {
        this.from("cocktail_requirements as req")
          .whereRaw("req.cocktail_id = c.cocktail_id")
          .andWhere("req.level_id", 1)
          .whereNotIn("req.ingredient_id", inventoryIds)
          .whereNotExists(
            db("recipe_alternatives as alt")
              .whereRaw("alt.original_ingredient_id = req.ingredient_id")
              .whereRaw("alt.cocktail_id = c.cocktail_id")
              .whereIn("alt.alternative_ingredient_id", inventoryIds)
          );
      })
      .select("c.cocktail_id", "c.name_tr", "c.name_en", "c.image_url");

    return exactMatches.map((c) => ({ ...c, missing_count: 0 }));
  }

  return [];
};

module.exports = {
  findRecipesByIngredients,
};
