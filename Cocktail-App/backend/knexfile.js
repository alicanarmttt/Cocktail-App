// backend/knexfile.js
require("dotenv").config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: "pg",
    // DÜZELTME: connection'ı string yerine obje yapıyoruz
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Supabase için bu ayar BURADA olmalı
      // ---> AŞAĞIDAKİ SATIRI EKLEMEN ÇOK ÖNEMLİ <---
      family: 4,
    },

    migrations: {
      directory: "./src/db/migrations",
    },
    seeds: {
      directory: "./src/db/seeds",
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  production: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      family: 4,
    },
    migrations: {
      directory: "./src/db/migrations",
    },
    seeds: {
      directory: "./src/db/seeds",
    },
    pool: {
      min: 2,
      max: 10, // Bağlantı havuzunu biraz artırdık, daha sağlıklı olur
    },
  },
};
