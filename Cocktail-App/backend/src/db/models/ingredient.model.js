const knexConfig = require("../../../knexfile").development;
const db = require("knex")(knexConfig);

/**
 * @desc    Fetches all ingredients, joined with their categories, sorted by category and name.
 * @returns {Promise<Array>} An array of ingredient objects (e.g., [{ ingredient_id: 1, name: 'Beyaz Rom', category_name: 'Alkol' }])
 */
const getAllIngredients = () => {
  return db("ingredients as i")
    .join("ingredient_categories as c", "i.category_id", "c.category_id")
    .select("i.ingredient_id", "i.name", "c.category_name")
    .orderBy("c.category_name", "asc")
    .orderBy("i.name", "asc");
};

module.exports = {
  getAllIngredients,
};
