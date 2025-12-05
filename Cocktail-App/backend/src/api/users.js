const express = require("express");
const router = express.Router();

// Adım 4.A'da oluşturduğumuz "BEYİN" (Model/Veritabanı Mantığı) dosyasını içe aktar
// (Sağdaki user.model.js dosyasından)
const {
  findOrCreateUser,
  upgradeUserToPro,
} = require("../db/models/user.model");

/**
 * @route   POST /api/users/loginOrRegister
 * @desc    Kullanıcıyı Firebase UID ile senkronize eder.
 * DB'de yoksa 'is_pro: false' ile oluşturur, varsa mevcut veriyi döndürür.
 * @access  Public (Firebase tarafından zaten doğrulanmış)
 */
router.post("/loginOrRegister", async (req, res) => {
  try {
    // 1. UID'yi artık Body'den değil, Middleware'in çözdüğü Token'dan alıyoruz.
    // (server.js'de req.user = decodedToken yapmıştık)
    const firebase_uid = req.user.uid;

    // Email hala body'den gelebilir (veya token'ın içinde de vardır: req.user.email)
    // Şimdilik body'den almaya devam edelim, frontend gönderiyor.
    const { email } = req.body;

    // 2. Validasyon
    if (!firebase_uid) {
      // Bu hatayı alıyorsan Middleware (verifyToken) server.js'de bu rotaya eklenmemiş demektir!
      return res.status(401).json({ msg: "Kimlik doğrulanamadı (UID eksik)." });
    }

    if (!email) {
      return res.status(400).json({ msg: "Email alanı zorunludur." });
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

/**
 * @route   POST /api/users/upgrade-to-pro
 * @desc    Kullanıcının 'is_pro' bayrağını 'true' olarak günceller.
 * @access  (Şimdilik) Public / (Gelecekte) Güvenli
 */
router.post("/upgrade-to-pro", async (req, res) => {
  try {
    // GÜVENLİK DÜZELTMESİ:
    // Frontend artık body'de hiçbir şey göndermiyor (boş obje {}).
    // Kimin Pro olacağını Token'daki UID belirler.
    const firebase_uid = req.user.uid;

    if (!firebase_uid) {
      return res.status(400).json({ msg: "firebase_uid alanı zorunludur." });
    }

    const updatedUser = await upgradeUserToPro(firebase_uid);

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Hata (/api/user/upgrade-to-pro):", error.message, {
      requestBody: req.body,
    });
    res.status(500).json({ msg: "Sunucu hatası", error: error.message });
  }
});

// Bu router'ı 'server.js' dosyasında kullanmak için dışa aktar
module.exports = router;
