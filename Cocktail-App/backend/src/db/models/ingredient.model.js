const knexConfig = require("../../../knexfile").development;
const db = require("knex")(knexConfig);

/**
 * @desc    Fetches all ingredients, joined with their categories, sorted by category and name.
 * @returns {Promise<Array>} An array of ingredient objects (e.g., [{ ingredient_id: 1, name: 'Beyaz Rom', category_name: 'Alkol' }])
 */
const getAllIngredients = (lang = "tr") => {
  const l = lang === "en" ? "en" : "tr";

  return db("ingredients as i")
    .join("ingredient_categories as c", "i.category_id", "c.category_id")
    .select(
      "i.ingredient_id",
      `i.name_${l} as name`,
      `c.category_name_${l} as category_name`
    )
    .orderBy(`c.category_name_${l}`, "asc")
    .orderBy(`i.name_${l}`, "asc");
};

module.exports = {
  getAllIngredients,
};
