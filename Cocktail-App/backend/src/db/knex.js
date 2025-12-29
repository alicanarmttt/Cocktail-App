const knex = require("knex");
const knexFile = require("../../knexfile");
// Ortamı algıla (Render 'production' atar, yoksa 'development' olsun)
const environment = process.env.NODE_ENV || "development";

// O ortama uygun ayarı seç
const config = knexFile[environment];

// Ayar bulunamazsa hata fırlat (Debug için hayat kurtarır)
if (!config) {
  throw new Error(
    `Knexfile içinde '${environment}' ortamı için ayar bulunamadı!`
  );
}

// Tek bir instance oluştur ve dışarı aç
const db = knex(config);

module.exports = db;
