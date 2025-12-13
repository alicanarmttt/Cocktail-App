require("dotenv").config();

// server.js dosyasının EN ÜST SATIRI
const dns = require("node:dns");
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const express = require("express");
const cors = require("cors");
const app = express();
const rateLimit = require("express-rate-limit");

const PORT = process.env.PORT || 5000;
// === GÜVENLİK ADIMI 1: Middleware dosyasını içe aktar ===
const verifyToken = require("./src/middleware/authMiddleware");

// === GÜVENLİK ADIMI 2: Rate Limiter (Hız Sınırlayıcı) ===
// Bu ayar, aynı IP adresinden gelen istekleri sınırlar.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Dakika
  max: 100, // Her IP için 15 dakikada maksimum 100 istek
  standardHeaders: true, // `RateLimit-*` başlıklarını (header) yanıtla birlikte gönder
  legacyHeaders: false, // `X-RateLimit-*` başlıklarını devre dışı bırak
  message: {
    error: "Too Many Requests",
    message:
      "Çok fazla istek gönderdiniz, lütfen 15 dakika sonra tekrar deneyin.",
  },
});

// === Middleware (Ara Yazılımlar) ===

// Frontend'in (farklı port/adresten) API'ye erişebilmesi için CORS'u etkinleştir
app.use(cors());
// Gelen JSON formatlı istek (body) gövdelerini parse etmek (okumak) için
app.use(express.json());

app.use(limiter);

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

// Render Health Check için basit bir route
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
