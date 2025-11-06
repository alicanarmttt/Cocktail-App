//.env variables -> process.env
require("dotenv").config();

//Mssql connection settings (came from env)
module.exports = {
  development: {
    client: "mssql",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 1433,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    },
    migrations: {
      directory: "./src/db/migrations",
    },
    seeds: {
      directory: "./src/db/seeds",
    },
  },

  production: {},
};
