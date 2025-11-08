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
    .select("ing.name", "req.amount", "lvl.level_name", "lvl.color_code")
    .where("req.cocktail_id", id);

  return {
    ...cocktail, // { name: 'Mojito', instructions: '...', ... }
    ingredients: ingredients, // [ { name: 'Beyaz Rom', amount: '60 ml', ... }, ... ]
  };
};

module.exports = {
  getAllCocktails,
  getCocktailById,
};
