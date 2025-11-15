const express = require("express");
const router = express.Router();

// Adım 4.A'da oluşturduğumuz "BEYİN" (Model/Veritabanı Mantığı) dosyasını içe aktar
// (Sağdaki user.model.js dosyasından)
const { findOrCreateUser } = require("../db/models/user.model");

/**
 * @route   POST /api/users/loginOrRegister
 * @desc    Kullanıcıyı Firebase UID ile senkronize eder.
 * DB'de yoksa 'is_pro: false' ile oluşturur, varsa mevcut veriyi döndürür.
 * @access  Public (Firebase tarafından zaten doğrulanmış)
 */
router.post("/loginOrRegister", async (req, res) => {
  try {
    // 1. Frontend'den (Firebase'den) gelen 'firebase_uid' ve 'email'i al
    const { firebase_uid, email } = req.body;

    // 2. Gelen veriyi doğrula
    if (!firebase_uid || !email) {
      return res
        .status(400) // 400 = Bad Request (Hatalı İstek)
        .json({ msg: "firebase_uid ve email alanları zorunludur." });
    }

    // 3. Veri geçerliyse, "BEYNİ" (Model) çağır
    // (Bu, 'users' tablosunu kontrol edecek, gerekirse yeni kullanıcı oluşturacak)
    const user = await findOrCreateUser(firebase_uid, email);

    // 4. Sonucu (bizim DB'mizdeki 'is_pro' bayrağını içeren kullanıcı objesi)
    // frontend'e (userSlice'a) geri gönder
    res.status(200).json(user);
  } catch (error) {
    // 5. Veritabanı sorgusunda vb. bir hata olursa yakala
    console.error("Hata (/api/users/loginOrRegister):", error.message, {
      requestBody: req.body, // Hata ayıklama için gelen body'yi logla
    });
    res.status(500).json({ msg: "Sunucu Hatası", error: error.message });
  }
});

// Bu router'ı 'server.js' dosyasında kullanmak için dışa aktar
module.exports = router;
