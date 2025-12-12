const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// Klasör Yolları
const rawFolder = path.join(__dirname, "../temp_images/raw");
const outputFolder = path.join(__dirname, "../temp_images/optimized");

async function processImages() {
  try {
    // Çıktı klasörü yoksa oluştur
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    // Klasördeki dosyaları oku
    const files = fs.readdirSync(rawFolder);

    for (const file of files) {
      // Sadece resim dosyalarını al (jpg, png, jpeg, webp)
      if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue;

      const inputPath = path.join(rawFolder, file);
      const outputPath = path.join(outputFolder, file.split(".")[0] + ".jpg"); // Hepsini JPG yapar

      console.log(`İşleniyor: ${file}...`);

      await sharp(inputPath)
        .resize(700, 700, {
          fit: "cover", // Resmi kırparak 700x700'e tam oturtur (sündürmez)
          position: "center", // Merkeze odaklanır
        })
        .jpeg({
          quality: 80, // Kalite %80 (Gözle görülür fark az, boyut çok düşer)
          mozjpeg: true, // Daha iyi sıkıştırma algoritması kullan
        })
        .toFile(outputPath);

      console.log(`✅ Tamamlandı: ${file}`);
    }

    console.log(
      "\n🚀 Tüm resimler optimize edildi! 'temp_images/optimized' klasörüne bak."
    );
  } catch (error) {
    console.error("Hata:", error);
  }
}

processImages();
