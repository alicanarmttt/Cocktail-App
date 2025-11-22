const fs = require("fs");
const path = require("path");

// Dosya Yolları
const CURATED_FILE = path.join(__dirname, "curated_cocktails.json"); // Senin 429'luk liste
const EXTRA_FILE = path.join(__dirname, "extra_cocktails.json"); // Şimdi oluşturduğumuz 9'luk liste
const OUTPUT_FILE = path.join(__dirname, "final_seed_data.json"); // ÇIKTI

// 1. GRUP: Top 100'den Eşleşenler (Senin listende zaten olanlar)
// Not: Buraya tespit ettiğimiz 43'lü listeyi ve "Olmazsa Olmaz" olup listende zaten olanları ekledim.
const existingCocktailsToKeep = [
  // --- Top 100 Eşleşenler ---
  "Americano",
  "Aviation",
  "Bramble",
  "Caipirinha",
  "Casino",
  "Clover Club",
  "Corpse Reviver",
  "Cosmopolitan",
  "Daiquiri",
  "Dark and Stormy",
  "Dry Martini",
  "Espresso Martini",
  "French 75",
  "French Martini",
  "Gimlet",
  "Gin Tonic",
  "Godfather",
  "Hemingway Special",
  "Mai Tai",
  "Manhattan",
  "Margarita",
  "Mojito",
  "Moscow Mule",
  "Negroni",
  "Old Cuban",
  "Old Fashioned",
  "Orgasm",
  "Paloma",
  "Penicillin",
  "Pina Colada",
  "Pornstar Martini",
  "Ramos Gin Fizz",
  "Rum Sour",
  "San Francisco",
  "Sazerac",
  "Sidecar",
  "Spritz",
  "The Last Word",
  "Vesper",
  "Whiskey Sour",
  "White Lady",
  "White Russian",
  "Zombie",
  "Mimosa",
  "Bellini",
  "Tequila Sunrise",
  "Long Island Iced Tea",
  "Irish Coffee",
  "Pisco Sour",
  "Mint Julep",
  "Tom Collins",
  "Cuba Libre",
  "Kir Royale",
];

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

try {
  console.log("📂 Dosyalar okunuyor...");

  // Dosyaları Oku
  const curatedData = JSON.parse(fs.readFileSync(CURATED_FILE, "utf8"));
  const extraData = JSON.parse(fs.readFileSync(EXTRA_FILE, "utf8"));

  let finalCocktails = [];
  let addedNames = new Set();

  // 1. ADIM: Mevcut Listeden Seçilenleri Al
  console.log("🔍 Mevcut listeden önemli kokteyller seçiliyor...");

  curatedData.forEach((cocktail) => {
    // Kokteyl ismini normalize et
    const normName = normalize(cocktail.name);

    // Hedef listedeki her bir isme bak
    const isTarget = existingCocktailsToKeep.some(
      (target) => normalize(target) === normName
    );

    if (isTarget) {
      // Eğer listede varsa ve daha önce eklenmemişse ekle
      if (!addedNames.has(normName)) {
        finalCocktails.push(cocktail);
        addedNames.add(normName);
      }
    }
  });
  console.log(
    `✅ Mevcut listeden ${finalCocktails.length} adet kokteyl alındı.`
  );

  // 2. ADIM: Ekstra Listeyi Ekle (Çakışma Kontrolüyle)
  console.log("➕ Eksik olan 'Modern Klasikler' ekleniyor...");

  extraData.forEach((extra) => {
    const normName = normalize(extra.name);

    if (addedNames.has(normName)) {
      console.log(
        `⚠️  UYARI: ${extra.name} zaten listede var, eklenmedi (Çakışma önlendi).`
      );
    } else {
      finalCocktails.push(extra);
      addedNames.add(normName);
    }
  });

  // 3. ADIM: Kaydet
  console.log("---------------------------------------------------");
  console.log(
    `💾 Toplam ${finalCocktails.length} adet EŞSİZ kokteyl 'final_seed_data.json' dosyasına yazılıyor...`
  );

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(finalCocktails, null, 2),
    "utf8"
  );
  console.log("✅ İŞLEM BAŞARILI! Artık hazırsın.");
} catch (error) {
  console.error("❌ Hata:", error.message);
}
