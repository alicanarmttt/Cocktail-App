const fs = require("fs");
const path = require("path");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const jsonPath = path.join(
    __dirname,
    "../../../scripts/bilingual_seed_data.json"
  );

  if (!fs.existsSync(jsonPath)) {
    console.error("❌ HATA: JSON dosyası bulunamadı!");
    return;
  }

  const cocktailsData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  console.log(`🚀 ${cocktailsData.length} adet kokteyl işleniyor...`);

  // --- MAPPING VE CACHE ---
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

  const LEVEL_MAP = {
    Required: { tr: "Gerekli", en: "Required", color: "#FF4136" },
    Garnish: { tr: "Süsleme", en: "Garnish", color: "#2ECC40" },
  };

  const categoryCache = {};
  const levelCache = {};

  // --- ANA İŞLEM (TRANSACTION) ---
  await knex.transaction(async (trx) => {
    console.log("🧹 Tablolar ve Sayaçlar SIFIRLANIYOR...");

    // 1. ADIM: TÜM TABLOLARI TEMİZLE (Sıra Önemli: Child -> Parent)
    // Hepsini açtık (Uncomment) ki eski veri kalmasın.
    await trx("barmens_corner_posts").del();
    await trx("recipe_alternatives").del();
    await trx("cocktail_requirements").del();
    await trx("cocktails").del();
    await trx("ingredients").del(); // AÇILDI
    await trx("ingredient_categories").del(); // AÇILDI
    await trx("importance_levels").del(); // AÇILDI

    // 2. ADIM: ID SAYAÇLARINI SIFIRLA (RESEED 0 -> İlk ID 1 olur)
    // Tüm tablolar için REESED komutunu açtık.
    try {
      await trx.raw("DBCC CHECKIDENT ('barmens_corner_posts', RESEED, 0)");
      await trx.raw("DBCC CHECKIDENT ('recipe_alternatives', RESEED, 0)");
      await trx.raw("DBCC CHECKIDENT ('cocktail_requirements', RESEED, 0)");
      await trx.raw("DBCC CHECKIDENT ('cocktails', RESEED, 0)");
      await trx.raw("DBCC CHECKIDENT ('ingredients', RESEED, 0)"); // AÇILDI
      await trx.raw("DBCC CHECKIDENT ('ingredient_categories', RESEED, 0)"); // AÇILDI
      await trx.raw("DBCC CHECKIDENT ('importance_levels', RESEED, 0)"); // AÇILDI
    } catch (e) {
      console.log(
        "⚠️ Sayaç sıfırlama uyarısı (Tablo yoksa normaldir):",
        e.message
      );
    }

    // 3. ADIM: REFERANS VERİLERİNİ YÜKLE
    // Kategorileri ekle
    for (const [key, names] of Object.entries(CATEGORY_MAP)) {
      const [inserted] = await trx("ingredient_categories")
        .insert({
          category_name_en: names.en,
          category_name_tr: names.tr,
        })
        .returning("*");
      categoryCache[key] = inserted.category_id;
    }

    // Seviyeleri ekle
    for (const [key, details] of Object.entries(LEVEL_MAP)) {
      const [inserted] = await trx("importance_levels")
        .insert({
          level_name_en: details.en,
          level_name_tr: details.tr,
          color_code: details.color,
        })
        .returning("*");
      levelCache[key] = inserted.level_id;
    }

    console.log("✅ Referanslar yüklendi (ID'ler 1'den başlıyor).");

    // 4. ADIM: KOKTEYLLERİ DÖNGÜYE AL
    for (const cocktail of cocktailsData) {
      // Kokteyl Ekle
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
          history_notes_en: cocktail.history_notes_en,
          history_notes_tr: cocktail.history_notes_tr,
          is_alcoholic: cocktail.is_alcoholic,
          image_url: cocktail.image_url,
        })
        .returning("*");

      const cocktailId = newCocktail.cocktail_id;

      // Malzemeleri İşle
      for (const ing of cocktail.ingredients) {
        // getOrCreateIngredient yerine direkt logic (Çünkü tabloyu sildik, cache boş)
        // Ancak Transaction içinde benzersizlik kontrolü yine de güvenlidir.
        let ingredientId;

        // Önce veritabanında var mı diye bak (Döngü içinde aynı malzeme tekrar gelebilir)
        const existingIng = await trx("ingredients")
          .where("name_en", ing.name_en)
          .first();

        if (existingIng) {
          ingredientId = existingIng.ingredient_id;
        } else {
          const catKey = ing.category || "Other";
          const categoryId = categoryCache[catKey] || categoryCache["Other"];

          const [newIng] = await trx("ingredients")
            .insert({
              name_en: ing.name_en,
              name_tr: ing.name_tr,
              category_id: categoryId,
            })
            .returning("ingredient_id");

          ingredientId = newIng.ingredient_id;
        }

        // Requirement Ekle
        const levelKey = ing.importance || "Required";
        const levelId = levelCache[levelKey] || levelCache["Required"];

        await trx("cocktail_requirements").insert({
          cocktail_id: cocktailId,
          ingredient_id: ingredientId,
          level_id: levelId,
          amount_en: ing.amount_en,
          amount_tr: ing.amount_tr,
        });

        // Alternatifleri İşle
        if (ing.alternatives && ing.alternatives.length > 0) {
          for (const alt of ing.alternatives) {
            let altIngId;
            // Alternatifi Bul/Oluştur
            const existingAlt = await trx("ingredients")
              .where("name_en", alt.name_en)
              .first();

            if (existingAlt) {
              altIngId = existingAlt.ingredient_id;
            } else {
              const catKey = alt.category || "Other";
              const categoryId =
                categoryCache[catKey] || categoryCache["Other"];
              const [newAlt] = await trx("ingredients")
                .insert({
                  name_en: alt.name_en,
                  name_tr: alt.name_tr,
                  category_id: categoryId,
                })
                .returning("ingredient_id");
              altIngId = newAlt.ingredient_id;
            }

            await trx("recipe_alternatives").insert({
              cocktail_id: cocktailId,
              original_ingredient_id: ingredientId,
              alternative_ingredient_id: altIngId,
              alternative_amount_en: alt.amount_en,
              alternative_amount_tr: alt.amount_tr,
            });
          }
        }
      }
    }
  });

  console.log("✅ MİSYON TAMAMLANDI! Tüm tablolar 1'den başlayarak sıralandı.");
};
