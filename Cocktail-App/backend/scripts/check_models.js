// scripts/check_models.js
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function check() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    console.log("📡 Google API'ye bağlanılıyor...");
    // Mevcut modelleri listele
    const modelInstance = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
    // Not: Model listesini çekmek için genAI objesini kullanıyoruz, model objesini değil.
    // Ancak SDK yapısı gereği direkt ana class üzerinden model listesi çekemeyebiliriz,
    // bu yüzden basit bir 'info' sorgusu yerine direkt bir model ile test edelim.

    // Basit bir "Merhaba" testi yapalım. Eğer bu çalışırsa model adın doğrudur.
    const result = await modelInstance.generateContent("Test");
    console.log("✅ BAŞARILI! 'gemini-1.5-flash' modeli çalışıyor.");
    console.log("Cevap:", result.response.text());
  } catch (error) {
    console.error("❌ HATA DETAYI:");
    console.error(error.message);

    if (error.message.includes("API key not valid")) {
      console.log("👉 İPUCU: API Key geçersiz. Kopyalarken bir harf eksik mi?");
    }
    if (error.message.includes("User location is not supported")) {
      console.log(
        "👉 İPUCU: Bulunduğun ülkede (VPN kullanıyorsan) bu model kapalı olabilir."
      );
    }
  }
}

check();
