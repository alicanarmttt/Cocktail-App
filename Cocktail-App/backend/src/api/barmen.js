const express = require("express");
const router = express.Router();

// Adım 1'de oluşturduğumuz "BEYİN" (Model/Veritabanı Mantığı) dosyasını içe aktar
const { findRecipesByIngredients } = require("../db/models/barmen.model");

/**
 * @route   POST /api/barmen/find-recipes
 * @desc    Malzeme ID listesine (ve moda) göre akıllı kokteyl filtrelemesi yapar
 * @access  Public
 */
router.post("/find-recipes", async (req, res) => {
  try {
    // 1. Frontend'den (AssistantScreen) gelen veriyi 'req.body' içinden al
    const { inventoryIds, mode } = req.body;

    // 2. Gelen veriyi doğrula (Temel Güvenlik)
    if (!inventoryIds || !Array.isArray(inventoryIds)) {
      // Frontend'in 'inventoryIds' dizisini göndermesi zorunludur
      return res
        .status(400) // 400 = Bad Request (Hatalı İstek)
        .json({ msg: "inventoryIds alanı zorunludur ve bir dizi olmalıdır." });
    }

    // 3. Mod Belirleme (Akıllı Varsayılan)
    // Eğer frontend 'mode' göndermediyse, otomatik olarak 'flexible' (Akıllı Sıralama) yap.

    const searchMode = mode || "flexible";

    // 3. Veri geçerliyse, "BEYNİ" (Model) çağır
    // Model dosyamızdaki o karmaşık Knex sorgusu burada çalışır
    const cocktails = await findRecipesByIngredients(inventoryIds, searchMode);

    // 4. Sonucu (filtrelenmiş kokteyl listesini) frontend'e geri gönder
    res.status(200).json(cocktails);
  } catch (error) {
    // 5. Veritabanı sorgusunda vb. bir hata olursa yakala
    console.error("Hata (/api/barmen/find-recipes):", error.message);
    res.status(500).json({ msg: "Sunucu Hatası" });
  }
});

// Bu router'ı 'server.js' dosyasında kullanmak için dışa aktar
module.exports = router;
