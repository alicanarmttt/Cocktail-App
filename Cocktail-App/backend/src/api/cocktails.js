const express = require("express");
const router = express.Router();

const CocktailModel = require("../db/models/cocktail.model");

//Routes

// (GET /api/cocktails) - Tüm kokteylleri listeler
/**
 * @route   GET /api/cocktails
 * @desc    Get all cocktails
 * @access  Public
 */

router.get("/", async (req, res) => {
  try {
    // 1. Query'den dili al (Varsayılan: 'tr')
    const lang = req.query.lang || "tr";

    const cocktails = await CocktailModel.getAllCocktails();
    res.status(200).json(cocktails);
  } catch (error) {
    res.status(500).json({
      error: "Error fetching cocktails.",
      details: error.message,
    });
  }
});

// (GET /api/cocktails/:id) - ID'ye göre tek bir kokteyl getirir
/**
 * @route   GET /api/cocktails/:id
 * @desc    Get a single cocktail by ID
 * @access  Public
 * @param   {string} req.params.id - The ID of the cocktail
 * @returns {Object} The cocktail object
 */
router.get("/:id", async (req, res) => {
  try {
    const lang = req.query.lang || "tr";
    const { id } = req.params;
    const cocktail = await CocktailModel.getCocktailById(id, lang);
    if (cocktail) {
      res.status(200).json(cocktail);
    } else {
      res.status(404).json({ error: "Cocktail not found" });
    }
  } catch (error) {
    res.status(500).json({
      error: "Error fetching cocktails",
      details: error.message,
    });
  }
});

module.exports = router;
