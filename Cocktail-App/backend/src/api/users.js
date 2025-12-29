const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

const {
  findOrCreateUser,
  upgradeUserToPro,
  deleteUser,
  updateUserAvatar,
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

/**
 * @route   PUT /api/users/me/avatar
 * @desc    Kullanıcının profil avatarını günceller.
 * @access  Private
 */
router.put("/me/avatar", async (req, res) => {
  try {
    const firebase_uid = req.user?.uid; // Middleware'den geliyor
    const { avatar_id } = req.body; // Frontend'den { avatar_id: 2 } gibi gelecek

    if (!firebase_uid) {
      return res.status(401).json({ msg: "Yetkisiz işlem." });
    }

    if (!avatar_id) {
      return res.status(400).json({ msg: "Avatar ID gerekli." });
    }

    // Veritabanını güncelle
    const updatedUserArray = await updateUserAvatar(firebase_uid, avatar_id);

    // Knex .returning('*') array döner, ilk elemanı alalım
    const updatedUser = updatedUserArray[0];

    res.status(200).json({
      msg: "Avatar güncellendi.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Avatar update error:", error);
    res.status(500).json({ msg: "Avatar güncellenemedi." });
  }
});

/**
 * @route   DELETE /api/users/me
 * @desc    Kullanıcı hesabını hem Firebase'den hem DB'den kalıcı siler.
 * @access  Private (Token gerekli)
 */
router.delete("/me", async (req, res) => {
  try {
    // 1. Güvenlik Kontrolü: Middleware (verifyToken) sayesinde req.user var mı?
    // (Bunu server.js'de app.use('/api/users', verifyToken, usersRoutes) diyerek
    // bağladıysak req.user zaten vardır. Eğer bağlamadıysak buraya middleware eklemeliyiz.)
    // Biz seninle server.js'yi henüz tam yapılandırmadık sanırım,
    // o yüzden garanti olsun diye ID'yi şimdilik req.user'dan almayı deneyelim.

    // NOT: authMiddleware'i route seviyesinde kullanmak daha güvenlidir.
    // Eğer server.js'de global vermediysen, bu kodun çalışması için middleware'i import etmelisin.
    // Ama şimdilik senin yapında req.user.uid'nin geldiğini varsayıyoruz.

    const firebase_uid = req.user?.uid;

    if (!firebase_uid) {
      return res
        .status(401)
        .json({ msg: "Yetkisiz işlem: Kullanıcı tanınamadı." });
    }

    console.log(`🗑️ Hesap Silme İsteği: ${firebase_uid}`);

    // 2. Firebase Auth'tan Sil (Artık giriş yapamaz)
    try {
      await admin.auth().deleteUser(firebase_uid);
      console.log("✅ Firebase kullanıcısı silindi.");
    } catch (fbError) {
      // Kullanıcı Firebase'de zaten yoksa (nadir durum), akışı bozma devam et
      console.warn(
        "⚠️ Firebase silme uyarısı (Önemli olmayabilir):",
        fbError.message
      );
    }

    // 3. Kendi Veritabanımızdan (PostgreSQL) Sil
    const deletedCount = await deleteUser(firebase_uid);
    console.log(`✅ Veritabanından silinen kayıt sayısı: ${deletedCount}`);

    // 4. Başarılı Cevap Dön
    res.status(200).json({ msg: "Hesabınız başarıyla silindi. Elveda!" });
  } catch (error) {
    console.error("❌ Hesap silme hatası:", error);
    res.status(500).json({ msg: "Hesap silinirken bir hata oluştu." });
  }
});

// Bu router'ı 'server.js' dosyasında kullanmak için dışa aktar
module.exports = router;
