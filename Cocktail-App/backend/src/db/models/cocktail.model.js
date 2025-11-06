const knexConfig = require("../../../knexfile.js").development; // Knex will start with development settings.

const db = require("knex")(knexConfig); //db object is tool to speak with database.

//Tüm kokteylleri veritabanından getiren fonksiyon.
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
const getCocktailById = (id) => {
  return db("cocktails").where({ cocktail_id: id }).first();
};

module.exports = {
  getAllCocktails,
  getCocktailById,
};
