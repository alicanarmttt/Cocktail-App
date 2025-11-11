const knexConfig = require("../../../knexfile.js").development; // Knex will start with development settings.

const db = require("knex")(knexConfig); //db object is tool to speak with database.

/**
 * @desc    Fetches all cocktails from the database.
 * @returns {Promise<Array>} An array of cocktail objects
 */
const getAllCocktails = () => {
  // SQL Karşılığı: SELECT * FROM cocktails
  return db("cocktails").select("*");
};

//Tek bir kokteyli ID'sine göre getiren fonksiyon.
/**
 * @desc    Fetches a single cocktail by its ID.
 * @param   {number} id - The ID of the cocktail to search for
 * @returns {Promise<Object>} A single cocktail object
 */
const getCocktailById = async (id) => {
  const cocktail = await db("cocktails").where({ cocktail_id: id }).first();
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
    // GÜNCELLEME: 'select' kısmını 'has_alternative' bayrağını (flag) içerecek şekilde güncelledik.
    // 'knex.raw' kullanarak bir SQL 'CASE' (Durum) ifadesi yazıyoruz.
    .select(
      "req.requirement_id",
      "ing.ingredient_id", // (Pro özelliğinde tıklama için ID'yi de alalım)
      "ing.name",
      "req.amount",
      "lvl.level_name",
      "lvl.color_code",
      // YENİ BAYRAK: Eğer 'alt.alternative_id' NULL değilse (yani bir alternatif bulunduysa)
      // 'has_alternative' sütununu 'true' (1) yap, yoksa 'false' (0) yap.
      db.raw(
        "CASE WHEN alt.alternative_id IS NOT NULL THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END as has_alternative"
      )
    )
    .where("req.cocktail_id", id); // Sadece bu kokteylin malzemelerini filtrele
  return {
    ...cocktail, // { name: 'Mojito', instructions: '...', ... }
    ingredients: ingredients, // [ { name: 'Beyaz Rom', amount: '60 ml',  has_alternative: 1}, ... ]
  };
};

module.exports = {
  getAllCocktails,
  getCocktailById,
};
