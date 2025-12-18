const db = require("../knex");

/**
 * @desc    Verilen malzeme listesine göre kokteylleri filtreler ve EKSİK SAYISINI hesaplar.
 * @note    Artık sadece "Flexible" (Akıllı) mod çalışmaktadır.
 */
const findRecipesByIngredients = async (inventoryIds, mode = "flexible") => {
  // 1. Boş kontrolü
  if (!inventoryIds || inventoryIds.length === 0) {
    return [];
  }

  // === MOD: FLEXIBLE (AKILLI SIRALAMA) - Varsayılan ===
  // Alt Sorgu: Eksik Malzeme Sayısını Hesapla
  const missingCountSubquery = db("cocktail_requirements as r")
    .count("*")
    .where("r.cocktail_id", db.ref("c.cocktail_id"))
    .andWhere("r.level_id", 1) // Sadece ZORUNLU malzemeleri say
    .whereNotIn("r.ingredient_id", inventoryIds)
    .whereNotExists((qb) => {
      // Alternatif kontrolü
      qb.select(1)
        .from("recipe_alternatives as a")
        .where("a.original_ingredient_id", db.ref("r.ingredient_id"))
        .andWhere("a.cocktail_id", db.ref("c.cocktail_id"))
        .whereIn("a.alternative_ingredient_id", inventoryIds);
    });

  const smartMatches = await db("cocktails as c")
    // A) ÖN FİLTRELEME
    .whereExists((qb) => {
      qb.select(1)
        .from("cocktail_requirements as req")
        .leftJoin("recipe_alternatives as alt", function () {
          this.on("req.ingredient_id", "=", "alt.original_ingredient_id").andOn(
            "req.cocktail_id",
            "=",
            "alt.cocktail_id"
          );
        })
        .where("req.cocktail_id", db.ref("c.cocktail_id"))
        .andWhere((subQb) => {
          subQb
            .whereIn("req.ingredient_id", inventoryIds)
            .orWhereIn("alt.alternative_ingredient_id", inventoryIds);
        });
    })
    // B) SEÇME
    .select(
      "c.cocktail_id",
      "c.name",
      "c.image_url",
      // Count sonucunu Integer'a çeviriyoruz
      db.raw("CAST((?) AS INTEGER) as missing_count", missingCountSubquery)
    )
    // C) SIRALAMA
    .orderBy("missing_count", "asc")
    .orderByRaw("c.name->>'en' ASC");

  return smartMatches;
};

/**
 * @desc    WIZARD MODU İÇİN YARDIMCI (BAĞLAMSAL DARALTMA)
 * Seçilen Ana İçkilerle (örn: Cin) yapılabilecek kokteyllerin
 * içinde geçen DİĞER malzemeleri getirir.
 * @param   {Array} baseSpiritIds - Kullanıcının seçtiği ana içki ID'leri
 */
const getMenuHints = async (baseSpiritIds) => {
  if (!baseSpiritIds || baseSpiritIds.length === 0) return [];

  // 1. Bu ana içkileri Ana Malzeme (Level 1) olarak kullanan kokteyl ID'lerini bul
  const possibleCocktailIds = db("cocktail_requirements")
    .distinct("cocktail_id")
    .whereIn("ingredient_id", baseSpiritIds)
    .andWhere("level_id", 1);

  // 2. Bu kokteyllerde kullanılan DİĞER malzemeleri (Yancı, Süs vb.) getir
  const relatedIngredients = await db("cocktail_requirements as r")
    .join("ingredients as i", "r.ingredient_id", "i.ingredient_id")
    .join("categories as c", "i.category_id", "c.category_id")
    .select(
      "i.ingredient_id",
      "i.name", // { en: "Lime", tr: "Misket Limonu" }
      "i.image_url",
      "c.category_name" // Frontend'de Step 2 ve Step 3 ayrımı için lazım
    )
    .whereIn("r.cocktail_id", possibleCocktailIds) // Sadece ilgili kokteyller
    .whereNotIn("i.ingredient_id", baseSpiritIds) // Ana içkinin kendisini tekrar getirme
    .distinct("i.ingredient_id"); // Aynı malzemeyi defalarca getirme

  return relatedIngredients;
};

module.exports = {
  findRecipesByIngredients,
  getMenuHints,
};
