/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const fs = require("fs");
const path = require("path");

// YENİ OLUŞTURDUĞUMUZ TEMİZ DOSYAYI HEDEFLİYORUZ
const DATA_PATH = path.join(
  __dirname,
  "../../../scripts/data/pg_cocktails.json"
);

exports.seed = async function (knex) {
  console.log("🚀 PostgreSQL Seeding işlemi başlıyor...");

  // Dosya Kontrolü
  if (!fs.existsSync(DATA_PATH)) {
    console.error(`❌ HATA: Veri dosyası bulunamadı: ${DATA_PATH}`);
    return;
  }

  // 1. ÖNCEKİ VERİLERİ TEMİZLE (Postgres için truncate veya delete)
  // Sıralama önemli: Child -> Parent
  await knex("barmens_corner_posts").del();
  await knex("recipe_alternatives").del();
  await knex("cocktail_requirements").del();
  await knex("cocktails").del();
  await knex("ingredients").del();
  await knex("ingredient_categories").del();
  await knex("importance_levels").del();

  console.log("🗑️ Eski veriler temizlendi.");

  // --- YENİ EKLENECEK FONKSİYON (Dosyanın en üstüne, importların altına) ---
  function getSpiritFamily(engName) {
    if (!engName) return null;

    // Büyük/küçük harf duyarlılığını kaldırmak için
    const name = engName.toLowerCase();

    if (
      name.includes("whisky") ||
      name.includes("whiskey") ||
      name.includes("scotch") ||
      name.includes("bourbon") ||
      name.includes("rye")
    )
      return "whiskey";
    if (name.includes("rum") || name.includes("cachaça")) return "rum";
    if (name.includes("gin")) return "gin";
    if (name.includes("vodka")) return "vodka";
    if (name.includes("tequila") || name.includes("mezcal")) return "tequila";
    if (name.includes("brandy") || name.includes("cognac")) return "brandy";

    return null;
  }

  // 2. IMPORTANCE LEVELS (Sabit Veriler - JSONB)
  const levelsData = [
    { level_name: { en: "Required", tr: "Gerekli" }, color_code: "#FF4136" }, // Kırmızı
    {
      level_name: { en: "Optional", tr: "İsteğe Bağlı" },
      color_code: "#2ECC40",
    }, // Yeşil
    { level_name: { en: "Garnish", tr: "Süsleme" }, color_code: "#0074D9" }, // Mavi
  ];

  const insertedLevels = await knex("importance_levels")
    .insert(levelsData)
    .returning(["level_id", "level_name"]);

  // ID Haritası: "Required" -> 1
  const levelMap = {};
  insertedLevels.forEach((l) => {
    levelMap[l.level_name.en] = l.level_id;
  });

  // 3. DOSYAYI OKU
  const rawData = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  console.log(`📂 ${rawData.length} adet kokteyl verisi okundu.`);

  // 4. KATEGORİLERİ HARİTALAMA (Manuel Çeviri Sözlüğü)
  // Veri dosyasında kategori sadece İngilizce (string) olabilir, bunu JSONB'ye çevireceğiz.
  const CATEGORY_TRANSLATIONS = {
    Spirits: "Ana İçkiler",
    Liqueurs: "Likörler",
    Wines: "Şarap & Köpüklü",
    Mixers: "Yancılar",
    Juices: "Meyve Suları",
    Syrups: "Şuruplar",
    Fruits: "Meyve & Bitki",
    Pantry: "Kiler",
    Mocktail: "Alkolsüz",
    Other: "Diğer",
  };

  const allCategories = new Set();
  rawData.forEach((c) => {
    c.ingredients.forEach((i) => {
      if (i.category) allCategories.add(i.category);
      if (i.alternatives) {
        i.alternatives.forEach((a) => {
          if (a.category) allCategories.add(a.category);
        });
      }
    });
  });

  const categoryMap = {};
  for (const catEn of allCategories) {
    const catTr = CATEGORY_TRANSLATIONS[catEn] || catEn; // Çeviri yoksa aynısını yaz

    const [insertedCat] = await knex("ingredient_categories")
      .insert({ category_name: { en: catEn, tr: catTr } })
      .returning("category_id");

    categoryMap[catEn] = insertedCat.category_id;
  }
  console.log(`✅ ${Object.keys(categoryMap).length} kategori eklendi.`);

  // 5. MALZEMELERİ TEKİLLEŞTİR VE EKLE
  const ingredientMap = {}; // "Gin" -> ID
  const uniqueIngredients = new Map(); // Key: English Name

  // Recursive fonksiyon: Malzemeleri topla
  const collectIngredient = (ing) => {
    if (!ing.name || !ing.name.en) return;

    if (!uniqueIngredients.has(ing.name.en)) {
      // --- BURASI GÜNCELLENDİ: Family Mantığı Entegre Edildi ---

      // 1. Önce kategori ID'sini buluyoruz
      const catId = categoryMap[ing.category] || categoryMap["Other"] || null;

      // 2. Family (Grup) tespiti yapıyoruz
      let family = null;

      // Eğer bu malzeme 'Spirits' (Ana İçkiler) kategorisindeyse family hesapla
      if (catId === categoryMap["Spirits"]) {
        family = getSpiritFamily(ing.name.en);
      }

      uniqueIngredients.set(ing.name.en, {
        name: ing.name, // Zaten {en:..., tr:...} formatında
        category_id: catId,
        family: family, // <--- Yeni family bilgisi buraya eklendi
      });

      // ---------------------------------------------------------
    }

    // Alternatifleri de topla
    if (ing.alternatives && ing.alternatives.length > 0) {
      ing.alternatives.forEach((alt) => collectIngredient(alt));
    }
  };

  rawData.forEach((c) => c.ingredients.forEach((i) => collectIngredient(i)));

  // Veritabanına bas
  for (const [engName, ingData] of uniqueIngredients) {
    const [insertedIng] = await knex("ingredients")
      .insert(ingData)
      .returning("ingredient_id");
    ingredientMap[engName] = insertedIng.ingredient_id;
  }
  console.log(`✅ ${uniqueIngredients.size} benzersiz malzeme eklendi.`);

  // 6. KOKTEYLLERİ VE İLİŞKİLERİ EKLE
  for (const item of rawData) {
    // A. Kokteyli Ekle
    const [cocktail] = await knex("cocktails")
      .insert({
        api_id: item.api_id,
        name: item.name,
        instructions: item.instructions,
        glass_type: item.glass_type,
        tags: item.tags,
        history_notes: item.history_notes,
        is_alcoholic: item.is_alcoholic,
        image_url: item.image_url,
      })
      .returning("cocktail_id");

    // B. Gereksinimleri Ekle
    for (const ing of item.ingredients) {
      const ingredientId = ingredientMap[ing.name.en];
      // Importance string geliyor ("Required"), bunu ID'ye çevir
      const levelId = levelMap[ing.importance] || levelMap["Optional"];

      if (!ingredientId) {
        console.warn(`UYARI: Malzeme bulunamadı -> ${ing.name.en}`);
        continue;
      }

      await knex("cocktail_requirements").insert({
        cocktail_id: cocktail.cocktail_id,
        ingredient_id: ingredientId,
        level_id: levelId,
        amount: ing.amount, // {en: "4 cl", tr: "4 cl"}
      });

      // C. Alternatifleri Ekle
      if (ing.alternatives && ing.alternatives.length > 0) {
        for (const alt of ing.alternatives) {
          const altIngId = ingredientMap[alt.name.en];
          if (altIngId) {
            await knex("recipe_alternatives").insert({
              cocktail_id: cocktail.cocktail_id,
              original_ingredient_id: ingredientId,
              alternative_ingredient_id: altIngId,
              alternative_amount: alt.amount,
            });
          }
        }
      }
    }
  }

  console.log("🎉 TEBRİKLER! Supabase veritabanı başarıyla dolduruldu.");
};
