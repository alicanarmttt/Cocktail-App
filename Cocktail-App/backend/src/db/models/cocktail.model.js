const knexConfig = require("../../../knexfile.js").development; // Knex will start with development settings.

const db = require("knex")(knexConfig); //db object is tool to speak with database.

/**
 * @desc    Fetches all cocktails from the database.
 * @returns {Promise<Array>} An array of cocktail objects
 */
const getAllCocktails = () => {
  // SQL Karşılığı: SELECT * FROM cocktails

  return db("cocktails").select(
    "cocktail_id",
    "api_id",
    // Türkçe Alanlar
    "name_tr",
    "instructions_tr",
    "glass_type_tr",
    "tags_tr",
    // İngilizce Alanlar
    "name_en",
    "instructions_en",
    "glass_type_en",
    "tags_en",
    // Ortak Alanlar
    "is_alcoholic",
    "image_url"
  );
};

//Tek bir kokteyli ID'sine göre getiren fonksiyon.
/**
 * @desc    Fetches a single cocktail by its ID.
 * @param   {number} id - The ID of the cocktail to search for
 * @returns {Promise<Object>} A single cocktail object
 */
const getCocktailById = async (id) => {
  // GÜNCELLEME: 'lang' parametresi kaldırıldı.

  const cocktail = await db("cocktails")
    .select(
      "cocktail_id",
      // Türkçe Alanlar
      "name_tr",
      "instructions_tr",
      "history_notes_tr",
      "glass_type_tr",
      // İngilizce Alanlar
      "name_en",
      "instructions_en",
      "history_notes_en",
      "glass_type_en",
      // Ortak Alanlar
      "image_url",
      "is_alcoholic"
    )
    .where({ cocktail_id: id })
    .first();

  if (!cocktail) return undefined;

  // Adım 2: Bu kokteylin malzemelerini (requirements) al
  // Yorum: Bu, 3 tabloyu birleştiren (JOIN) bir sorgudur.
  const ingredients = await db("cocktail_requirements as req")
    .join("ingredients as ing", "req.ingredient_id", "ing.ingredient_id")
    .join("importance_levels as lvl", "req.level_id", "lvl.level_id")
    // GÜNCELLEME: "Gold Arka Plan" fikri için 'recipe_alternatives' tablosuna LEFT JOIN
    // 'LEFT JOIN' kullanıyoruz çünkü bir malzemenin alternatifi OLMAYABİLİR,
    // ama biz o malzemeyi yine de listelemek isteriz.
    .leftJoin("recipe_alternatives as alt", (join) => {
      join
        .on("req.cocktail_id", "=", "alt.cocktail_id")
        .andOn("req.ingredient_id", "=", "alt.original_ingredient_id");
    })
    // === YENİ GÜNCELLEME (EKSİK 3 - "Pro" Tıklaması) ===
    // 'recipe_alternatives' tablosu bize sadece alternatifin ID'sini (alternative_ingredient_id) verir.
    // Bize o ID'nin 'adı' (örn: "Votka") lazım.
    // Bu yüzden 'ingredients' tablosunu İKİNCİ KEZ, 'alt_ing' adıyla ('alias') JOIN ediyoruz.
    //
    .leftJoin(
      "ingredients as alt_ing",
      "alt.alternative_ingredient_id",
      "alt_ing.ingredient_id"
    )

    // GÜNCELLEME: 'select' kısmını 'has_alternative' bayrağını (flag) içerecek şekilde güncelledik.
    // 'knex.raw' kullanarak bir SQL 'CASE' (Durum) ifadesi yazıyoruz.
    .select(
      "req.requirement_id",
      "ing.ingredient_id", // (Pro özelliğinde tıklama için ID'yi de alalım)

      // DİLLİ ALANLAR (TÜMÜ):
      "ing.name_tr", // Malzeme Adı TR
      "ing.name_en", // Malzeme Adı EN

      "req.amount_tr", // Miktar TR
      "req.amount_en", // Miktar EN

      "lvl.level_name_tr", // Önem Seviyesi TR
      "lvl.level_name_en", // Önem Seviyesi EN
      "lvl.color_code",

      // PRO ALANLAR (DİLLİ - TÜMÜ):
      "alt.alternative_amount_tr", // Alternatif Miktarı TR
      "alt.alternative_amount_en", // Alternatif Miktarı EN

      "alt_ing.name_tr as alternative_name_tr", // Alternatif Adı TR
      "alt_ing.name_en as alternative_name_en", // Alternatif Adı EN

      // YENİ BAYRAK: Eğer 'alt.alternative_id' NULL değilse (yani bir alternatif bulunduysa)
      // 'has_alternative' sütununu 'true' (1) yap, yoksa 'false' (0) yap.
      db.raw(
        "CASE WHEN alt.alternative_id IS NOT NULL THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END as has_alternative"
      )
    )
    .where("req.cocktail_id", id); // Sadece bu kokteylin malzemelerini filtrele

  return {
    ...cocktail,
    ingredients: ingredients,
  };
};

module.exports = {
  getAllCocktails,
  getCocktailById,
};
