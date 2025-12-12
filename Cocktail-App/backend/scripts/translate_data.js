// scripts/translate_data.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// AYARLAR
const INPUT_FILE = path.join(__dirname, "data", "pg_cocktails.json");
const OUTPUT_FILE = path.join(__dirname, "data", "multilingual_cocktails.json");
const TARGET_LANGS = ["es", "fr", "de", "it"]; // İspanyolca, Fransızca, Almanca, İtalyanca

// Gemini Başlat
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Gecikme Fonksiyonu (Rate Limit yememek için)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error("❌ Dosya bulunamadı:", INPUT_FILE);
    return;
  }

  const cocktails = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  console.log(
    `🚀 Toplam ${cocktails.length} kokteyl çevrilecek. Başlıyoruz...`
  );

  const enrichedCocktails = [];

  for (let i = 0; i < cocktails.length; i++) {
    const cocktail = cocktails[i];
    console.log(
      `[${i + 1}/${cocktails.length}] Çevriliyor: ${cocktail.name.en}...`
    );

    try {
      // Prompt Hazırlama
      const prompt = `
        You are a professional translator API. 
        I will give you a JSON object representing a cocktail data. 
        The object currently has "en" and "tr" keys for fields like "name", "instructions", "glass_type", "history_notes", "tags", and inside "ingredients".
        
        YOUR TASK:
        Add translations for the following languages: ${JSON.stringify(
          TARGET_LANGS
        )} to every object that already has "en" and "tr".
        
        RULES:
        1. Return ONLY the valid JSON object. Do not add markdown formatting like \`\`\`json.
        2. Keep all existing data (en/tr) exactly as is.
        3. Translate strictly and professionally.
        4. For "tags", add the new languages to the array object.
        5. Do NOT translate technical IDs or numbers.

        Here is the JSON object:
        ${JSON.stringify(cocktail)}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Temizlik (Bazen markdown ile dönebiliyor)
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const enrichedData = JSON.parse(text);
      enrichedCocktails.push(enrichedData);

      console.log(`✅ Tamamlandı.`);
    } catch (error) {
      console.error(`⚠️ Hata oluştu (${cocktail.name.en}):`, error.message);
      // Hata olsa bile orijinal veriyi koruyarak ekleyelim ki veri kaybı olmasın
      enrichedCocktails.push(cocktail);
    }

    // 4 Saniye Bekle (Dakikada 15 istek sınırını aşmamak için)
    await delay(4000);
  }

  // Kaydet
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(enrichedCocktails, null, 2));
  console.log(`\n🎉 BİTTİ! Dosya kaydedildi: ${OUTPUT_FILE}`);
  console.log(
    `Şimdi Seed dosyasındaki DATA_PATH yolunu bu yeni dosya ile değiştirip seed işlemini yapabilirsin.`
  );
}

main();
