const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Dosya Yolları (Artık klasör değil, doğrudan dosya yolları)
const inputPath = path.join(__dirname, "../temp_images/raw/bar_shelf.png");
const outputPath = path.join(
  __dirname,
  "../temp_images/optimized/bar_shelf_optimized.png"
); // Çıktıyı .jpg yapıyoruz

async function processSingleImage() {
  try {
    // 1. Çıktı klasörü var mı kontrol et, yoksa oluştur
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 2. Giriş dosyası var mı kontrol et
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Hata: Kaynak dosya bulunamadı: ${inputPath}`);
      return;
    }

    console.log(`🚀 İşlem başlıyor: barmen_mascot.png...`);

    // 3. Sharp ile tek dosyayı işle
    await sharp(inputPath)
      .resize(300, 300, {
        fit: "cover",
        position: "center",
      })
      .jpeg({
        quality: 80,
        mozjpeg: true,
      })
      .toFile(outputPath);

    console.log(`✅ İşlem tamamlandı!`);
    console.log(`📍 Kayıt yeri: ${outputPath}`);
  } catch (error) {
    console.error("❌ Hata oluştu:", error);
  }
}

processSingleImage();
