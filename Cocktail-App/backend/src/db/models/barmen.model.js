const db = require("../knex");

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
    // NOT: Bu sorgu normalde String döner, aşağıda Integer'a çevireceğiz.
    const missingCountSubquery = db("cocktail_requirements as r")
      .count("*")
      .where("r.cocktail_id", db.ref("c.cocktail_id"))
      .andWhere("r.level_id", 1) // Sadece ZORUNLU malzemeleri say (Garnish sayılmaz)
      .whereNotIn("r.ingredient_id", inventoryIds)
      .whereNotExists((qb) => {
        // Alternatif kontrolü: Eğer eksik olan malzemenin bir alternatifi inventory'de varsa, eksik sayma.
        qb.select(1)
          .from("recipe_alternatives as a")
          .where("a.original_ingredient_id", db.ref("r.ingredient_id"))
          .andWhere("a.cocktail_id", db.ref("c.cocktail_id"))
          .whereIn("a.alternative_ingredient_id", inventoryIds);
      })
      .as("missing_count");

    const smartMatches = await db("cocktails as c")
      // A) ÖN FİLTRELEME: En az 1 malzemesi (veya alternatifi) tutanları getir
      // Bu sayede veritabanını yormadan, tamamen alakasız kokteylleri eliyoruz.
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
      // B) SEÇME (GÜNCELLENDİ: Type Casting)
      .select(
        "c.cocktail_id",
        "c.name", // { en: "Mojito", tr: "Mojito" }
        "c.image_url",
        // KRİTİK DÜZELTME: PostgreSQL count sonucunu String ("0") döner.
        // Frontend'de === 0 kontrolü yapabilmek için burada Integer'a çeviriyoruz.
        db.raw("CAST((?) AS INTEGER) as missing_count", missingCountSubquery)
      )
      // C) SIRALAMA
      // 1. Eksik sayısına göre (En az eksik en üstte)
      .orderBy("missing_count", "asc")
      // 2. İsim sırasına göre (Bozuk sıralamayı önler - İngilizce isme göre)
      .orderByRaw("c.name->>'en' ASC");

    return smartMatches;
  }

  // === MOD: STRICT (TAM EŞLEŞME - "Elimdekilerle ne yapabilirim?") ===
  if (mode === "strict") {
    const exactMatches = await db("cocktails as c")
      .whereNotExists((qb) => {
        qb.select(1)
          .from("cocktail_requirements as req")
          .where("req.cocktail_id", db.ref("c.cocktail_id"))
          .andWhere("req.level_id", 1) // Zorunlu malzeme
          .whereNotIn("req.ingredient_id", inventoryIds) // Elimde yok mu?
          .whereNotExists((subQb) => {
            // Alternatifi de mi yok?
            subQb
              .select(1)
              .from("recipe_alternatives as alt")
              .where("alt.original_ingredient_id", db.ref("req.ingredient_id"))
              .andWhere("alt.cocktail_id", db.ref("c.cocktail_id"))
              .whereIn("alt.alternative_ingredient_id", inventoryIds);
          });
      })
      .select("c.cocktail_id", "c.name", "c.image_url");

    // Strict modda eksik sayısı daima 0'dır, manuel ekliyoruz.
    return exactMatches.map((c) => ({ ...c, missing_count: 0 }));
  }

  return [];
};

module.exports = {
  findRecipesByIngredients,
};
