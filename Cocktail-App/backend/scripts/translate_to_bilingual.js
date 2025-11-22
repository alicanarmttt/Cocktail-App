const fs = require("fs");
const path = require("path");
const translate = require("google-translate-api-x");

const INPUT_FILE = path.join(__dirname, "final_seed_data.json");
const OUTPUT_FILE = path.join(__dirname, "bilingual_seed_data.json");

// Google bizi engellemesin diye bekleme fonksiyonu
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function translateText(text) {
  if (!text || text.trim() === "") return "";
  try {
    // Otomatik çeviri isteği
    const res = await translate(text, { to: "tr" });
    return res.text;
  } catch (err) {
    console.error(`❌ Çeviri Hatası (${text}):`, err.message);
    return text; // Hata olursa orijinalini döndür
  }
}

async function processCocktails() {
  try {
    if (!fs.existsSync(INPUT_FILE)) {
      console.error("❌ HATA: final_seed_data.json bulunamadı!");
      return;
    }

    const rawData = fs.readFileSync(INPUT_FILE, "utf8");
    const cocktails = JSON.parse(rawData);
    const translatedCocktails = [];

    console.log(
      `🌍 ${cocktails.length} kokteyl çevriliyor... Bu işlem biraz sürebilir.`
    );

    for (let i = 0; i < cocktails.length; i++) {
      const c = cocktails[i];
      console.log(`[${i + 1}/${cocktails.length}] Çevriliyor: ${c.name}...`);

      // --- ANA VERİLERİ ÇEVİR ---
      const nameTr = await translateText(c.name);
      await sleep(200); // Bekle

      const instructionsTr = await translateText(c.instructions);
      await sleep(200);

      const glassTr = await translateText(c.glass_type);
      await sleep(200);

      const tagsTr = await translateText(c.tags);
      await sleep(200);

      const historyTr = c.history_notes
        ? await translateText(c.history_notes)
        : null;
      await sleep(200);

      // --- MALZEMELERİ ÇEVİR ---
      const newIngredients = [];
      for (const ing of c.ingredients) {
        const ingNameTr = await translateText(ing.name);
        await sleep(100);

        const amountTr = await translateText(ing.amount); // "Juice of 1" -> "1 suyu"
        await sleep(100);

        // Alternatifleri işle
        const newAlternatives = [];
        if (ing.alternatives) {
          for (const alt of ing.alternatives) {
            const altNameTr = await translateText(alt.name);
            await sleep(100);
            const altAmountTr = alt.amount
              ? await translateText(alt.amount)
              : amountTr;

            newAlternatives.push({
              name_en: alt.name,
              name_tr: altNameTr,
              amount_en: alt.amount || ing.amount,
              amount_tr: altAmountTr,
              category: alt.category,
            });
          }
        }

        newIngredients.push({
          name_en: ing.name,
          name_tr: ingNameTr,
          amount_en: ing.amount,
          amount_tr: amountTr,
          category: ing.category,
          importance: ing.importance,
          alternatives: newAlternatives,
        });
      }

      // --- YENİ OBJEYİ OLUŞTUR ---
      translatedCocktails.push({
        api_id: c.api_id,
        // İsimler
        name_en: c.name,
        name_tr: nameTr,
        // Tarifler
        instructions_en: c.instructions,
        instructions_tr: instructionsTr,
        // Diğer Bilgiler
        glass_type_en: c.glass_type,
        glass_type_tr: glassTr,
        tags_en: c.tags,
        tags_tr: tagsTr,
        history_notes_en: c.history_notes,
        history_notes_tr: historyTr,
        // Ortak Alanlar
        is_alcoholic: c.is_alcoholic,
        image_url: c.image_url,
        // Malzemeler
        ingredients: newIngredients,
      });
    }

    // Dosyayı Kaydet
    fs.writeFileSync(
      OUTPUT_FILE,
      JSON.stringify(translatedCocktails, null, 2),
      "utf8"
    );
    console.log("✅ ÇEVİRİ TAMAMLANDI!");
    console.log(`📂 Yeni dosya: ${OUTPUT_FILE}`);
    console.log(
      "👉 Lütfen bu dosyayı açıp 'Lime Suyu' vb. garip çevirileri manuel düzelt."
    );
  } catch (error) {
    console.error("Genel Hata:", error);
  }
}

processCocktails();
