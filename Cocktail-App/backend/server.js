require("dotenv").config();

// DNS Ayarı (Aynen kalıyor)
const dns = require("node:dns");
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

const express = require("express");
const cors = require("cors");
const app = express();
const rateLimit = require("express-rate-limit");

const PORT = process.env.PORT || 5000;
const verifyToken = require("./src/middleware/authMiddleware");

// ============================================================
// DÜZELTME 1: PROXY GÜVENİ (Render/Heroku için ZORUNLU)
// Bu satır olmadan Rate Limiter herkesi aynı kişi sanar!
// ============================================================
app.set("trust proxy", 1);

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// DÜZELTME 2: HEALTH CHECK (Limiter'dan ÖNCE olmalı)
// Render bu adrese sürekli ping atar. Bunu sınırlarsan sunucu çöker.
// ============================================================
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Rate Limiter Ayarı
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too Many Requests",
    message:
      "Çok fazla istek gönderdiniz, lütfen 15 dakika sonra tekrar deneyin.",
  },
});

// ============================================================
// DÜZELTME 3: LIMITER'I DEVREYE ALMA
// Artık limiter sadece buradan sonraki rotalar için geçerli.
// Health check yukarıda olduğu için kurtuldu.
// ============================================================
app.use(limiter);

// Rota Tanımlamaları
const cocktailRoutes = require("./src/api/cocktails");
const ingredientRoutes = require("./src/api/ingredients");
const barmenRoutes = require("./src/api/barmen");
const userRoutes = require("./src/api/users");
const rouletteRoutes = require("./src/api/roulette");
const favoriteRoutes = require("./src/api/favoriteRoutes");

app.use("/api/cocktails", cocktailRoutes);
app.use("/api/ingredients", ingredientRoutes);
app.use("/api/barmen", barmenRoutes);
app.use("/api/roulette", rouletteRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/users", verifyToken, userRoutes);

// Root Rota (Bu da limitlenmeli, o yüzden aşağıda kalabilir)
app.get("/", (req, res) => {
  res.status(200).send("Cocktail API Server is running.");
});

// Sunucuyu Başlat
app.listen(PORT, () => {
  console.log(
    `Backend sunucusu http://localhost:${PORT} adresinde çalışıyor...`
  );
});
