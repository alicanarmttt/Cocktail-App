const express = require("express");
const router = express.Router();

// Modeli import et
const rouletteModel = require("../db/models/roulette.model");

/**
 * @route   POST /api/roulette/get-pool
 * @desc    Rulet için kokteyl havuzunu getirir
 */
router.post("/get-pool", async (req, res) => {
  try {
    // 1. İsteği Al
    const { mode, filter } = req.body;

    // 2. Basit Kontrol
    if (!mode) {
      return res.status(400).json({ msg: "Mode parametresi zorunludur." });
    }

    // 3. Modele Sor (Veritabanı İşlemi)
    const pool = await rouletteModel.getRoulettePool(mode, filter);

    // 4. Sonuç Kontrolü
    if (!pool || pool.length === 0) {
      return res
        .status(404)
        .json({ msg: "Bu kriterlere uygun kokteyl bulunamadı." });
    }

    // 5. Karıştırma (Shuffle) - Opsiyonel ama Rulet için iyidir
    // (Veritabanından sıralı gelebilir, biz karıştıralım)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // 6. Cevabı Dön
    res.status(200).json(pool);
  } catch (error) {
    console.error("Rulet Route Hatası:", error);
    res.status(500).json({ msg: "Sunucu hatası." });
  }
});

module.exports = router;
