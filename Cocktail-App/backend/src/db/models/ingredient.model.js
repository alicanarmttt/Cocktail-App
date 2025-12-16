const knex = require("../knex");
/**
 * @desc    Tüm malzemeleri kategorileriyle birlikte getirir.
 * @returns {Promise<Array>} { ingredient_id, name: {en, tr}, category_name: {en, tr} }
 */
const getAllIngredients = () => {
  return (
    db("ingredients as i")
      .join("ingredient_categories as c", "i.category_id", "c.category_id")
      .select(
        "i.ingredient_id",
        "i.name", // { en: "Rum", tr: "Rom" }
        "c.category_name" // { en: "Spirits", tr: "Ana İçkiler" }
      )
      // Sıralama: Önce Kategori (İngilizceye göre), Sonra Malzeme Adı (İngilizceye göre)
      // Not: ->> operatörü JSON içindeki değeri metin olarak okur.
      .orderByRaw("c.category_name->>'en' ASC")
      .orderByRaw("i.name->>'en' ASC")
  );
};

module.exports = {
  getAllIngredients,
};
