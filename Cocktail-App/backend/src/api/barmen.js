const express = require("express");
const router = express.Router();

// Model dosyasından fonksiyonları çekiyoruz
const {
  findRecipesByIngredients,
  getMenuHints,
  getSpiritFamilies,
  getGuideStep2Options,
  findWizardResults,
  getGuideStep3Options,
} = require("../db/models/barmen.model");

// ============================================================
//              MEVCUT ENDPOINTLER (MANUEL MOD)
// ============================================================

/**
 * @route   POST /api/barmen/find-recipes
 * @desc    FLEXIBLE MOD (Mevcut Arama)
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
 * @desc    MANUEL MOD İPUÇLARI (Mevcut)
 */
router.post("/hints", async (req, res) => {
  try {
    const { baseSpiritIds } = req.body;

    if (!baseSpiritIds || !Array.isArray(baseSpiritIds)) {
      return res.status(400).json({ msg: "baseSpiritIds zorunludur." });
    }

    const hints = await getMenuHints(baseSpiritIds);
    res.status(200).json(hints);
  } catch (error) {
    console.error("Hata (/api/barmen/hints):", error.message);
    res.status(500).json({ msg: "İpuçları alınırken hata oluştu." });
  }
});

// ============================================================
//              YENİ REHBER (WIZARD) ENDPOINTLERİ
// ============================================================

/**
 * @route   GET /api/barmen/guide/step-1
 * @desc    Rehber Başlangıcı: Ana içki ailelerini getirir.
 * GÜNCELLEME: Lang parametresi kaldırıldı.
 */
router.get("/guide/step-1", async (req, res) => {
  try {
    // Model artık parametre almıyor, direkt tüm dilleri içeren objeyi dönüyor
    const families = await getSpiritFamilies();

    res.status(200).json(families);
  } catch (error) {
    console.error("Hata (/guide/step-1):", error.message);
    res.status(500).json({ msg: "Rehber verileri alınamadı." });
  }
});

/**
 * @route   POST /api/barmen/guide/step-2
 * @desc    Rehber Adım 2: Seçilen aileye uygun tamamlayıcıları getirir.
 * @body    { family: "whiskey" } -> Lang kaldırıldı
 */
router.post("/guide/step-2", async (req, res) => {
  try {
    const { family } = req.body;

    if (!family) {
      return res.status(400).json({ msg: "Bir içki grubu seçmelisiniz." });
    }

    const options = await getGuideStep2Options(family);

    res.status(200).json(options);
  } catch (error) {
    console.error("Hata (/guide/step-2):", error.message);
    res.status(500).json({ msg: "Seçenekler getirilemedi." });
  }
});

/**
 * @route   POST /api/barmen/guide/step-3
 * @desc    Rehber Adım 3: Taze malzemeleri getirir.
 * @body    { family: "whiskey", step2Ids: [...] } -> Lang kaldırıldı
 */
router.post("/guide/step-3", async (req, res) => {
  try {
    const { family, step2Ids } = req.body;

    if (!family) {
      return res.status(400).json({ msg: "Ana içki grubu eksik." });
    }

    const options = await getGuideStep3Options(family, step2Ids || []);

    res.status(200).json(options);
  } catch (error) {
    console.error("Hata (/guide/step-3):", error.message);
    res.status(500).json({ msg: "Adım 3 verileri alınamadı." });
  }
});

/**
 * @route   POST /api/barmen/guide/results
 * @desc    Rehber SONUCU
 * @body    { family: "whiskey", selectedIds: [12, 55] }
 */
router.post("/guide/results", async (req, res) => {
  try {
    const { family, selectedIds } = req.body;

    if (!family) {
      return res.status(400).json({ msg: "Ana içki grubu eksik." });
    }

    const results = await findWizardResults(family, selectedIds || []);

    res.status(200).json(results);
  } catch (error) {
    console.error("Hata (/guide/results):", error.message);
    res.status(500).json({ msg: "Sonuçlar hesaplanamadı." });
  }
});

module.exports = router;
