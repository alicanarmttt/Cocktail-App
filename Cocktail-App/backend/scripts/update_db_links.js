require("dotenv").config();
const knexConfig = require("../knexfile").development;
const db = require("knex")(knexConfig);

// AYARLAR
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const FOLDER_NAME = "cocktail_app"; // Cloudinary'de oluşturduğun klasör adı

async function syncLinks() {
  console.log("🔗 Veritabanı Link Senkronizasyonu Başlıyor...");

  if (!CLOUD_NAME) {
    console.error("❌ HATA: .env dosyasında CLOUDINARY_CLOUD_NAME eksik!");
    process.exit(1);
  }

  try {
    // 1. Tüm kokteylleri çek (Sadece ID ve İsim lazım)
    const cocktails = await db("cocktails").select("cocktail_id", "name");
    console.log(`📂 Toplam ${cocktails.length} kokteyl güncellenecek.`);

    let successCount = 0;

    for (const cocktail of cocktails) {
      const id = cocktail.cocktail_id;
      // İsim objesi JSONB olduğu için güvenli alalım
      const cName = cocktail.name?.en || `Kokteyl #${id}`;

      // 2. Yeni Linki Oluştur
      // Yapı: https://res.cloudinary.com/[CLOUD_NAME]/image/upload/[FOLDER]/cocktail_[ID].jpg
      // Not: Cloudinary formatı otomatik algılar ama .jpg eklemek çoğu durumda güvenlidir.
      const newUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${FOLDER_NAME}/cocktail_${id}.jpg`;

      // 3. Veritabanını Güncelle
      await db("cocktails")
        .where("cocktail_id", id)
        .update({ image_url: newUrl });

      // Konsolu boğmamak için sadece her 10 tanede bir veya hata olursa log basabiliriz
      // Ama görmek istersen hepsini bas:
      // console.log(`✅ [${id}] ${cName} -> Link güncellendi.`);

      successCount++;
    }

    console.log("\n------------------------------------------------");
    console.log("🎉 İŞLEM TAMAMLANDI!");
    console.log(
      `✅ Toplam ${successCount} kokteylin resim adresi güncellendi.`
    );
    console.log(
      `🔗 Örnek Yeni Link: https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${FOLDER_NAME}/cocktail_1.jpg`
    );
    console.log("------------------------------------------------");
  } catch (error) {
    console.error("❌ Genel Hata:", error);
  } finally {
    db.destroy();
  }
}

syncLinks();
