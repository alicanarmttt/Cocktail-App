require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const knexConfig = require("../knexfile").development;
const db = require("knex")(knexConfig);

// Cloudinary Ayarları
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Sorunlu olduğunu bildiğin ID'leri buraya yaz
const problemIds = [54, 55, 56, 57, 58, 59, 62, 65, 66, 69]; // <--- BURAYI GÜNCELLE (O 10 kokteylin ID'si)

async function fixLinks() {
  console.log("🔧 Link Onarım Aracı Çalışıyor...");

  try {
    for (const id of problemIds) {
      console.log(`🔍 ID ${id} için Cloudinary aranıyor...`);

      // 1. Cloudinary'de ara (Public ID'ye göre)
      // "cocktail_app/cocktail_66" gibi bir prefix ile arayacağız
      const result = await cloudinary.search
        .expression(
          `resource_type:image AND folder:cocktail_app AND filename:cocktail_${id}*`
        )
        .sort_by("created_at", "desc")
        .max_results(1)
        .execute();

      if (result.resources && result.resources.length > 0) {
        // Bulunan en son yüklenen resmin güvenli linkini al
        const correctUrl = result.resources[0].secure_url;
        console.log(`✅ BULUNDU! Yeni Link: ${correctUrl}`);

        // 2. Veritabanını güncelle
        await db("cocktails")
          .where("cocktail_id", id)
          .update({ image_url: correctUrl });

        console.log(`💾 ID ${id} veritabanında güncellendi.`);
      } else {
        console.log(`❌ ID ${id} Cloudinary'de bulunamadı!`);
        console.log(
          `   İpucu: Cloudinary'de dosya adının 'cocktail_${id}' ile başladığından emin ol.`
        );
      }
    }

    console.log("\n🎉 İşlem Tamamlandı!");
  } catch (error) {
    console.error("Hata:", error);
  } finally {
    db.destroy();
  }
}

fixLinks();
