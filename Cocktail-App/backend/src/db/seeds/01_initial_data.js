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
      { category_name: "Bitki / Yeşillik" }, // ID: 2
      { category_name: "Soft (Gazsız)" }, // ID: 3
      { category_name: "Çözünenler / Baharat" }, // ID: 4
      { category_name: "Soft (Gazlı)" }, // ID: 5
      { category_name: "Süsleme (Meyve)" }, // ID: 6
      { category_name: "Meyve Suyu" }, // ID: 7
    ])
    .returning("*");

  const [
    alkolCat,
    bitkiCat,
    gazsizSoftCat,
    cozunenCat,
    gazliSoftCat,
    suslemeCat,
    meyveSuyuCat,
  ] = categories;

  // ADIM 3: BAĞIMLI VERİLERİ EKLE (Test için 1 Kokteyl: Mojito)
  // -----------------------------------------------------------------

  // Yorum: Malzemeleri (ingredients) Ekle (Kategorilere bağlı)
  const ingredients = await knex("ingredients")
    .insert([
      // Mojito Ana Malzemeleri
      { name: "Beyaz Rom", category_id: alkolCat.category_id }, // ID: 1
      { name: "Taze Nane", category_id: bitkiCat.category_id }, // ID: 2
      { name: "Lime Suyu", category_id: gazsizSoftCat.category_id }, // ID: 3
      { name: "Esmer Şeker", category_id: cozunenCat.category_id }, // ID: 4
      { name: "Soda", category_id: gazliSoftCat.category_id }, // ID: 5
      { name: "Lime Dilimi", category_id: suslemeCat.category_id }, // ID: 6

      // Mojito Alternatif Malzemeleri
      { name: "Votka", category_id: alkolCat.category_id }, // ID: 7
      { name: "Limon Suyu", category_id: gazsizSoftCat.category_id }, // ID: 8
      { name: "Limon Dilimi", category_id: suslemeCat.category_id }, // ID: 9
      { name: "Gazoz (Sprite/7up)", category_id: gazliSoftCat.category_id }, // ID: 10
      { name: "Toz Şeker", category_id: cozunenCat.category_id }, // ID: 11

      // Margarita Ana Malzemeleri
      { name: "Tequila (Silver)", category_id: alkolCat.category_id }, // ID: 12
      {
        name: "Cointreau (Portakal Likörü)",
        category_id: alkolCat.category_id,
      }, // ID: 13
      { name: "Tuz", category_id: cozunenCat.category_id }, // ID: 14

      // Margarita Alternatif Malzemeleri
      {
        name: "Triple Sec (Portakal Likörü)",
        category_id: alkolCat.category_id,
      }, // ID: 15

      // Gin Tonic Ana Malzemeleri
      { name: "Cin (London Dry)", category_id: alkolCat.category_id }, // ID: 16
      { name: "Tonik", category_id: gazliSoftCat.category_id }, // ID: 17

      // Cosmopolitan Ana Malzemeleri
      { name: "Kızılcık Suyu", category_id: meyveSuyuCat.category_id }, // ID: 18
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
    tequila,
    cointreau,
    tuz,
    tripleSec,
    cin,
    tonik,
    kizilcikSuyu,
  ] = ingredients;

  // Kokteylleri Ekle
  const cocktails = await knex("cocktails")
    .insert([
      {
        // ID: 1
        name: "Mojito",
        instructions:
          "1. Şeker, lime suyu ve nane yapraklarını bir bardağa koyup hafifçe ezin...\n2. Bardağı kırık buzla doldurun...\n3. Rom ekleyin...\n4. Üzerini soda ile tamamlayın ve karıştırın.\n5. Bir nane yaprağı ve lime dilimi ile süsleyin.",
        image_url:
          "https://www.thecocktaildb.com/images/media/drink/metwgh1606770327.jpg",
        history_notes:
          "Mojito, Küba'nın Havana kentinde doğan geleneksel bir kokteyldir.",
      },
      {
        // ID: 2
        name: "Margarita",
        instructions:
          "1. Bir tabağa tuz dökün. Bardağın kenarını lime ile ıslatıp tuza batırın.\n2. Tekila, Cointreau ve lime suyunu buz dolu bir shaker'da çalkalayın.\n3. Soğutulmuş bardağınıza (buzlu veya buzsuz) süzün.\n4. Bir lime dilimi ile süsleyin.",
        image_url:
          "https://www.thecocktaildb.com/images/media/drink/5noda61589575158.jpg",
        history_notes:
          "Kökeni hakkında birçok hikaye vardır, ancak genellikle Meksika kökenli olduğu kabul edilir.",
      },
      {
        // ID: 3
        name: "Gin Tonic",
        instructions:
          "1. Yüksek bir bardağı ağzına kadar buzla doldurun.\n2. Üzerine Cin'i ekleyin.\n3. Yavaşça toniği dökün.\n4. Bir lime dilimi (veya salatalık) ile süsleyin ve hafifçe karıştırın.",
        image_url:
          "https://www.thecocktaildb.com/images/media/drink/z0omyp1582480573.jpg",
        history_notes:
          "Sıtmayı önlemek için kinin (tonikte bulunur) içen Hindistan'daki İngiliz askerleri tarafından popülerleştirilmiştir.",
      },
      {
        // ID: 4
        name: "Cosmopolitan",
        instructions:
          "1. Votka, Cointreau, lime suyu ve kızılcık suyunu buz dolu bir shaker'da çalkalayın.\n2. Soğutulmuş bir kokteyl bardağına süzün.\n3. Genellikle bir portakal kabuğu veya lime dilimi ile süslenir.",
        image_url:
          "https://www.thecocktaildb.com/images/media/drink/kpsajh1504368362.jpg",
        history_notes:
          "1990'larda 'Sex and the City' dizisiyle dünya çapında ün kazanmıştır.",
      },
    ])
    .returning("*");

  const [mojito, margarita, ginTonic, cosmopolitan] = cocktails;

  // ADIM 4: İLİŞKİ TABLOSUNU DOLDUR (En Önemli Kısım)
  // -----------------------------------------------------------------

  // Yorum: 'cocktail_requirements' tablosunu doldur.
  // 'mojito.cocktail_id', 'rom.ingredient_id' ve 'kesinSart.level_id'
  // gibi yukarıda aldığımız ID'leri kullanarak ilişkileri kuruyoruz.
  // 'cocktail_requirements' (Gereksinimler) tablosunu doldur
  await knex("cocktail_requirements").insert([
    // --- Mojito (ID: 1) ---
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: rom.ingredient_id,
      level_id: gerekli.level_id,
      amount: "60 ml",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: limeSuyu.ingredient_id,
      level_id: gerekli.level_id,
      amount: "30 ml",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: esmerSeker.ingredient_id,
      level_id: gerekli.level_id,
      amount: "2 çay kaşığı",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: soda.ingredient_id,
      level_id: gerekli.level_id,
      amount: "Üzerini tamamla",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: nane.ingredient_id,
      level_id: gerekli.level_id,
      amount: "8-10 yaprak",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: limeDilimi.ingredient_id,
      level_id: susleme.level_id,
      amount: "1-2 Dilim",
    },
    {
      cocktail_id: mojito.cocktail_id,
      ingredient_id: nane.ingredient_id,
      level_id: susleme.level_id,
      amount: "1 dal (süsleme)",
    },

    // --- Margarita (ID: 2) ---
    {
      cocktail_id: margarita.cocktail_id,
      ingredient_id: tequila.ingredient_id,
      level_id: gerekli.level_id,
      amount: "50 ml",
    },
    {
      cocktail_id: margarita.cocktail_id,
      ingredient_id: cointreau.ingredient_id,
      level_id: gerekli.level_id,
      amount: "25 ml",
    },
    {
      cocktail_id: margarita.cocktail_id,
      ingredient_id: limeSuyu.ingredient_id,
      level_id: gerekli.level_id,
      amount: "25 ml",
    },
    {
      cocktail_id: margarita.cocktail_id,
      ingredient_id: tuz.ingredient_id,
      level_id: susleme.level_id,
      amount: "Bardağın kenarı için",
    },
    {
      cocktail_id: margarita.cocktail_id,
      ingredient_id: limeDilimi.ingredient_id,
      level_id: susleme.level_id,
      amount: "1 Dilim",
    },

    // --- Gin Tonic (ID: 3) ---
    {
      cocktail_id: ginTonic.cocktail_id,
      ingredient_id: cin.ingredient_id,
      level_id: gerekli.level_id,
      amount: "50 ml",
    },
    {
      cocktail_id: ginTonic.cocktail_id,
      ingredient_id: tonik.ingredient_id,
      level_id: gerekli.level_id,
      amount: "150 ml",
    },
    {
      cocktail_id: ginTonic.cocktail_id,
      ingredient_id: limeDilimi.ingredient_id,
      level_id: susleme.level_id,
      amount: "1 Dilim",
    },

    // --- Cosmopolitan (ID: 4) ---
    {
      cocktail_id: cosmopolitan.cocktail_id,
      ingredient_id: votka.ingredient_id,
      level_id: gerekli.level_id,
      amount: "40 ml",
    },
    {
      cocktail_id: cosmopolitan.cocktail_id,
      ingredient_id: cointreau.ingredient_id,
      level_id: gerekli.level_id,
      amount: "15 ml",
    },
    {
      cocktail_id: cosmopolitan.cocktail_id,
      ingredient_id: limeSuyu.ingredient_id,
      level_id: gerekli.level_id,
      amount: "15 ml",
    },
    {
      cocktail_id: cosmopolitan.cocktail_id,
      ingredient_id: kizilcikSuyu.ingredient_id,
      level_id: gerekli.level_id,
      amount: "30 ml",
    },
  ]);

  // 'recipe_alternatives' (PRO) tablosunu doldur (Şemamıza uygun: ID <-> ID)
  await knex("recipe_alternatives").insert([
    // Mojito Alternatifleri
    {
      cocktail_id: mojito.cocktail_id,
      original_ingredient_id: rom.ingredient_id,
      alternative_ingredient_id: votka.ingredient_id,
      alternative_amount: "60 ml",
    },
    {
      cocktail_id: mojito.cocktail_id,
      original_ingredient_id: limeSuyu.ingredient_id,
      alternative_ingredient_id: limonSuyu.ingredient_id,
      alternative_amount: "30 ml",
    },
    {
      cocktail_id: mojito.cocktail_id,
      original_ingredient_id: esmerSeker.ingredient_id,
      alternative_ingredient_id: tozSeker.ingredient_id,
      alternative_amount: "2 çay kaşığı",
    },
    {
      cocktail_id: mojito.cocktail_id,
      original_ingredient_id: soda.ingredient_id,
      alternative_ingredient_id: gazoz.ingredient_id,
      alternative_amount: "Üzerini tamamla",
    },
    {
      cocktail_id: mojito.cocktail_id,
      original_ingredient_id: limeDilimi.ingredient_id,
      alternative_ingredient_id: limonDilimi.ingredient_id,
      alternative_amount: "1 Dilim",
    },

    // Margarita Alternatifi
    {
      cocktail_id: margarita.cocktail_id,
      original_ingredient_id: cointreau.ingredient_id,
      alternative_ingredient_id: tripleSec.ingredient_id,
      alternative_amount: "25 ml",
    },

    // Cosmopolitan Alternatifi
    {
      cocktail_id: cosmopolitan.cocktail_id,
      original_ingredient_id: limeSuyu.ingredient_id,
      alternative_ingredient_id: limonSuyu.ingredient_id,
      alternative_amount: "15 ml",
    },
  ]);

  // Yorum: Test kullanıcılarını ekle (Pro/Free)
  await knex("users").insert([
    { email: "free@user.com", firebase_uid: "123", is_pro: false },
    { email: "pro@user.com", firebase_uid: "456", is_pro: true },
  ]);
};
