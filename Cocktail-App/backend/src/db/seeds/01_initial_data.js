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
  await knex.raw("DBCC CHECKIDENT (barmens_corner_posts, RESEED, 0)");
  await knex.raw("DBCC CHECKIDENT (recipe_alternatives, RESEED, 0)");
  await knex.raw("DBCC CHECKIDENT (cocktail_requirements, RESEED, 0)");
  await knex.raw("DBCC CHECKIDENT (user_profiles, RESEED, 0)");
  await knex.raw("DBCC CHECKIDENT (ingredients, RESEED, 0)");
  await knex.raw("DBCC CHECKIDENT (cocktails, RESEED, 0)");
  await knex.raw("DBCC CHECKIDENT (users, RESEED, 0)");
  await knex.raw("DBCC CHECKIDENT (ingredient_categories, RESEED, 0)");
  await knex.raw("DBCC CHECKIDENT (importance_levels, RESEED, 0)");

  // ADIM 2: BAĞIMSIZ VERİLERİ EKLE (Düz Sırada)
  // -----------------------------------------------------------------

  // Yorum: Önem Seviyelerini Ekle
  // .returning('*') -> MSSQL'e eklediği veriyi bize geri vermesini söyler.
  const levels = await knex("importance_levels")
    .insert([
      { level_name: "Kesin Şart", color_code: "#FF4136" }, // ID: 1
      { level_name: "Az Önemli", color_code: "#FF851B" }, // ID: 2
      { level_name: "Süsleme", color_code: "#2ECC40" }, // ID: 3
    ])
    .returning("*");

  const [kesinSart, azOnemli, susleme] = levels;

  // Yorum: Malzeme Kategorilerini Ekle
  const categories = await knex("ingredient_categories")
    .insert([
      { category_name: "Alkol" }, // ID: 1
      { category_name: "Bitki" }, // ID: 2
      { category_name: "Meyve Suyu / Püre" }, // ID: 3
      { category_name: "Çözünenler" }, // ID: 4
      { category_name: "Soft", parent_category_name: "Gazlı" }, // ID: 5
    ])
    .returning("*");

  const [alkolCat, bitkiCat, meyveSuyuCat, cozunenCat, gazliCat] = categories;

  // ADIM 3: BAĞIMLI VERİLERİ EKLE (Test için 1 Kokteyl: Mojito)
  // -----------------------------------------------------------------

  // Yorum: Malzemeleri (ingredients) Ekle (Kategorilere bağlı)
  const ingredients = await knex("ingredients")
    .insert([
      { name: "Beyaz Rom", category_id: alkolCat.category_id }, // ID: 1
      { name: "Taze Nane", category_id: bitkiCat.category_id }, // ID: 2
      { name: "Lime Suyu", category_id: meyveSuyuCat.category_id }, // ID: 3
      { name: "Toz Şeker", category_id: cozunenCat.category_id }, // ID: 4
      { name: "Soda", category_id: gazliCat.category_id }, // ID: 5
    ])
    .returning("*");

  const [rom, nane, limeSuyu, seker, soda] = ingredients;

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
      level_id: kesinSart.level_id, // 1
      amount: "60 ml",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: limeSuyu.ingredient_id,
      level_id: kesinSart.level_id, // 1
      amount: "30 ml",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: seker.ingredient_id,
      level_id: kesinSart.level_id, // 1
      amount: "2 çay kaşığı",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: soda.ingredient_id,
      level_id: kesinSart.level_id, // 1
      amount: "Üzerini tamamlayacak kadar",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: nane.ingredient_id,
      level_id: susleme.level_id, // 3 (Nane 'Kesin Şart' değil, 'Süsleme/Aroma')
      amount: "6-8 yaprak",
    },
  ]);
};
