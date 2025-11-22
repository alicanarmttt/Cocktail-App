const fs = require("fs");
const path = require("path");

// Dosya Yolları
const INPUT_FILE = path.join(__dirname, "final_seed_data.json");
const OUTPUT_FILE = path.join(__dirname, "final_cocktail_names.txt");

try {
  // Dosyayı Oku
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(
      "❌ HATA: 'final_seed_data.json' dosyası bulunamadı. Önce 'merge_and_finalize.js' scriptini çalıştır."
    );
    process.exit(1);
  }

  const rawData = fs.readFileSync(INPUT_FILE, "utf8");
  const cocktails = JSON.parse(rawData);

  // İsimleri al ve alfabetik sırala
  const names = cocktails.map((c) => c.name).sort((a, b) => a.localeCompare(b)); // A'dan Z'ye sırala

  // Konsola Yazdır (Hızlı kontrol için)
  console.log("📋 LİSTE ÖZETİ:");
  console.log("---------------------------------");
  names.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });
  console.log("---------------------------------");

  // Dosyaya Kaydet
  fs.writeFileSync(OUTPUT_FILE, names.join("\n"), "utf8");

  console.log(`✅ Toplam ${names.length} adet kokteyl listelendi.`);
  console.log(`💾 İsim listesi dosyaya kaydedildi: ${OUTPUT_FILE}`);
} catch (error) {
  console.error("Hata:", error.message);
}
