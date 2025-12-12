const fs = require("fs");
const path = require("path");

// YOL AYARLARI:
const inputPath = path.join(__dirname, "data", "bilingual_seed_data.json");
const outputPath = path.join(__dirname, "data", "pg_cocktails.json");

// Yardımcı Fonksiyonlar
const createLangObj = (en, tr) => ({ en: en || "", tr: tr || "" });
const splitTags = (str) => (str ? str.split(",").map((s) => s.trim()) : []);

// YENİ: Malzeme dönüştürücü fonksiyon (Hem ana malzeme hem alternatifler için)
const transformIngredientStructure = (ing, isAlternative = false) => {
  const transformed = {
    name: createLangObj(ing.name_en, ing.name_tr),
    amount: createLangObj(ing.amount_en, ing.amount_tr),
    category: ing.category,
    // Alternatiflerde 'importance' olmayabilir, ana malzemede vardır
    importance: ing.importance || "Optional",
  };

  // Eğer bu bir ana malzeme ise ve içinde alternatifler varsa, onları da dönüştür (Recursive)
  if (!isAlternative && ing.alternatives && ing.alternatives.length > 0) {
    transformed.alternatives = ing.alternatives.map((alt) =>
      transformIngredientStructure(alt, true)
    );
  } else {
    // Alternatifin alternatifi olmaz veya boşsa boş array döner
    transformed.alternatives = [];
  }

  return transformed;
};

try {
  console.log(`Veri okunuyor: ${inputPath}`);
  const rawData = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  console.log(`Toplam ${rawData.length} kokteyl işleniyor...`);

  const cleanData = rawData.map((item) => {
    return {
      api_id: item.api_id,
      name: createLangObj(item.name_en, item.name_tr),
      instructions: createLangObj(item.instructions_en, item.instructions_tr),
      glass_type: createLangObj(item.glass_type_en, item.glass_type_tr),
      history_notes: createLangObj(
        item.history_notes_en,
        item.history_notes_tr
      ),

      tags: {
        en: splitTags(item.tags_en),
        tr: splitTags(item.tags_tr),
      },

      is_alcoholic: item.is_alcoholic,
      image_url: item.image_url,

      // DÜZELTİLEN KISIM: Helper fonksiyonu kullanıyoruz
      ingredients: item.ingredients.map((ing) =>
        transformIngredientStructure(ing, false)
      ),
    };
  });

  fs.writeFileSync(outputPath, JSON.stringify(cleanData, null, 2));
  console.log(
    `✅ BAŞARILI! Veri (Alternatifler dahil) temizlendi: ${outputPath}`
  );
} catch (error) {
  console.error("❌ HATA:", error.message);
}
