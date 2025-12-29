const db = require("../knex");

// Sabit Popüler Listesi (İsimler İngilizce olarak eşleşmeli - Referansımız 'en')
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
 * @desc    Rulet havuzunu getirir. Filtreleme 'en' anahtarı üzerinden yapılarak stabilite sağlanır.
 */
const getRoulettePool = async (mode, filter = null) => {
  let query = db("cocktails").select(
    "cocktail_id",
    "name", // Frontend getName() ile 6 dilden birini seçecek
    "image_url",
    "is_alcoholic"
  );

  switch (mode) {
    case "driver":
      query = query.where("is_alcoholic", false);
      break;

    case "popular":
      // İngilizce isme göre filtrelemek 6 dil gelse de en güvenli yoldur.
      query = query.whereRaw("name->>'en' = ANY(?)", [POPULAR_NAMES]);
      break;

    case "taste":
      if (filter) {
        // GÜNCELLEME: Filtreleme her zaman 'en' sütunu üzerinden yapılır.
        // Çünkü frontend'den gelen filter değerleri (Sweet, Sour vb.) İngilizce sabitlerdir.
        query = query.whereRaw("tags->>'en' ILIKE ?", [`%${filter}%`]);
      }
      break;

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
                // İngilizce anahtar kelimeler tüm viski türlerini kapsar.
                this.whereRaw("ingredients.name->>'en' ILIKE ?", [`%Whisk%`])
                  .orWhereRaw("ingredients.name->>'en' ILIKE ?", [`%Bourbon%`])
                  .orWhereRaw("ingredients.name->>'en' ILIKE ?", [`%Scotch%`]);
              }
              // --- DİĞERLERİ (Votka, Cin, Rom vb.) ---
              else {
                // Frontend'den gelen 'Vodka', 'Gin' gibi değerleri 'en' içinde arıyoruz.
                this.whereRaw("ingredients.name->>'en' ILIKE ?", [
                  `%${filter}%`,
                ]);
              }
            });
        });
      }
      break;

    case "custom":
      if (Array.isArray(filter) && filter.length > 0) {
        query = query.whereIn("cocktail_id", filter);
      }
      break;

    case "random":
    default:
      break;
  }

  // Frontend tarafında diller arası alfabetik sıralama yapıldığı için
  // burada standart İngilizce sıralama dönmek API tutarlılığı sağlar.
  return await query.orderByRaw("name->>'en' ASC");
};

module.exports = {
  getRoulettePool,
};
