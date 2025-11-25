const knexConfig = require("../../../knexfile").development;
const db = require("knex")(knexConfig);

/**
 * @desc    Fetches all ingredients, joined with their categories, sorted by category and name.
 * @returns {Promise<Array>} An array of ingredient objects (e.g., [{ ingredient_id: 1, name: 'Beyaz Rom', category_name: 'Alkol' }])
 */
const getAllIngredients = () => {
  return db("ingredients as i")
    .join("ingredient_categories as c", "i.category_id", "c.category_id")
    .select(
      "i.ingredient_id",
      // Malzeme İsimleri (Çift Dil)
      "i.name_tr",
      "i.name_en",
      // Kategori İsimleri (Çift Dil)
      "c.category_name_tr",
      "c.category_name_en"
    )
    .orderBy("c.category_name_tr", "asc")
    .orderBy("i.name_tr", "asc");
};

module.exports = {
  getAllIngredients,
};
