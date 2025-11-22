const fs = require("fs");
const path = require("path");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // 1. JSON Verisini Oku
  const jsonPath = path.join(
    __dirname,
    "../../../scripts/bilingual_seed_data.json"
  );

  if (!fs.existsSync(jsonPath)) {
    console.error("❌ HATA: 'scripts/bilingual_seed_data.json' bulunamadı!");
    return;
  }

  const cocktailsData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  console.log(
    `🚀 ${cocktailsData.length} adet kokteyl veritabanına işleniyor...`
  );

  // --- SABİT TANIMLAR (MAPPING) ---

  // Kategori Çevirileri
  // JSON'daki İngilizce "Key" -> DB'deki TR/EN karşılıkları
  const CATEGORY_MAP = {
    Spirits: { tr: "Ana İçkiler", en: "Spirits" },
    Liqueurs: { tr: "Likörler", en: "Liqueurs" },
    Wines: { tr: "Şarap & Köpüklü", en: "Wines & Sparkling" },
    Mixers: { tr: "Yancılar (Gazlı/Sıvı)", en: "Mixers" },
    Juices: { tr: "Meyve Suları", en: "Juices" },
    Syrups: { tr: "Şuruplar", en: "Syrups" },
    Fruits: { tr: "Meyve & Bitki", en: "Fruits & Herbs" },
    Pantry: { tr: "Kiler / Mutfak", en: "Pantry" },
    Mocktail: { tr: "Alkolsüz", en: "Non-Alcoholic" },
    Other: { tr: "Diğer", en: "Other" },
  };

  // Önem Seviyesi Çevirileri
  const LEVEL_MAP = {
    Required: { tr: "Gerekli", en: "Required", color: "#FF4136" },
    Garnish: { tr: "Süsleme", en: "Garnish", color: "#2ECC40" },
  };

  // --- YARDIMCI FONKSİYONLAR ---

  // 1. Kategorileri Önden Yükle/Oluştur (Cache Mantığı)
  const categoryCache = {}; // { "Spirits": 1, "Juices": 5 ... }

  async function setupCategories() {
    for (const [key, names] of Object.entries(CATEGORY_MAP)) {
      // İngilizce ismine göre veritabanında var mı?
      let cat = await knex("ingredient_categories")
        .where("category_name_en", names.en)
        .first();

      if (!cat) {
        // Yoksa oluştur
        const [inserted] = await knex("ingredient_categories")
          .insert({
            category_name_en: names.en,
            category_name_tr: names.tr,
          })
          .returning("*");
        cat = inserted; // Eklenen kaydı al
      }
      // Cache'e JSON'daki Key ("Spirits") ile ID'sini eşleştir
      categoryCache[key] = cat.category_id;
    }
    console.log("✅ Kategoriler Hazırlandı.");
  }

  // 2. Önem Seviyelerini Önden Yükle/Oluştur
  const levelCache = {}; // { "Required": 1, "Garnish": 2 }

  async function setupLevels() {
    for (const [key, details] of Object.entries(LEVEL_MAP)) {
      let lvl = await knex("importance_levels")
        .where("level_name_en", details.en)
        .first();

      if (!lvl) {
        const [inserted] = await knex("importance_levels")
          .insert({
            level_name_en: details.en,
            level_name_tr: details.tr,
            color_code: details.color,
          })
          .returning("*");
        lvl = inserted;
      }
      levelCache[key] = lvl.level_id;
    }
    console.log("✅ Önem Seviyeleri Hazırlandı.");
  }

  // 3. Malzeme Bul veya Oluştur
  // Hem İngilizce hem Türkçe ismini kaydediyoruz.
  // Benzersizlik kontrolü 'name_en' üzerinden yapılır.
  async function getOrCreateIngredient(ingData, trx) {
    if (!ingData.name_en) return null;

    let ingredient = await trx("ingredients")
      .where("name_en", ingData.name_en)
      .first();

    if (!ingredient) {
      // Kategori ID'sini bul (Varsayılan: Other)
      const catKey = ingData.category || "Other";
      const categoryId = categoryCache[catKey] || categoryCache["Other"];

      const [inserted] = await trx("ingredients")
        .insert({
          name_en: ingData.name_en,
          name_tr: ingData.name_tr,
          category_id: categoryId,
        })
        .returning("*");
      ingredient = inserted;
    }
    return ingredient.ingredient_id;
  }

  // --- ANA İŞLEM (TRANSACTION) ---

  await knex.transaction(async (trx) => {
    console.log("🧹 Tablolar temizleniyor...");
    // Temizlik: Child tablolardan Parent tablolara doğru sil (Foreign Key hatası almamak için)
    await trx("barmens_corner_posts").del();
    await trx("recipe_alternatives").del();
    await trx("cocktail_requirements").del();
    // Ingredients tablosunu silmek yerine tutabiliriz ama temiz kurulum için silelim
    await trx("cocktails").del();
    // Ingredients, Categories ve Levels genelde silinmeyebilir ama tam reset için:
    // await trx("ingredients").del();
    // await trx("ingredient_categories").del();
    // await trx("importance_levels").del();

    // ID sayaçlarını sıfırla (MSSQL için)
    try {
      await trx.raw("DBCC CHECKIDENT (barmens_corner_posts, RESEED, 0)");
      await trx.raw("DBCC CHECKIDENT (recipe_alternatives, RESEED, 0)");
      await trx.raw("DBCC CHECKIDENT (cocktail_requirements, RESEED, 0)");
      await trx.raw("DBCC CHECKIDENT (cocktails, RESEED, 0)");
      // await trx.raw("DBCC CHECKIDENT (ingredients, RESEED, 0)"); // Eğer sildiysen aç
    } catch (e) {
      // Hata olursa (örneğin tablo boşsa veya yetki yoksa) devam et
    }

    // Referans verilerini hazırla (Transaction dışında veya içinde çağrılabilir ama burada trx kullanmadıkları için sorun yok)
    await setupCategories();
    await setupLevels();

    // Kokteylleri Döngüye Al
    for (const cocktail of cocktailsData) {
      // 1. Kokteyli Ekle
      // MSSQL .returning() bazen array içinde obje döner, bazen direkt obje. Yapıya dikkat.
      const [newCocktail] = await trx("cocktails")
        .insert({
          api_id: cocktail.api_id,
          name_en: cocktail.name_en,
          name_tr: cocktail.name_tr,
          instructions_en: cocktail.instructions_en,
          instructions_tr: cocktail.instructions_tr,
          glass_type_en: cocktail.glass_type_en,
          glass_type_tr: cocktail.glass_type_tr,
          tags_en: cocktail.tags_en,
          tags_tr: cocktail.tags_tr,
          history_notes_en: cocktail.history_notes_en, // Yeni eklenen alan
          history_notes_tr: cocktail.history_notes_tr,
          is_alcoholic: cocktail.is_alcoholic,
          image_url: cocktail.image_url,
        })
        .returning("*"); // Tüm objeyi dön

      const cocktailId = newCocktail.cocktail_id;

      // 2. Malzemeleri Ekle ve Bağla
      for (const ing of cocktail.ingredients) {
        const ingredientId = await getOrCreateIngredient(ing, trx);

        // Önem Seviyesi ID (Varsayılan: Required)
        const levelKey = ing.importance || "Required";
        const levelId = levelCache[levelKey] || levelCache["Required"];

        // İlişki Tablosuna Ekle (Requirements)
        await trx("cocktail_requirements").insert({
          cocktail_id: cocktailId,
          ingredient_id: ingredientId,
          level_id: levelId,
          amount_en: ing.amount_en,
          amount_tr: ing.amount_tr,
        });

        // 3. Alternatifleri İşle (Varsa)
        if (ing.alternatives && ing.alternatives.length > 0) {
          for (const alt of ing.alternatives) {
            // Alternatifi de 'ingredients' tablosuna ekle (veya bul)
            const altIngId = await getOrCreateIngredient(alt, trx);

            // Recipe Alternatives tablosuna ekle
            await trx("recipe_alternatives").insert({
              cocktail_id: cocktailId,
              original_ingredient_id: ingredientId, // Hangi malzemenin alternatifi?
              alternative_ingredient_id: altIngId, // Alternatif malzeme ne?
              alternative_amount_en: alt.amount_en,
              alternative_amount_tr: alt.amount_tr,
            });
          }
        }
      }
    }
  });

  console.log("✅ MİSYON TAMAMLANDI! Veritabanı başarıyla güncellendi.");
};
