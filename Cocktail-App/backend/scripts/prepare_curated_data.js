const fs = require("fs");
const path = require("path");

// Dosya yolları
const INPUT_FILE = path.join(__dirname, "raw_cocktails.json");
const OUTPUT_FILE = path.join(__dirname, "curated_cocktails.json");

/**
 * Tek bir Raw kokteyl objesini bizim Curated yapımıza çevirir.
 */
function transformCocktail(raw) {
  // 1. Malzemeleri Ayrıştır (strIngredient1...15 ve strMeasure1...15)
  const ingredients = [];

  for (let i = 1; i <= 15; i++) {
    const ingredientName = raw[`strIngredient${i}`];
    let measure = raw[`strMeasure${i}`];

    // Eğer malzeme ismi varsa listeye ekle
    if (ingredientName && ingredientName.trim() !== "") {
      // Miktar null ise veya boşsa "Kararınca" yaz, değilse temizle
      const cleanAmount =
        measure && measure.trim() !== "" ? measure.trim() : "Kararınca";

      ingredients.push({
        name: ingredientName.trim(),
        amount: cleanAmount,
        category: null, // SEN DOLDURACAKSIN (Placeholder)
        importance: null, // SEN DOLDURACAKSIN (Placeholder)
        alternatives: [], // SEN DOLDURACAKSIN (Placeholder)
      });
    }
  }

  // 2. Ana Objeyi Oluştur
  return {
    api_id: raw.idDrink,
    name: raw.strDrink,
    category: raw.strCategory, // Bu kokteylin genel kategorisi (Örn: Ordinary Drink)
    glass_type: raw.strGlass, // YENİ: Bardak tipi
    tags: raw.strTags, // YENİ: Etiketler
    is_alcoholic: raw.strAlcoholic === "Alcoholic", // YENİ: Boolean çevrimi
    instructions: raw.strInstructions,
    image_url: raw.strDrinkThumb,
    ingredients: ingredients,
  };
}

// --- ANA İŞLEM ---

try {
  console.log("📂 Raw veri okunuyor...");

  // Dosyayı oku
  const rawData = fs.readFileSync(INPUT_FILE, "utf8");
  let jsonContent = JSON.parse(rawData);

  // Eğer dosya { drinks: [...] } formatındaysa veya direkt array ise ona göre al
  let cocktailsArray = [];
  if (jsonContent.drinks) {
    cocktailsArray = jsonContent.drinks;
  } else if (Array.isArray(jsonContent)) {
    cocktailsArray = jsonContent;
  } else {
    // Tek bir obje geldiyse array içine al
    cocktailsArray = [jsonContent];
  }

  console.log(`🔄 ${cocktailsArray.length} adet kokteyl dönüştürülüyor...`);

  // Tüm kokteylleri dönüştür
  const curatedData = cocktailsArray.map(transformCocktail);

  // Yeni dosyaya yaz
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(curatedData, null, 2), "utf8");

  console.log("✅ İŞLEM BAŞARILI!");
  console.log(`📄 Dosya oluşturuldu: ${OUTPUT_FILE}`);
  console.log(
    "👉 Şimdi bu dosyayı açıp 'null' alanları (category, importance) doldurabilirsin."
  );
} catch (error) {
  console.error("❌ Bir hata oluştu:", error.message);
}
