// scripts/list_available_models.js
require("dotenv").config();

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function listModels() {
  console.log(
    "📡 Google Sunucularına soruluyor: 'Hangi modelleri kullanabilirim?'..."
  );

  try {
    const response = await fetch(URL);
    const data = await response.json();

    if (response.status !== 200) {
      console.error("❌ HATA: API Key veya Proje sorunu var.");
      console.error("Status:", response.status);
      console.error("Mesaj:", data.error ? data.error.message : data);
      return;
    }

    console.log(
      "✅ BAŞARILI! İşte senin API anahtarının erişebildiği modeller:\n"
    );

    // Sadece 'generateContent' destekleyen modelleri filtreleyelim
    const availableModels = data.models
      .filter((m) => m.supportedGenerationMethods.includes("generateContent"))
      .map((m) => m.name); // models/gemini-pro gibi döner

    if (availableModels.length === 0) {
      console.log(
        "⚠️ HİÇBİR MODEL BULUNAMADI! API Key projesinde Generative AI kapalı olabilir."
      );
    } else {
      availableModels.forEach((model) => console.log(`👉 ${model}`));
    }

    console.log("\n------------------------------------------------");
    console.log(
      "ÇÖZÜM: Yukarıdaki listeden 'models/' kısmını atarak bir isim seç."
    );
    console.log(
      "Örneğin: 'models/gemini-pro' gördüysen, koduna 'gemini-pro' yaz."
    );
  } catch (error) {
    console.error("Bir hata oluştu:", error.message);
  }
}

listModels();
