const knex = require("../knex");

// Sabit Popüler Listesi (İsimler İngilizce olarak eşleşmeli)
const POPULAR_NAMES = [
  "Margarita",
  "Mojito",
  "Old Fashioned",
  "Negroni",
  "Gin Tonic",
  "Espresso Martini",
  "Daiquiri",
  "Dry Martini",
  "Whiskey Sour",
  "Aperol Spritz",
  "Long Island Iced Tea",
  "Pina Colada",
  "Cosmopolitan",
  "Moscow Mule",
  "Bloody Mary",
  "Cuba Libre",
  "Tequila Sunrise",
  "Sex on the Beach",
  "White Russian",
  "Manhattan",
];

/**
 * @desc    Rulet için belirtilen moda göre kokteyl havuzunu getirir.
 * @param   {string} mode - 'random', 'driver', 'popular', 'taste', 'spirit', 'custom'
 * @param   {any} filter - Moduna göre filtre değeri (tag, ingredientId vb.)
 */
const getRoulettePool = async (mode, filter = null) => {
  // Temel Sorgu: JSONB yapısını (name) çekiyoruz
  let query = db("cocktails").select(
    "cocktail_id",
    "name", // { en: "...", tr: "..." }
    "image_url",
    "is_alcoholic"
  );

  switch (mode) {
    // 1. MOD: SÜRÜCÜ (Alkolsüzler)
    case "driver":
      query = query.where("is_alcoholic", false);
      break;

    // 2. MOD: ŞÖHRETLER KARMASI (Popülerler)
    // İngilizce isme göre filtreliyoruz (JSON içinde 'en' anahtarı)
    case "popular":
      query = query.whereRaw("name->>'en' = ANY(?)", [POPULAR_NAMES]);
      // Alternatif (Daha basit): whereIn kullanamayız çünkü sütun JSON.
      // O yüzden whereRaw en garantisi.
      break;

    // 3. MOD: DAMAK TADI (Tag Filtreleme)
    // Tags alanı da JSONB olduğu için arama şekli değişiyor.
    // filter örn: "Sweet"
    case "taste":
      if (filter) {
        // Tagler veritabanında JSON array olarak duruyor olabilir veya string.
        // Güvenli yöntem: JSONB içindeki metinlerde ara.
        query = query.where(function () {
          this.whereRaw("tags->>'en' ILIKE ?", [`%${filter}%`]).orWhereRaw(
            "tags->>'tr' ILIKE ?",
            [`%${filter}%`]
          );
        });
      }
      break;

    // 4. MOD: ZEHRİNİ SEÇ (Ana Alkol)
    case "spirit":
      if (filter) {
        query = query.whereExists(function () {
          this.select(1)
            .from("cocktail_requirements")
            .join(
              "ingredients",
              "cocktail_requirements.ingredient_id",
              "ingredients.ingredient_id"
            )
            .where(
              "cocktail_requirements.cocktail_id",
              db.ref("cocktails.cocktail_id")
            )
            .andWhere(function () {
              // --- ÖZEL VİSKİ MANTIĞI ---
              if (filter === "WhiskeyFamily") {
                this.whereRaw("ingredients.name->>'en' ILIKE ?", [`%Whisk%`])
                  .orWhereRaw("ingredients.name->>'en' ILIKE ?", [`%Bourbon%`])
                  .orWhereRaw("ingredients.name->>'en' ILIKE ?", [`%Scotch%`])
                  .orWhereRaw("ingredients.name->>'tr' ILIKE ?", [`%Viski%`])
                  .orWhereRaw("ingredients.name->>'tr' ILIKE ?", [`%Burbon%`]);
              }
              // --- DİĞERLERİ (Votka, Cin, Rom vb.) ---
              else {
                this.whereRaw("ingredients.name->>'en' ILIKE ?", [
                  `%${filter}%`,
                ]).orWhereRaw("ingredients.name->>'tr' ILIKE ?", [
                  `%${filter}%`,
                ]);
              }
            });
        });
      }
      break;

    // YENİ MOD: CUSTOM (Kullanıcının Seçtikleri)
    case "custom":
      if (Array.isArray(filter) && filter.length > 0) {
        query = query.whereIn("cocktail_id", filter);
      }
      break;

    // 5. MOD: BARMEN'İN SÜRPRİZİ (Hepsi / Random)
    case "random":
    default:
      // Filtre yok, hepsi gelir
      break;
  }

  return await query;
};

module.exports = {
  getRoulettePool,
};
