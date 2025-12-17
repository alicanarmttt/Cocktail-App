# 🍹 Cocktail App: The Smart Barman & Party Assistant

<div align="center">

  
  <a href="https://reactnative.dev/">
    <img src="https://img.shields.io/badge/Mobile-React%20Native-blue?style=for-the-badge&logo=react" />
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge&logo=nodedotjs" />
  </a>
  <a href="https://supabase.com/">
    <img src="https://img.shields.io/badge/Database-Supabase%20(PostgreSQL)-3ECF8E?style=for-the-badge&logo=supabase" />
  </a>
  <a href="https://render.com/">
    <img src="https://img.shields.io/badge/Hosting-Render-black?style=for-the-badge&logo=render" />
  </a>
  <a href="https://redux-toolkit.js.org/">
    <img src="https://img.shields.io/badge/State-Redux%20Toolkit-purple?style=for-the-badge&logo=redux" />
  </a>
</div>

<br>

## 🎯 Proje Özeti

Bu proje, standart bir tarif defterinin ötesine geçerek kullanıcıya **"Akıllı Bir Asistan"** ve **"Parti Eğlencesi"** sunan kapsamlı bir Full-Stack mobil uygulamadır.

Modern mobil mimari prensipleriyle (Monorepo) geliştirilen uygulama, **Render (Compute)** ve **Supabase (Storage)** servislerinin hibrit kullanımıyla performanslı bir backend altyapısına sahiptir. Sorumlulukların ayrılması (Separation of Concerns) ilkesine sadık kalınarak, iş mantığı backend modellerinde, UI durumu ise Redux slice'larında yönetilir.

<br>

## Ekran Görüntüleri
<div align="center">
  <img src="Cocktail-App/docs/home.jpeg" width="20%" />
  <img src="Cocktail-App/docs/Roulette.jpeg" width="20%" />
  <img src="Cocktail-App/docs/AssistantScreen.jpeg" width="20%" />
</div>

<br>

<details>
  <summary><b>📸 Diğer Ekran Görüntülerini Gör (8 Fotoğraf)</b></summary>
  <br>
  <div align="center">
      <img src="Cocktail-App/docs/CocktailDetailScreen.jpeg" width="20%" />
      <img src="Cocktail-App/docs/IngredientsModal.jpeg" width="20%" />
      <img src="Cocktail-App/docs/IngredientAlternativeModal.jpeg" width="20%" />
      <br><br>
      <img src="Cocktail-App/docs/RouletteMod.jpeg" width="20%" />
      <img src="Cocktail-App/docs/Roulette.jpeg" width="20%" />
      <img src="Cocktail-App/docs/AssistantResult.jpeg" width="20%" />
      <img src="Cocktail-App/docs/ProfileScreen.jpeg" width="20%" />
      <img src="Cocktail-App/docs/FavoriteScreen.jpeg" width="20%" />
  </div>
</details>
<br>

## ✨ Öne Çıkan Özellikler (UX & Fun)

### 1. 🤖 Akıllı Barmen Asistanı
Kullanıcının elindeki malzemelere göre kokteyl önerir ve sonuçları akıllıca gruplar:
* **Smart Substitution (Alternatif Mantığı):** Kullanıcıda *Lime Suyu* yok ama *Limon Suyu* varsa, sistem bunu veritabanı seviyesinde algılar ve eksik malzeme saymaz.
* **Akıllı Sıralama:** Sonuçlar "Hemen Yapılabilir", "Az Eksik" ve "İlham Verici" olarak sunulur.

### 2. 🎰 Kokteyl Ruleti (Gamification)
Sadece rastgele seçim yapan basit bir fonksiyon değil, Backend üzerinde çalışan özel filtreleme algoritmalarına sahip bir parti modudur:
* **🚗 Sürücü Modu:** Veritabanındaki `is_alcoholic` parametresini kontrol ederek alkolsüz seçenekler sunar.
* **🔥 Şöhretler Karması:** Dünya genelinde popüler (IBA listesi vb.) kokteyller arasından seçim yapar.
* **🥃 Zehrini Seç (Spirit Mode):** Kullanıcının sevdiği baz içkiye (Viski, Cin, Votka vb.) göre `JSONB` verileri taranarak özel havuz oluşturulur.
* **🎲 Party Mode:** Arkadaş grubuyla oynamak için tasarlanmış interaktif arayüz.

### 3. 🔄 Dinamik Alternatif Gösterimi
Detay sayfalarında, eğer kullanıcının malzemesi eksikse ancak veritabanında tanımlı bir alternatifi (Substitution) varsa, kullanıcıya görsel ipuçları verilerek **"Eksik: Şeker Şurubu (Alternatif: Bal kullanabilirsin)"** şeklinde yönlendirme yapılır.

<br>

## 🏗️ Sistem Mimarisi & Altyapı

Proje, modern bulut servislerinin orkestrasyonu ile çalışır:
<br>
<div align="center">
  <code>React Native (Frontend)</code> 
  ↔️ 
  <code>Render (Node.js API)</code> 
  ↔️ 
  <code>Supabase (PostgreSQL DB)</code>
</div>
<br>
* **Backend (Render):** Node.js servisi Render üzerinde çalışır. Rulet hesaplamaları ve Asistan algoritmaları burada işlenir.
* **Database (Supabase):** Veriler ilişkisel tablolar ve JSONB veri tipleriyle Supabase (PostgreSQL) üzerinde tutulur.
* **Media (Cloudinary):** Yüksek çözünürlüklü görseller CDN üzerinden servis edilerek uygulama boyutu optimize edilmiştir.

<br>

## 🛠️ Teknik Derinlik (Technical Highlights)

Geliştirme sürecinde çözülen karmaşık mühendislik problemleri:

### 1. Backend-Driven Roulette Logic (`JSONB` & `Raw SQL`)
Rulet modları için `Knex.js` kullanılarak karmaşık SQL sorguları yazılmıştır. Çoklu dil desteği (TR/EN) nedeniyle veriler JSON formatında tutulduğu için, filtrelemeler PostgreSQL `JSONB` operatörleri ile yapılır.
* **Örnek:** "Whiskey" ailesini ararken hem İngilizce hem Türkçe isimler JSON içinden taranır (`name->>'en' ILIKE...`).

### 2. Database Migration (MSSQL ➡️ PostgreSQL)
Proje başlangıcında MSSQL üzerinde kurgulanan yapı, maliyet ve performans optimizasyonu için PostgreSQL'e taşınmıştır. Veri tipleri ve sorgular (özellikle JSON manipülasyonları) PostgreSQL standartlarına göre yeniden yazılmıştır.

### 3. Redux Toolkit ile Modüler State Yönetimi
Frontend tarafında state yönetimi, özelliğe dayalı (Feature-based) bir yapıda kurgulanmıştır.
* `barmenSlice`: Asistan algoritmasından dönen verileri yönetir.
* `rouletteSlice`: Oyun modlarını ve çark durumunu yönetir.
* `ingredientSlice`: Kullanıcı envanterini senkronize eder.

<br>

## 📂 Proje Dosya Yapısı (Monorepo)

Aşağıdaki yapı, projenin temiz mimarisini ve klasör organizasyonunu göstermektedir:

```text
Cocktail-App/
├── backend/                        # Node.js & Express API
│   ├── src/
│   │   ├── api/                    # Controllers (İstek karşılayıcılar)
│   │   │   ├── barmen.js           # Asistan endpointleri
│   │   │   ├── roulette.js         # Rulet endpointleri
│   │   │   └── ...
│   │   ├── db/                     # Veritabanı Katmanı
│   │   │   ├── migrations/         # Şema değişiklikleri
│   │   │   ├── models/             # Business Logic & SQL Sorguları
│   │   │   │   ├── barmen.model.js
│   │   │   │   ├── roulette.model.js
│   │   │   │   └── ...
│   │   │   └── seeds/              # Örnek veriler
│   │   └── middleware/             # Auth ve Validasyon
│   └── server.js                   # Entry Point
│
├── src/                            # React Native Frontend
│   ├── api/                        # Axios Client & Config
│   ├── app/                        # Redux Store Config
│   ├── components/                 # Reusable UI Bileşenleri
│   ├── features/                   # Redux Slices (State Management)
│   │   ├── cocktails/
│   │   │   ├── barmenSlice.js
│   │   │   ├── rouletteSlice.js
│   │   │   └── ingredientSlice.js
│   ├── i18n/                       # Dil Yapılandırması (TR/EN)
│   ├── navigation/                 # Stack & Tab Navigators
│   ├── screens/                    # Uygulama Ekranları
│   │   ├── AssistantScreen.js
│   │   ├── RouletteScreen.js
│   │   └── ...
│   └── ui/                         # Atomic Design UI Elementleri
└── App.js
