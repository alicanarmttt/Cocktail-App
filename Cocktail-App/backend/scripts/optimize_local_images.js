const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// 1. Klasör Yolları
const inputDir = path.join(__dirname, "../temp_images/raw");
const outputDir = path.join(__dirname, "../temp_images/optimized");

async function processAllImages() {
  try {
    // Çıktı klasörü yoksa oluştur
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Giriş klasörü var mı kontrol et
    if (!fs.existsSync(inputDir)) {
      console.error(`❌ Hata: Kaynak klasör bulunamadı: ${inputDir}`);
      return;
    }

    const files = fs.readdirSync(inputDir);
    console.log(`📂 Klasör taranıyor... Toplam ${files.length} dosya bulundu.`);

    for (const file of files) {
      // Sadece resim dosyalarını filtrele
      if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) {
        continue;
      }

      const inputPath = path.join(inputDir, file);
      const fileNameWithoutExt = path.parse(file).name;

      // DİKKAT: Çıktı uzantısını .png yapıyoruz
      const outputFilename = `${fileNameWithoutExt}_optimized.png`;
      const outputPath = path.join(outputDir, outputFilename);

      console.log(`⚙️ İşleniyor: ${file} -> ${outputFilename}`);

      // --- SHARP İŞLEMİ (GÜNCELLENDİ) ---
      await sharp(inputPath)
        .resize(300, 300, {
          fit: "cover", // Resmi kareye sığdırır, taşanları kırpar
          position: "center",
          // Arka planın saydam kalmasını garantiye alalım (resize sırasında boşluk kalırsa)
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({
          // PNG Ayarları (Saydamlığı korur)
          compressionLevel: 9, // En yüksek sıkıştırma (0-9 arası) - Dosya boyutu küçülür
          adaptiveFiltering: true, // Daha iyi sıkıştırma sağlar
          force: true, // Giriş jpg olsa bile zorla png yap
          quality: 80, // (Bazı sharp versiyonlarında png kalitesini de etkiler)
          // palette: true // Eğer resimlerin basit ikonlarsa bunu açabilirsin, fotoğrafsa kapalı kalsın.
        })
        .toFile(outputPath);
    }

    console.log(`✅ Tüm işlemler başarıyla tamamlandı!`);
    console.log(`📍 Kayıt yeri: ${outputDir}`);
  } catch (error) {
    console.error("❌ Bir hata oluştu:", error);
  }
}

processAllImages();
