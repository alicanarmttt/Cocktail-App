/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // ADIM 1: ÖNCE TEMİZLE (Ters Sırada: Bağımlı olanlar önce)
  // -----------------------------------------------------------------
  // Yorum: Bu 'del()' komutları, seed'i her çalıştırdığımızda verilerin
  // tekrar tekrar eklenmesini engeller. Temiz bir başlangıç sağlar.

  await knex("barmens_corner_posts").del();
  await knex("recipe_alternatives").del();
  await knex("cocktail_requirements").del();
  await knex("user_profiles").del();
  await knex("ingredients").del();
  await knex("cocktails").del();
  await knex("users").del();
  await knex("ingredient_categories").del();
  await knex("importance_levels").del();

  // ADIM 1.5: MSSQL için IDENTITY (ID Sayacı) SIFIRLAMA
  // Yorum: Bu, bir sonraki ID'nin her zaman 1'den başlamasını sağlar.
  // (Not: 'TRUNCATE' de kullanılabilir ama 'DELETE' + 'RESEED' daha güvenlidir)
  // -----------------------------------------------------------------
  await knex.raw("DBCC CHECKIDENT (barmens_corner_posts, RESEED, 1)");
  await knex.raw("DBCC CHECKIDENT (recipe_alternatives, RESEED, 1)");
  await knex.raw("DBCC CHECKIDENT (cocktail_requirements, RESEED, 1)");
  await knex.raw("DBCC CHECKIDENT (user_profiles, RESEED, 1)");
  await knex.raw("DBCC CHECKIDENT (ingredients, RESEED, 1)");
  await knex.raw("DBCC CHECKIDENT (cocktails, RESEED, 1)");
  await knex.raw("DBCC CHECKIDENT (users, RESEED, 1)");
  await knex.raw("DBCC CHECKIDENT (ingredient_categories, RESEED, 1)");
  await knex.raw("DBCC CHECKIDENT (importance_levels, RESEED, 1)");

  // ADIM 2: BAĞIMSIZ VERİLERİ EKLE (Düz Sırada)
  // -----------------------------------------------------------------

  // Yorum: Önem Seviyelerini Ekle
  // .returning('*') -> MSSQL'e eklediği veriyi bize geri vermesini söyler.
  const levels = await knex("importance_levels")
    .insert([
      { level_name: "Gerekli", color_code: "#FF4136" },
      { level_name: "Süsleme", color_code: "#2ECC40" },
    ])
    .returning("*");

  const [gerekli, susleme] = levels;

  // Yorum: Malzeme Kategorilerini Ekle
  const categories = await knex("ingredient_categories")
    .insert([
      { category_name: "Alkol" }, // ID: 1
      { category_name: "Bitki" }, // ID: 2
      { category_name: "Soft (Gazsız)", parent_category_name: "Soft" }, // ID: 3
      { category_name: "Çözünenler" }, // ID: 4
      { category_name: "Soft (Gazlı)", parent_category_name: "Soft" }, // ID: 5
      { category_name: "Süsleme" }, // ID: 6
    ])
    .returning("*");

  const [
    alkolCat,
    bitkiCat,
    gazsizSoftCat,
    cozunenCat,
    gazliSoftCat,
    suslemeCat,
  ] = categories;

  // ADIM 3: BAĞIMLI VERİLERİ EKLE (Test için 1 Kokteyl: Mojito)
  // -----------------------------------------------------------------

  // Yorum: Malzemeleri (ingredients) Ekle (Kategorilere bağlı)
  const ingredients = await knex("ingredients")
    .insert([
      { name: "Beyaz Rom", category_id: alkolCat.category_id }, // ID: 1
      { name: "Taze Nane", category_id: bitkiCat.category_id }, // ID: 2
      { name: "Lime Suyu", category_id: gazsizSoftCat.category_id }, // ID: 3
      { name: "Esmer Şeker", category_id: cozunenCat.category_id }, // ID: 4
      { name: "Soda", category_id: gazliSoftCat.category_id }, // ID: 5
      { name: "Lime Dilimi", category_id: suslemeCat.category_id }, // ID: 6
      { name: "Votka", category_id: alkolCat.category_id }, // ID: 7
      { name: "Limon Suyu", category_id: gazsizSoftCat.category_id }, // ID: 8
      { name: "Limon Dilimi", category_id: suslemeCat.category_id }, // ID: 9
      { name: "Gazoz", category_id: gazliSoftCat.category_id }, // ID: 10
      { name: "Toz Şeker", category_id: cozunenCat.category_id }, // ID: 11
    ])
    .returning("*");

  const [
    rom,
    nane,
    limeSuyu,
    esmerSeker,
    soda,
    limeDilimi,
    votka,
    limonSuyu,
    limonDilimi,
    gazoz,
    tozSeker,
  ] = ingredients;

  // Yorum: Kokteyli (cocktails) Ekle
  const [mojito] = await knex("cocktails")
    .insert([
      {
        name: "Mojito",
        instructions:
          "1. Şeker, lime suyu ve nane yapraklarını bir bardağa koyup hafifçe ezin (havanla değil, kaşıkla bastırarak).\n2. Bardağı kırık buzla doldurun.\n3. Rom ekleyin.\n4. Üzerini soda ile tamamlayın ve karıştırın.\n5. Bir nane yaprağı ve lime dilimi ile süsleyin.",
        image_url:
          "https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg",
        history_notes:
          "Mojito, Küba'nın Havana kentinde doğan geleneksel bir kokteyldir.",
      },
    ])
    .returning("*");

  // ADIM 4: İLİŞKİ TABLOSUNU DOLDUR (En Önemli Kısım)
  // -----------------------------------------------------------------

  // Yorum: 'cocktail_requirements' tablosunu doldur.
  // 'mojito.cocktail_id', 'rom.ingredient_id' ve 'kesinSart.level_id'
  // gibi yukarıda aldığımız ID'leri kullanarak ilişkileri kuruyoruz.
  // Bu, Foreign Key (Yabancı Anahtar) testimizdir.
  await knex("cocktail_requirements").insert([
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: rom.ingredient_id,
      level_id: gerekli.level_id, // 1
      amount: "60 ml",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: limeSuyu.ingredient_id,
      level_id: gerekli.level_id, // 1
      amount: "30 ml",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: esmerSeker.ingredient_id,
      level_id: gerekli.level_id, // 1
      amount: "2 çay kaşığı",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: soda.ingredient_id,
      level_id: gerekli.level_id, // 1
      amount: "Üzerini tamamlayacak kadar",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: limeDilimi.ingredient_id,
      level_id: susleme.level_id, // 3 (Nane 'Kesin Şart' değil, 'Süsleme/Aroma')
      amount: "1-2 Dilim",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: nane.ingredient_id,
      level_id: susleme.level_id, // 3 (Nane 'Kesin Şart' değil, 'Süsleme/Aroma')
      amount: "6-8 yaprak",
    },
  ]);

  // -----------------------------------------------------------------
  // Yorum: 'recipe_alternatives' tablosunu dolduruyoruz.
  // Bu, "akıllı" (ID'ye dayalı) şemamıza (migration) uygundur.
  await knex("recipe_alternatives").insert([
    // Rom -> Votka
    {
      cocktail_id: mojito.cocktail_id,
      original_ingredient_id: rom.ingredient_id,
      alternative_ingredient_id: votka.ingredient_id,
      alternative_amount: "60 ml",
    },
    // Lime Suyu -> Limon Suyu
    {
      cocktail_id: mojito.cocktail_id,
      original_ingredient_id: limeSuyu.ingredient_id,
      alternative_ingredient_id: limonSuyu.ingredient_id,
      alternative_amount: "30 ml",
    },
    // Esmer Şeker -> Toz Şeker
    {
      cocktail_id: mojito.cocktail_id,
      original_ingredient_id: esmerSeker.ingredient_id,
      alternative_ingredient_id: tozSeker.ingredient_id,
      alternative_amount: "2 çay kaşığı",
    },
    // Soda -> Gazoz
    {
      cocktail_id: mojito.cocktail_id,
      original_ingredient_id: soda.ingredient_id,
      alternative_ingredient_id: gazoz.ingredient_id,
      alternative_amount: "Üzerini tamamlayacak kadar",
    },
    // Lime Dilimi -> Limon Dilimi
    {
      cocktail_id: mojito.cocktail_id,
      original_ingredient_id: limeDilimi.ingredient_id,
      alternative_ingredient_id: limonDilimi.ingredient_id,
      alternative_amount: "1-2 Dilim",
    },
  ]);

  // Yorum: Test kullanıcılarını ekle (Pro/Free)
  await knex("users").insert([
    { email: "free@user.com", firebase_uid: "123", is_pro: false },
    { email: "pro@user.com", firebase_uid: "456", is_pro: true },
  ]);
};
