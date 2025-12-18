const db = require("../knex");

// ============================================================
//               MEVCUT FONKSİYONLAR (DEĞİŞMEDİ)
// ============================================================

const findRecipesByIngredients = async (
  inventoryIds,
  mode = "flexible",
  mustHaveIds = [] // Varsayılan değer BOŞ dizi. Manuel mod burayı boş bırakır.
) => {
  if (!inventoryIds || inventoryIds.length === 0) return [];

  // 1. EKSİK MALZEME SAYISINI HESAPLAYAN ALT SORGU (AYNEN KORUNDU)
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

  // 2. TEMEL FİLTRELEME SORGUSU (AYNEN KORUNDU)
  // "await" kullanmadan önce sorguyu bir değişkene (query) atıyoruz.
  let query = db("cocktails as c").whereExists((qb) => {
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
  });

  // 3. [YENİ] GÜVENLİ FİLTRE EKLEMESİ
  // Manuel modda 'mustHaveIds' boş olduğu için burası ASLA çalışmaz.
  // Sadece Rehber modu için devreye girer.
  if (mustHaveIds && mustHaveIds.length > 0) {
    query = query.whereExists((qb) => {
      qb.select(1)
        .from("cocktail_requirements as r2")
        .where("r2.cocktail_id", db.ref("c.cocktail_id"))
        .whereIn("r2.ingredient_id", mustHaveIds);
    });
  }

  // 4. SONUÇLARI ÇEKME VE SIRALAMA (AYNEN KORUNDU)
  const smartMatches = await query
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
    .whereIn("i.category_id", [3, 5, 6, 8])
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
 * @desc    REHBER ADIM 3: Taze ve Kiler (Akıllı Sıralama Özellikli)
 * @param   {string} familyKey - Ana içki (örn: vodka)
 * @param   {Array} step2Ids - [YENİ] Adım 2'de seçilen şişelerin ID'leri
 */
const getGuideStep3Options = async (familyKey, step2Ids = [], lang = "en") => {
  if (!familyKey) return [];

  let query = db("cocktail_requirements as cr")
    .join("ingredients as i", "cr.ingredient_id", "i.ingredient_id")
    // 1. Temel Filtre: Kokteylin içinde MUTLAKA Ana İçki (familyKey) olmalı
    .whereExists(function () {
      this.select(1)
        .from("cocktail_requirements as cr_base")
        .join(
          "ingredients as i_base",
          "cr_base.ingredient_id",
          "i_base.ingredient_id"
        )
        .whereRaw("cr_base.cocktail_id = cr.cocktail_id")
        .andWhere("i_base.family", familyKey);
    })
    // 2. Kategori Filtresi: Sadece Taze/Kiler (2, 4, 7)
    .whereIn("i.category_id", [2, 4, 7]);

  // 3. DİNAMİK SIRALAMA MANTIĞI
  if (step2Ids && step2Ids.length > 0) {
    // Adım 2'de seçilenlerle ortak kokteylleri saymak için JOIN yapıyoruz
    query.leftJoin("cocktail_requirements as cr_match", function () {
      this.on("cr.cocktail_id", "=", "cr_match.cocktail_id").andOnIn(
        "cr_match.ingredient_id",
        step2Ids
      );
    });

    query.select(
      "i.ingredient_id",
      db.raw("MIN(i.name->>? ) as name", [lang]),
      "i.category_id",
      // Alaka Puanı: Bu malzeme, seçilen şişelerle kaç kokteylde beraber geçiyor?
      db.raw("COUNT(cr_match.ingredient_id) as relevance_score")
    );

    query.groupBy("i.ingredient_id", "i.category_id");

    // Önce en alakalı olanları göster (Puanı yüksek olanlar)
    query.orderBy("relevance_score", "desc");
  } else {
    // Adım 2 boşsa normal listele
    query.select(
      "i.ingredient_id",
      db.raw("MIN(i.name->>? ) as name", [lang]),
      "i.category_id"
    );
    query.groupBy("i.ingredient_id", "i.category_id");
  }

  // İkinci kriter olarak her zaman isme göre sırala (A-Z)
  query.orderBy("name", "asc");

  return await query;
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
  return await findRecipesByIngredients(totalInventory, "flexible", spiritIds);
};

module.exports = {
  findRecipesByIngredients,
  getMenuHints,
  getSpiritFamilies,
  getGuideStep2Options,
  findWizardResults,
  getGuideStep3Options,
};
