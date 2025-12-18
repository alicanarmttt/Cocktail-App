const express = require("express");
const router = express.Router();

// Model dosyasından hem eski arama fonksiyonunu hem de YENİ ipucu fonksiyonunu çekiyoruz
const {
  findRecipesByIngredients,
  getMenuHints, // <--- YENİ EKLENDİ
} = require("../db/models/barmen.model");

/**
 * @route   POST /api/barmen/find-recipes
 * @desc    Malzeme ID listesine göre kokteyl filtrelemesi yapar (Flexible Mod)
 */
router.post("/find-recipes", async (req, res) => {
  try {
    const { inventoryIds, mode } = req.body;

    if (!inventoryIds || !Array.isArray(inventoryIds)) {
      return res.status(400).json({ msg: "inventoryIds bir dizi olmalıdır." });
    }

    const searchMode = mode || "flexible";
    const cocktails = await findRecipesByIngredients(inventoryIds, searchMode);

    res.status(200).json(cocktails);
  } catch (error) {
    console.error("Hata (/api/barmen/find-recipes):", error.message);
    res.status(500).json({ msg: "Sunucu Hatası" });
  }
});

/**
 * @route   POST /api/barmen/hints
 * @desc    WIZARD MODU İÇİN: Seçilen ana içkilere uygun yancı malzemeleri getirir.
 * @access  Public
 */
router.post("/hints", async (req, res) => {
  try {
    // Frontend'den gelen 'baseSpiritIds' (Seçilen Cin, Votka vb. ID'leri)
    const { baseSpiritIds } = req.body;

    // Basit doğrulama
    if (!baseSpiritIds || !Array.isArray(baseSpiritIds)) {
      return res.status(400).json({ msg: "baseSpiritIds zorunludur." });
    }

    // Modeldeki yeni fonksiyonu çağır
    const hints = await getMenuHints(baseSpiritIds);

    // Sonucu (Tonik, Vermut listesi vb.) döndür
    res.status(200).json(hints);
  } catch (error) {
    console.error("Hata (/api/barmen/hints):", error.message);
    res.status(500).json({ msg: "İpuçları alınırken hata oluştu." });
  }
});

module.exports = router;
