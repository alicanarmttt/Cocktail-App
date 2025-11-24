const knexConfig = require("../../../knexfile").development;
const db = require("knex")(knexConfig);

/**
 * @desc    Verilen malzeme listesine göre kokteylleri filtreler (Akıllı Barmen Mantığı)
 * @param   {Array<number>} inventoryIds - Kullanıcının elindeki malzeme ID'leri (örn: [1, 7, 3])
 * @param   {string} mode - Filtreleme modu: 'strict' (Sadece Yapabildiklerim) veya 'flexible' (Bunları İçerenler)
 * @returns {Promise<Array>} Eşleşen kokteyller listesi
 */
const findRecipesByIngredients = async (
  inventoryIds,
  mode = "strict",
  lang = "tr"
) => {
  const l = lang === "en" ? "en" : "tr";
  // 1. Eğer tezgah boşsa boş dizi dön (Hata almamak için)
  if (!inventoryIds || inventoryIds.length === 0) {
    return [];
  }

  // === MOD 1: STRICT (Sadece Yapabildiklerim) ===
  // Mantık: Kokteylin 'Gerekli' (Level 1) malzemelerinin HEPSİ, kullanıcının listesinde (inventoryIds) var mı?
  // (Buna alternatifler de dahildir!)

  // === MOD 1: STRICT (Sadece Yapabildiklerim) ===
  if (mode === "strict") {
    const exactMatches = await db("cocktails as c")
      .whereNotExists(function () {
        this.from("cocktail_requirements as req")
          .whereRaw("req.cocktail_id = c.cocktail_id")
          .andWhere("req.level_id", 1) // sadece gerekli malzemeler

          // gerekli malzemenin envanterde olmaması
          .whereNotIn("req.ingredient_id", inventoryIds)

          // ve aynı gerekli malzeme için alternatif de bulunmaması
          .whereNotExists(
            db("recipe_alternatives as alt")
              .whereRaw("alt.original_ingredient_id = req.ingredient_id")
              .whereRaw("alt.cocktail_id = c.cocktail_id")
              .whereIn("alt.alternative_ingredient_id", inventoryIds)
          );
      })
      .select(
        "c.cocktail_id",
        `c.name_${l} as name`, // name_tr -> name
        "c.image_url"
      );

    return exactMatches;
  }

  // === MOD 2: FLEXIBLE (Bunları İçeren Tarifler) ===
  // Mantık: Kullanıcının elindeki malzemelerden EN AZ BİRİNİ içeren kokteylleri getir.
  // Sıralama: En çok malzeme eşleşenden en aza doğru.
  if (mode === "flexible") {
    const flexibleMatches = await db("cocktails as c")
      .join("cocktail_requirements as req", "c.cocktail_id", "req.cocktail_id")
      .leftJoin("recipe_alternatives as alt", function () {
        this.on("req.cocktail_id", "=", "alt.cocktail_id").andOn(
          "req.ingredient_id",
          "=",
          "alt.original_ingredient_id"
        );
      })
      // Filtre: Gereksinim (veya alternatifi) kullanıcının elinde varsa
      .where(function () {
        this.whereIn("req.ingredient_id", inventoryIds).orWhereIn(
          "alt.alternative_ingredient_id",
          inventoryIds
        );
      })
      .groupBy("c.cocktail_id", `c.name_${l}`, "c.image_url") // Kokteyle göre grupla
      .select(
        "c.cocktail_id",
        `c.name_${l} as name`,
        "c.image_url",
        // Eşleşen malzeme sayısını hesapla (Puanlama için)
        db.raw("COUNT(*) as match_count")
      )
      .orderBy("match_count", "desc"); // En çok eşleşen en üstte

    return flexibleMatches;
  }

  return [];
};

module.exports = {
  findRecipesByIngredients,
};
