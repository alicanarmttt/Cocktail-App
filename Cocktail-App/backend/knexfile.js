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
      // URL yerine PARÇALI YAPI kullanıyoruz.
      // Bu sayede alttaki family: 4 ayarı KESİN çalışacak.
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 6543,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },

      // İŞTE BÜYÜLÜ SATIR BURADA
      family: 4,
    },
    migrations: { directory: "./src/db/migrations" },
    seeds: { directory: "./src/db/seeds" },
    pool: { min: 2, max: 10 },
  },
};
