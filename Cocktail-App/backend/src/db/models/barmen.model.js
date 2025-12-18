const db = require("../knex");

// ============================================================
//               MEVCUT FONKSİYONLAR (DEĞİŞMEDİ)
// ============================================================

const findRecipesByIngredients = async (inventoryIds, mode = "flexible") => {
  if (!inventoryIds || inventoryIds.length === 0) return [];

  const missingCountSubquery = db("cocktail_requirements as r")
    .count("*")
    .where("r.cocktail_id", db.ref("c.cocktail_id"))
    .andWhere("r.level_id", 1)
    .whereNotIn("r.ingredient_id", inventoryIds)
    .whereNotExists((qb) => {
      qb.select(1)
        .from("recipe_alternatives as a")
        .where("a.original_ingredient_id", db.ref("r.ingredient_id"))
        .andWhere("a.cocktail_id", db.ref("c.cocktail_id"))
        .whereIn("a.alternative_ingredient_id", inventoryIds);
    });

  const smartMatches = await db("cocktails as c")
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
    .select(
      "c.cocktail_id",
      "c.name",
      "c.image_url",
      db.raw("CAST((?) AS INTEGER) as missing_count", missingCountSubquery)
    )
    .orderBy("missing_count", "asc")
    .orderByRaw("c.name->>'en' ASC");

  return smartMatches;
};

const getMenuHints = async (baseSpiritIds) => {
  if (!baseSpiritIds || baseSpiritIds.length === 0) return [];

  const possibleCocktailIds = db("cocktail_requirements")
    .distinct("cocktail_id")
    .whereIn("ingredient_id", baseSpiritIds)
    .andWhere("level_id", 1);

  const relatedIngredients = await db("cocktail_requirements as r")
    .join("ingredients as i", "r.ingredient_id", "i.ingredient_id")
    .join("ingredient_categories as c", "i.category_id", "c.category_id")
    .select("i.ingredient_id", "i.name", "i.image_url", "c.category_name")
    .whereIn("r.cocktail_id", possibleCocktailIds)
    .whereNotIn("i.ingredient_id", baseSpiritIds)
    .distinct("i.ingredient_id");

  return relatedIngredients;
};

// ============================================================
//               YENİ REHBER (WIZARD) FONKSİYONLARI
// ============================================================

/**
 * @desc    REHBER ADIM 1: Ana içki ailelerini getirir.
 * Resim yok, sadece Key (ID niyetine) ve Çevrilmiş İsim döner.
 */
const getSpiritFamilies = async (lang = "en") => {
  // 1. Veritabanındaki 'family' değerlerini (whiskey, rum vs.) çek
  const families = await db("ingredients")
    .distinct("family")
    .where("category_id", 1) // Sadece Spirits
    .whereNotNull("family");

  // 2. Çeviri Sözlüğü (Backend'de yönetilen tek yer)
  // İleride İspanyolca gelirse sadece buraya 'es' eklenecek.
  const FAMILY_TRANSLATIONS = {
    whiskey: { tr: "Viski", en: "Whiskey" },
    rum: { tr: "Rom", en: "Rum" },
    gin: { tr: "Cin", en: "Gin" },
    vodka: { tr: "Votka", en: "Vodka" },
    tequila: { tr: "Tekila", en: "Tequila" },
    brandy: { tr: "Konyak & Brandy", en: "Brandy & Cognac" },
  };

  return families
    .map((f) => {
      const trans = FAMILY_TRANSLATIONS[f.family];
      if (!trans) return null;

      return {
        key: f.family, // Bu bizim ID'miz gibi çalışır (Frontend bunu geri yollayacak)
        name: trans[lang] || trans["en"], // İstenen dil yoksa İngilizce dön
      };
    })
    .filter(Boolean); // Tanımsız olanları temizle
};

/**
 * @desc    REHBER ADIM 2: Şişeli Yancılar (Likör, Şurup, Vermut vb.)
 */
const getGuideStep2Options = async (familyKey, lang = "en") => {
  if (!familyKey) return [];

  return await db("cocktail_requirements as cr")
    .whereIn("cr.cocktail_id", function () {
      this.select("cr_sub.cocktail_id")
        .from("cocktail_requirements as cr_sub")
        .join(
          "ingredients as i_sub",
          "cr_sub.ingredient_id",
          "i_sub.ingredient_id"
        )
        .where("i_sub.family", familyKey);
    })
    .join("ingredients as i", "cr.ingredient_id", "i.ingredient_id")
    // FİLTRE: Sadece Şişeli Ürünler (Likör, Şarap, Yancı, Şurup, Diğer)
    .whereIn("i.category_id", [2, 3, 4, 6, 9, 10])
    .andWhere((builder) => {
      builder.where("i.family", "!=", familyKey).orWhereNull("i.family");
    })
    .distinct("i.ingredient_id")
    .select(
      "i.ingredient_id",
      db.raw("i.name->>? as name", [lang]),
      "i.category_id"
    )
    .orderBy("name", "asc");
};

/**
 * @desc    REHBER ADIM 3: Taze ve Kiler (Meyve, Meyve Suyu, Yumurta, Nane)
 */
const getGuideStep3Options = async (familyKey, lang = "en") => {
  if (!familyKey) return [];

  return await db("cocktail_requirements as cr")
    .whereIn("cr.cocktail_id", function () {
      this.select("cr_sub.cocktail_id")
        .from("cocktail_requirements as cr_sub")
        .join(
          "ingredients as i_sub",
          "cr_sub.ingredient_id",
          "i_sub.ingredient_id"
        )
        .where("i_sub.family", familyKey);
    })
    .join("ingredients as i", "cr.ingredient_id", "i.ingredient_id")
    // FİLTRE: Sadece Taze ve Kiler (Meyve Suyu, Meyve, Kiler)
    .whereIn("i.category_id", [5, 7, 8])
    .distinct("i.ingredient_id")
    .select(
      "i.ingredient_id",
      db.raw("i.name->>? as name", [lang]),
      "i.category_id"
    )
    .orderBy("name", "asc");
};

/**
 * @desc    REHBER SONUÇ (WIZARD RESULT) - KÖPRÜ FONKSİYON
 * Bu fonksiyon, Rehberden gelen 'family' (örn: whiskey) string'ini
 * veritabanındaki ID'lere dönüştürür ve seçilen yancılarla birleştirir.
 * Sonra senin mevcut 'flexible' modunu çağırır.
 */
const findWizardResults = async (familyKey, adjunctIds = []) => {
  // 1. Önce seçilen ailenin (örn: Whiskey) TÜM ID'lerini bulalım.
  // Kullanıcı "Viski" dediği için elimizdeki tüm viskileri (ID: 47, 55, 68...) çekiyoruz.
  const spiritIds = await db("ingredients")
    .where("family", familyKey)
    .pluck("ingredient_id"); // Bize sadece [47, 55, 68] gibi temiz bir dizi döner.

  // 2. Bu viski ID'lerini, kullanıcının seçtiği yancı ID'leri (örn: [12]) ile birleştirelim.
  // Sonuç: [47, 55, 68, 12] -> Yani "Elimde her türlü viski ve vermut var" demiş oluyoruz.
  const totalInventory = [...spiritIds, ...adjunctIds];

  // 3. Mevcut "Akıllı Arama" motorumuzu bu tam listeyle çalıştıralım.
  // İşte senin 'flexible' modun burada devreye giriyor!
  return await findRecipesByIngredients(totalInventory, "flexible");
};

module.exports = {
  findRecipesByIngredients,
  getMenuHints,
  getSpiritFamilies,
  getGuideStep2Options,
  findWizardResults,
  getGuideStep3Options,
};
