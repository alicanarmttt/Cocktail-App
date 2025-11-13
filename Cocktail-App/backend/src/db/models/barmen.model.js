const knexConfig = require("../../../knexfile").development;
const db = require("knex")(knexConfig);

/**
 * @desc    Verilen malzeme listesine göre kokteylleri filtreler (Akıllı Barmen Mantığı)
 * @param   {Array<number>} inventoryIds - Kullanıcının elindeki malzeme ID'leri (örn: [1, 7, 3])
 * @param   {string} mode - Filtreleme modu: 'strict' (Sadece Yapabildiklerim) veya 'flexible' (Bunları İçerenler)
 * @returns {Promise<Array>} Eşleşen kokteyller listesi
 */
const findRecipesByIngredients = async (inventoryIds, mode = "strict") => {
  // 1. Eğer tezgah boşsa boş dizi dön (Hata almamak için)
  if (!inventoryIds || inventoryIds.length === 0) {
    return [];
  }

  // === MOD 1: STRICT (Sadece Yapabildiklerim) ===
  // Mantık: Kokteylin 'Gerekli' (Level 1) malzemelerinin HEPSİ, kullanıcının listesinde (inventoryIds) var mı?
  // (Buna alternatifler de dahildir!)
  if (mode === "strict") {
    /*
      SQL MANTIĞI (ÖZET):
      1. Tüm kokteyl gereksinimlerini (cocktail_requirements) al.
      2. Sadece "Gerekli" (Level 1) olanlara bak (Süslemeler eksik olabilir).
      3. Her gereksinim için kontrol et:
         - Orijinal malzeme kullanıcının elinde var mı?
         - VEYA o malzemenin bir alternatifi (recipe_alternatives) kullanıcının elinde var mı?
      4. Bir kokteylin tüm gereksinimleri "TAMAM" ise o kokteyli listeye ekle.
    */

    const exactMatches = await db("cocktails as c")
      .whereNotExists(function () {
        // BURASI KRİTİK: "Eksik malzemesi olanları HARİÇ TUT" mantığı (NOT EXISTS)
        this.select("*")
          .from("cocktail_requirements as req")
          .whereRaw("req.cocktail_id = c.cocktail_id") // İlişki
          .andWhere("req.level_id", 1) // Sadece 'Gerekli' malzemeleri kontrol et (Süsleme yoksa da olur)
          .where(function () {
            // Malzeme kontrolü:
            // 1. Orijinal malzeme kullanıcının listesinde YOKSA...
            this.whereNotIn("req.ingredient_id", inventoryIds)
              // 2. VE bu malzemenin kullanıcının elinde olan bir ALTERNATİFİ de YOKSA...
              .andWhereNotExists(function () {
                this.select("*")
                  .from("recipe_alternatives as alt")
                  .whereRaw("alt.cocktail_id = c.cocktail_id") // Bu kokteyl için
                  .andWhereRaw("alt.original_ingredient_id = req.ingredient_id") // Bu eksik malzeme yerine
                  .whereIn("alt.alternative_ingredient_id", inventoryIds); // Elimde olan bir alternatif var mı?
              });
          });
      })
      .select("c.*"); // Tüm kokteyl bilgilerini getir

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
      .groupBy("c.cocktail_id", "c.name", "c.image_url") // Kokteyle göre grupla
      .select(
        "c.cocktail_id",
        "c.name",
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
