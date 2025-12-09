const knexConfig = require("../../../knexfile").development;
const db = require("knex")(knexConfig);

// Sabit Popüler Listesi (Frontend ile uyumlu olmalı veya DB'de flag tutulmalı)
// Şimdilik isim bazlı filtreleme yapıyoruz.
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
 * @param   {string} mode - 'random', 'driver', 'popular', 'taste', 'spirit'
 * @param   {any} filter - Moduna göre filtre değeri (tag, ingredientId vb.)
 */

const getRoulettePool = async (mode, filter = null) => {
  // Temel Sorgu: Bize sadece ID, İsim ve Resim lazım. (Detaylara gerek yok)
  let query = db("cocktails").select(
    "cocktail_id",
    "name_tr",
    "name_en",
    "image_url",
    "is_alcoholic"
  );
  switch (mode) {
    // 1. MOD: SÜRÜCÜ (Alkolsüzler)
    case "driver":
      query = query.where("is_alcoholic", false);
      break;

    // 2. MOD: ŞÖHRETLER KARMASI (Popülerler)
    case "popular":
      query = query.whereIn("name_en", POPULAR_NAMES);
      break;

    // 3. MOD: DAMAK TADI (Tag Filtreleme)
    // filter örn: "Sweet", "Sour", "Bitter"
    case "taste":
      if (filter) {
        // Hem TR hem EN taglarda arayalım
        query = query.where(function () {
          this.where("tags_en", "like", `%${filter}%`).orWhere(
            "tags_tr",
            "like",
            `%${filter}%`
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
              // Eğer Frontend "WhiskeyFamily" gönderirse, tüm viski türlerini ara.
              if (filter === "WhiskeyFamily") {
                this.where("ingredients.name_en", "like", `%Whisk%`) // Whiskey, Whisky
                  .orWhere("ingredients.name_en", "like", `%Bourbon%`)
                  .orWhere("ingredients.name_en", "like", `%Scotch%`)
                  .orWhere("ingredients.name_tr", "like", `%Viski%`)
                  .orWhere("ingredients.name_tr", "like", `%Burbon%`);
              }
              // --- DİĞERLERİ (Votka, Cin, Rom vb.) ---
              else {
                this.where(
                  "ingredients.name_en",
                  "like",
                  `%${filter}%`
                ).orWhere("ingredients.name_tr", "like", `%${filter}%`);
              }
            });
        });
      }
      break;

    // 5. MOD: BARMEN'İN SÜRPRİZİ (Hepsi / Random)
    case "random":
    default:
      // Hiçbir filtre uygulama, hepsini getir.
      // (Rastgele seçimi frontend veya backend yapabilir, burada havuzu veriyoruz)
      break;
  }

  // Sonuçları çalıştır
  return await query;
};

module.exports = {
  getRoulettePool,
};
