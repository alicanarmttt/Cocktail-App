const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
console.log("🔍 .env aranıyor:", path.join(__dirname, "../.env"));
// Supabase Bağlantısı (Service Role Key ile - Admin yetkisi için)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "HATA: .env dosyasında SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Dosya ve Tablo Eşleştirmeleri (Senin verdiğin ID ve Tablo isimlerine göre)
const MAPPINGS = [
  {
    fileName: "cocktails_translated.json",
    tableName: "cocktails",
    primaryKey: "cocktail_id",
  },
  {
    fileName: "ingredients_translated.json",
    tableName: "ingredients",
    primaryKey: "ingredient_id",
  },
  {
    fileName: "importance_levels.json",
    tableName: "importance_levels",
    primaryKey: "level_id",
  },
  {
    fileName: "ingredient_categories.json",
    tableName: "ingredient_categories",
    primaryKey: "category_id",
  },
];

// JSON Agg sarmalını çözen ve güncelleme yapan fonksiyon
async function updateTableFromFile(mapping) {
  const filePath = path.join(__dirname, "data", "translated", mapping.fileName);

  if (!fs.existsSync(filePath)) {
    console.warn(`UYARI: Dosya bulunamadı, atlanıyor: ${filePath}`);
    return;
  }

  console.log(
    `\n--- İşleniyor: ${mapping.tableName} (${mapping.fileName}) ---`
  );

  try {
    // 1. Dosyayı Oku
    const rawData = fs.readFileSync(filePath, "utf-8");
    const jsonContent = JSON.parse(rawData);

    // 2. Sarmal Yapıyı Çöz (json_agg)
    // Beklenen yapı: [ { "json_agg": [ ...gerçek veriler... ] } ]
    let dataToProcess = [];
    if (
      Array.isArray(jsonContent) &&
      jsonContent.length > 0 &&
      jsonContent[0].json_agg
    ) {
      dataToProcess = jsonContent[0].json_agg;
    } else if (Array.isArray(jsonContent)) {
      // Belki sarmal yoktur, direkt dizidir diye kontrol
      dataToProcess = jsonContent;
    } else {
      console.error(
        `HATA: ${mapping.fileName} dosyasının formatı beklendiği gibi değil.`
      );
      return;
    }

    console.log(`${dataToProcess.length} adet kayıt güncellenecek...`);

    // 3. Veritabanını Güncelle
    let successCount = 0;
    let errorCount = 0;

    for (const item of dataToProcess) {
      const idValue = item[mapping.primaryKey];

      if (!idValue) {
        console.warn(`  ! ID bulunamadı, satır atlanıyor.`);
        continue;
      }

      // Supabase Update
      const { error } = await supabase
        .from(mapping.tableName)
        .update(item) // JSON'daki tüm sütunları (name, instructions vb.) güncelle
        .eq(mapping.primaryKey, idValue);

      if (error) {
        console.error(`  X Hata (ID: ${idValue}):`, error.message);
        errorCount++;
      } else {
        successCount++;
        // Konsol çok şişmesin diye her 100 işlemde bir nokta koyalım
        if (successCount % 50 === 0) process.stdout.write(".");
      }
    }

    console.log(
      `\nTamamlandı: ${successCount} başarılı, ${errorCount} hatalı.`
    );
  } catch (err) {
    console.error(`KRİTİK HATA (${mapping.fileName}):`, err.message);
  }
}

async function main() {
  console.log("🚀 Çeviri Güncelleme Scripti Başlatılıyor...");

  for (const map of MAPPINGS) {
    await updateTableFromFile(map);
  }

  console.log("\n✅ Tüm işlemler bitti.");
}

main();
