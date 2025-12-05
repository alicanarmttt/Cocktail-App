require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 5000;
// === GÜVENLİK ADIMI 1: Middleware dosyasını içe aktar ===
const verifyToken = require("./src/middleware/authMiddleware");

// --- DEBUG LOGGER (YENİ EKLENDİ) ---
// Gelen her isteğin metodunu ve tam adresini konsola yazar.
// Örn: [ISTEK]: POST /api/users/loginOrRegister
app.use((req, res, next) => {
  console.log(`[ISTEK]: ${req.method} ${req.url}`);
  next();
});
// -----------------------------------

// === Middleware (Ara Yazılımlar) ===

// Frontend'in (farklı port/adresten) API'ye erişebilmesi için CORS'u etkinleştir
app.use(cors());
// Gelen JSON formatlı istek (body) gövdelerini parse etmek (okumak) için
app.use(express.json());

// === Rota (Route) Tanımlamaları ===

// Kokteyl rotalarını (src/api/cocktails.js) içe aktar

const cocktailRoutes = require("./src/api/cocktails");
const ingredientRoutes = require("./src/api/ingredients");
const barmenRoutes = require("./src/api/barmen");
const userRoutes = require("./src/api/users");
const rouletteRoutes = require("./src/api/roulette");

app.use("/api/cocktails", cocktailRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/barmen", barmenRoutes);
app.use("/api/roulette", rouletteRoutes);

app.use("/api/users", verifyToken, userRoutes);

// Sunucunun ayakta olup olmadığını test etmek için kök rota
app.get("/", (req, res) => {
  res.status(200).send("Cocktail API Server is running.");
});

//sunucuyu başlat
app.listen(PORT, () => {
  console.log(
    `Backend sunucusu http://localhost:${PORT} adresinde çalışıyor...`
  );
});
