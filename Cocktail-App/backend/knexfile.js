// backend/knexfile.js
require("dotenv").config();

module.exports = {
  development: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    migrations: { directory: "./src/db/migrations" },
    seeds: { directory: "./src/db/seeds" },
  },

  production: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 0, // ÖNEMLİ: Boşta iken bağlantı sayısı 0'a düşebilsin (Supabase rahatlasın)
      max: 7, // ÖNEMLİ: 10 yerine 7 yapalım, biraz pay kalsın.
      acquireTimeoutMillis: 60000, // Bağlantı bulamazsa hemen hata verme, 60sn bekle (Sabırlı olsun)
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000, // 30sn boyunca kullanılmayan bağlantıyı öldür
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
      propagateCreateError: false, // Bağlantı hatası olursa sunucuyu çökertme, tekrar dene
    },
    migrations: { directory: "./src/db/migrations" },
    seeds: { directory: "./src/db/seeds" },
  },
};
