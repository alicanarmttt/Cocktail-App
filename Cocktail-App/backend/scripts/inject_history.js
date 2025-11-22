const fs = require("fs");
const path = require("path");

// Dosya Yolları
// Hedef: Senin veritabanına basacağın ana veri dosyan
const TARGET_FILE = path.join(__dirname, "bilingual_seed_data.json");
// Kaynak: Tarihçelerin olduğu dosya
const HISTORY_FILE = path.join(__dirname, "history_source.json");

try {
  console.log("📂 Dosyalar okunuyor...");

  if (!fs.existsSync(TARGET_FILE)) {
    throw new Error(`HEDEF DOSYA BULUNAMADI: ${TARGET_FILE}`);
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    throw new Error(
      `TARİHÇE DOSYASI BULUNAMADI: ${HISTORY_FILE} (Tarihçe listesini bu isimle kaydettin mi?)`
    );
  }

  // Dosyaları oku
  const targetCocktails = JSON.parse(fs.readFileSync(TARGET_FILE, "utf8"));
  const historyData = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));

  console.log(`📊 Ana dosyada ${targetCocktails.length} kokteyl var.`);
  console.log(`📜 Tarihçe dosyasında ${historyData.length} not var.`);

  let matchCount = 0;

  // Ana dosyadaki her kokteyl için dön
  const updatedCocktails = targetCocktails.map((cocktail) => {
    // İsme göre tarihçeyi bul (Büyük/küçük harf duyarlılığı olmadan)
    const historyEntry = historyData.find(
      (h) =>
        h.name.toLowerCase().trim() === cocktail.name_en.toLowerCase().trim()
    );

    if (historyEntry) {
      matchCount++;
      // Mevcut kokteyl objesini koru, sadece tarihçeleri ekle/güncelle
      return {
        ...cocktail,
        history_notes_en: historyEntry.history_notes_en,
        history_notes_tr: historyEntry.history_notes_tr,
      };
    } else {
      // Eşleşme yoksa olduğu gibi bırak (veya boş alan ekle)
      // history_notes_tr zaten vardı, history_notes_en ekleyelim ki seed patlamasın
      return {
        ...cocktail,
        history_notes_en: cocktail.history_notes_en || null,
        history_notes_tr: cocktail.history_notes_tr || null,
      };
    }
  });

  // Dosyanın üzerine yaz
  fs.writeFileSync(
    TARGET_FILE,
    JSON.stringify(updatedCocktails, null, 2),
    "utf8"
  );

  console.log("---------------------------------------------------");
  console.log(`✅ BAŞARILI! ${TARGET_FILE} güncellendi.`);
  console.log(`🔄 Toplam ${matchCount} kokteyle tarihçe eklendi.`);
  console.log("👉 Artık seed işlemini yapabilirsin.");
} catch (error) {
  console.error("❌ HATA:", error.message);
}
