const express = require("express");
const router = express.Router();
const favoriteModel = require("../models/favoriteModel"); // Model dosyanın yolu

// 1. GET: Kullanıcının favorilerini çek
// Modeldeki fonksiyon: getUserFavorites(userId)
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const favorites = await favoriteModel.getUserFavorites(userId);
    res.status(200).json(favorites);
  } catch (error) {
    console.error("Favorileri çekme hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// 2. POST: Favori ekle
// Modeldeki fonksiyon: addFavorite(userId, cocktailId)
router.post("/", async (req, res) => {
  const { userId, cocktailId } = req.body;
  try {
    // Önce var mı diye kontrol edelim (Senin findFavorite fonksiyonunla)
    const existing = await favoriteModel.findFavorite(userId, cocktailId);
    if (existing) {
      return res.status(400).json({ message: "Zaten favorilerde ekli." });
    }

    await favoriteModel.addFavorite(userId, cocktailId);
    res.status(201).json({ message: "Favorilere eklendi." });
  } catch (error) {
    console.error("Favori ekleme hatası:", error);
    res.status(500).json({ message: "Ekleme başarısız" });
  }
});

// 3. DELETE: Favori sil
// Modeldeki fonksiyon: removeFavorite(userId, cocktailId)
// DİKKAT: Modelin ID değil, userId ve cocktailId istiyor.
// Bu yüzden URL yapımız: /api/favorites/:userId/:cocktailId şeklinde olmalı.
router.delete("/:userId/:cocktailId", async (req, res) => {
  const { userId, cocktailId } = req.params;
  try {
    const deletedCount = await favoriteModel.removeFavorite(userId, cocktailId);

    if (deletedCount) {
      res.status(200).json({ message: "Favoriden çıkarıldı." });
    } else {
      res.status(404).json({ message: "Silinecek kayıt bulunamadı." });
    }
  } catch (error) {
    console.error("Favori silme hatası:", error);
    res.status(500).json({ message: "Silme başarısız" });
  }
});

module.exports = router;
