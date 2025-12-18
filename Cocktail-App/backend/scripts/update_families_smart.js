require("dotenv").config();
// Knex dosyanın yolunu projene göre ayarla. Genelde bir üst dizindedir.
const knexConfig = require("../knexfile").development;
const db = require("knex")(knexConfig);

// Geliştirilmiş Aile Tespit Fonksiyonu
function getSpiritFamily(engName) {
  if (!engName) return null;

  const name = engName.toLowerCase();

  // 1. VİSKİ AİLESİ (Scotch, Bourbon, Rye, Irish...)
  if (
    name.includes("whisky") ||
    name.includes("whiskey") ||
    name.includes("scotch") ||
    name.includes("bourbon") ||
    name.includes("rye") ||
    name.includes("irish") // Irish whiskey için
  ) {
    return "whiskey";
  }

  // 2. ROM AİLESİ (Cachaça ve her türlü Rum)
  if (
    name.includes("rum") ||
    name.includes("cachaça") ||
    name.includes("cachaca")
  ) {
    return "rum";
  }

  // 3. TEKİLA AİLESİ (Mezcal dahil)
  if (name.includes("tequila") || name.includes("mezcal")) {
    return "tequila";
  }

  // 4. BRANDY AİLESİ (Konyak ve Pisco dahil)
  if (
    name.includes("brandy") ||
    name.includes("cognac") ||
    name.includes("pisco")
  ) {
    return "brandy";
  }

  // 5. CİN
  if (name.includes("gin")) {
    return "gin";
  }

  // 6. VOTKA
  if (name.includes("vodka")) {
    return "vodka";
  }

  // Absinthe, Pernod vb. ana içki kategorisine girmez, null döner.
  return null;
}

async function updateFamilies() {
  console.log("🥃 Akıllı Aile (Family) güncellemesi başlıyor...");

  try {
    // Sadece Ana İçkiler (Category ID: 1) olanları çekiyoruz
    const ingredients = await db("ingredients")
      .select("ingredient_id", "name")
      .where("category_id", 1);

    console.log(`🔍 Toplam ${ingredients.length} adet 'Ana İçki' tarandı.`);

    let updatedCount = 0;

    for (const ing of ingredients) {
      const engName = ing.name.en; // JSONB içinden İngilizce ismini al
      const newFamily = getSpiritFamily(engName);

      if (newFamily) {
        // Veritabanını güncelle
        await db("ingredients")
          .where("ingredient_id", ing.ingredient_id)
          .update({ family: newFamily });

        console.log(`✅ [${ing.ingredient_id}] ${engName} -> '${newFamily}'`);
        updatedCount++;
      } else {
        console.log(
          `⚠️ [${ing.ingredient_id}] ${engName} -> Aile atanamadı (Normal olabilir: Absinthe vb.)`
        );
      }
    }

    console.log("\n------------------------------------------------");
    console.log(
      `🎉 İşlem Tamamlandı! ${updatedCount} malzeme sınıflandırıldı.`
    );
    console.log("------------------------------------------------");
  } catch (error) {
    console.error("❌ Hata:", error);
  } finally {
    db.destroy();
  }
}

updateFamilies();
