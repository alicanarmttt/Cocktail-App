require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const knexConfig = require("../knexfile").development; // Gerekirse production yap
const db = require("knex")(knexConfig);

// Cloudinary Ayarları
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function migrateImages() {
  console.log("🚀 Resim Göçü Başlıyor...");
  const failedList = [];

  try {
    // 1. Tüm kokteylleri çek
    const cocktails = await db("cocktails").select(
      "cocktail_id",
      "name",
      "image_url"
    );
    console.log(`Toplam ${cocktails.length} kokteyl işlenecek.`);

    for (const cocktail of cocktails) {
      // Güvenlik: İsim yoksa 'Unknown' de
      const cName = cocktail.name?.en || `Kokteyl #${cocktail.cocktail_id}`;

      // A) Eğer zaten Cloudinary linkiyse atla (Tekrar yükleme)
      if (cocktail.image_url && cocktail.image_url.includes("cloudinary.com")) {
        console.log(`⏩ [ATLANDI] ${cName} zaten taşınmış.`);
        continue;
      }

      // B) Link boşsa listeye ekle
      if (!cocktail.image_url) {
        console.log(`⚠️ [BOŞ] ${cName} resim linki yok.`);
        failedList.push({
          id: cocktail.cocktail_id,
          name: cName,
          reason: "Link Yok",
        });
        continue;
      }

      console.log(`uploading -> [${cName}]...`);

      try {
        // 2. Cloudinary'ye Yükle (İsimlendirme: cocktail_ID)
        // Cloudinary URL'den resmi kendi çeker, indirmenize gerek yok.
        const uploadResult = await cloudinary.uploader.upload(
          cocktail.image_url,
          {
            folder: "cocktail_app", // Cloudinary klasör adı
            public_id: `cocktail_${cocktail.cocktail_id}`, // ÖNEMLİ: Dosya adı ID ile eşleşir
            overwrite: true, // Varsa üzerine yaz
          }
        );

        // 3. Veritabanını Güncelle
        await db("cocktails")
          .where("cocktail_id", cocktail.cocktail_id)
          .update({ image_url: uploadResult.secure_url });

        console.log(`✅ [BAŞARILI] ${cName} -> Cloudinary'ye taşındı.`);
      } catch (error) {
        // Link patlaksa (404) buraya düşer
        console.error(`❌ [HATA] ${cName} yüklenemedi. (Link bozuk olabilir)`);
        failedList.push({
          id: cocktail.cocktail_id,
          name: cName,
          reason: "Link Bozuk / 404",
        });
      }

      // API'yi boğmamak için minik bekleme
      // await new Promise(r => setTimeout(r, 200));
    }

    // --- SONUÇ RAPORU ---
    console.log("\n------------------------------------------------");
    console.log("🎉 GÖÇ İŞLEMİ BİTTİ!");
    console.log(`✅ Başarılı: ${cocktails.length - failedList.length}`);
    console.log(`❌ Hatalı: ${failedList.length}`);
    console.log("------------------------------------------------");

    if (failedList.length > 0) {
      console.log("👇 MANUEL DÜZELTİLMESİ GEREKENLER 👇");
      failedList.forEach((item) => {
        console.log(`ID: ${item.id} | ${item.name} | ${item.reason}`);
      });
      console.log("------------------------------------------------");
    }
  } catch (err) {
    console.error("Genel Script Hatası:", err);
  } finally {
    db.destroy(); // Bağlantıyı kes
  }
}

migrateImages();
