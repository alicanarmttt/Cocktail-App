const express = require("express");
const router = express.Router();

// Yeni "Aşçı" (Model) dosyamızı içe aktarıyoruz
const IngredientModel = require("../db/models/ingredient.model");

/**
 * @route   GET /api/ingredients
 * @desc    Get all ingredients (for the Assistant "Pazar" screen)
 * @access  Public (veya ileride "Pro"ya özelse Private)
 */

router.get("/", async (req, res) => {
  try {
    const lang = req.query.lang || "tr"; // Dil seçimi
    const ingredients = await IngredientModel.getAllIngredients(lang);

    // Veriyi (17 malzeme) JSON olarak frontend'e gönderiyoruz
    res.status(200).json(ingredients);
  } catch (error) {
    res.status(500).json({
      error: "Error fetching ingredients list",
      details: error.message,
    });
  }
});

module.exports = router;
