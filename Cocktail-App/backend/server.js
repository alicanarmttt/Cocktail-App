require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 5000;

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

/**
 * @desc Ana Rota Yönlendiricisi (Main App Router)
 * '/api/cocktails' ile başlayan tüm istekleri 'cocktailRoutes' dosyasına yönlendirir.
 */
app.use("/api/cocktails", cocktailRoutes);

/**
 * @desc Ana Rota Yönlendiricisi (Main App Router)
 * '/api/ingredients' ile başlayan tüm istekleri 'ingredientRoutes' dosyasına yönlendirir.
 */
app.use("/api/ingredients", ingredientRoutes);

/**
 * @desc Ana Rota Yönlendiricisi (Main App Router)
 * '/api/barmen' ile başlayan tüm istekleri 'barmenRoutes' dosyasına yönlendirir.
 */
app.use("/api/barmen", barmenRoutes);

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
