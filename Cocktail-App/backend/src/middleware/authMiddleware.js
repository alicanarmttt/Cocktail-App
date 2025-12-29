const admin = require("firebase-admin");
const path = require("path");

// Firebase Admin'i başlat
// Sadece bir kez başlatıldığından emin olmak için kontrol ediyoruz
if (!admin.apps.length) {
  try {
    let credential;

    // YÖNTEM 1: Önce .env dosyasındaki değişkenlere bak (Tavsiye Edilen)
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // .env dosyasındaki \n karakterlerini gerçek yeni satıra çeviriyoruz
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      });
      console.log("Firebase Admin SDK (.env) ile başlatıldı.");
    }
    // YÖNTEM 2: .env yoksa, yerel dosya yolunu dene (Yedek)
    else {
      const serviceAccountPath = path.join(
        __dirname,
        "../../serviceAccountKey.json"
      );
      credential = admin.credential.cert(require(serviceAccountPath));
      console.log("Firebase Admin SDK (JSON dosyası) ile başlatıldı.");
    }

    admin.initializeApp({
      credential: credential,
    });
  } catch (error) {
    console.error("Firebase Admin başlatılamadı:", error.message);
    console.error(
      "Lütfen .env dosyasında FIREBASE_PRIVATE_KEY ve FIREBASE_CLIENT_EMAIL tanımlı olduğundan veya serviceAccountKey.json dosyasının bulunduğundan emin olun."
    );
  }
}

/**
 * @desc  Firebase Token Doğrulama Middleware'i
 * İstek başlığındaki (Header) 'Authorization' bilgisini kontrol eder.
 */
const verifyToken = async (req, res, next) => {
  try {
    const tokenHeader = req.headers.authorization;

    // 1. Token var mı ve formatı "Bearer <token>" mi?
    if (!tokenHeader || !tokenHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Yetkisiz Erişim (Unauthorized)",
        message: "Erişim token'ı bulunamadı veya hatalı format.",
      });
    }

    // "Bearer " kısmını atıp sadece token'ı al
    const token = tokenHeader.split(" ")[1];

    // 2. Token'ı Firebase'e sor
    const decodedToken = await admin.auth().verifyIdToken(token);

    // 3. Token geçerliyse, kullanıcı bilgisini request'e ekle
    req.user = decodedToken;

    // 4. Devam et
    next();
  } catch (error) {
    console.error("Token doğrulama hatası:", error.message);
    return res.status(403).json({
      error: "Yasaklı Erişim (Forbidden)",
      message: "Token geçersiz veya süresi dolmuş.",
    });
  }
};

module.exports = verifyToken;
