🍹 Cocktail-App (Full-Stack Mobil Proje)

Bu proje, React Native (Expo) ve Node.js (Express, Knex, MSSQL) kullanarak geliştirilmiş, tam donanımlı (full-stack) bir mobil kokteyl tarifi uygulamasıdır.

Bu depo, hem Frontend (mobil uygulama) hem de Backend (API sunucusu) kodunu içeren bir Monorepo (tek depo) yapısında organize edilmiştir. <br><br>
<img src="/Cocktail-App/docs/HomeScreen.jpg" alt="Kokteyl Uygulaması Ekran Görüntüsü" width="200" />
<img src="/Cocktail-App/docs/CocktailDetailScreen.jpg" alt="Kokteyl Detay Sayfası" width="200" />
<img src="/Cocktail-App/docs/CocktailDetailModal.jpg" alt="Kokteyl Detay Sayfası Modal" width="200" />
<br><br>
🎯 Temel Amaç

Bu uygulamanın amacı, kokteyl meraklılarına temiz bir arayüzle tarifler sunmak ve "Pro" özellikler (alternatif malzeme önerileri, eldeki malzemelerle filtreleme) için bir temel oluşturmaktır.

Proje, modern mobil uygulama geliştirme pratiklerini (Monorepo mimarisi, Sorumlulukların Ayrılması, İlişkisel Veritabanı Tasarımı, Global State Yönetimi) göstermek amacıyla geliştirilmektedir.

<br><br>

🛠️ Kullanılan Teknolojiler (Tech Stack)

Backend (API Sunucusu - /backend)

Node.js

Express.js (REST API Çatısı)

Microsoft SQL Server (MSSQL) (Veritabanı)

Knex.js (SQL Query Builder, Migrations & Seeding)

dotenv (Güvenli ortam değişkenleri yönetimi)

Frontend (Mobil Uygulama - /frontend)

React Native

Expo (Managed Workflow)

Redux Toolkit (Global State Yönetimi & createAsyncThunk ile API çağrıları)

React Navigation (Stack ve Tab Navigasyon Mimarisi)

@react-native-picker/picker (Native "Rulet" Seçici Bileşeni)

Axios (HTTP İstemcisi)
<br><br>

🚀 Yerel (Local) Kurulum ve Çalıştırma

Bu projeyi yerel makinenizde çalıştırmak için:

1. Backend (Sunucu) Kurulumu

Depoyu klonlayın ve backend klasörüne gidin:

git clone [https://github.com/alicanarmttt/Cocktail-App.git](https://github.com/alicanarmttt/Cocktail-App.git)
cd Cocktail-App/backend


Gerekli paketleri kurun:

npm install

.env dosyasını oluşturun:

backend klasörü içinde .env adında bir dosya oluşturun.

DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME değişkenlerini kendi MSSQL sunucu bilgilerinizle doldurun.

Veritabanını Kurun:

MSSQL sunucunuzda, .env dosyanızda belirttiğiniz isimde (örn: CocktailAppDB) boş bir veritabanı oluşturun.

Veritabanı Şemasını (Tabloları) Yükleyin:

npx knex migrate:latest

<br><br>
Test Verilerini (4 Kokteyl) Yükleyin:

npx knex seed:run


Sunucuyu Başlatın:

npm run dev


(Sunucu http://localhost:5000 adresinde çalışıyor olmalı.)

2. Frontend (Mobil Uygulama) Kurulumu

Yeni bir terminal açın ve frontend klasörüne gidin:

cd ../frontend 

<br><br>
Gerekli paketleri kurun:

npm install

.env dosyasını oluşturun:

frontend klasörü içinde .env adında bir dosya oluşturun.

İçine EXPO_PUBLIC_API_URL=http://[BILGISAYARINIZIN_IP_ADRESI]:5000 satırını ekleyin.

(Bilgisayarınızın IP adresini (192.168.1.XX gibi) bulmak için ipconfig (Windows) veya ifconfig (Mac) komutunu kullanın.)

Uygulamayı Başlatın:

npx expo start


Telefonunuzdaki Expo Go uygulaması ile terminalde çıkan QR kodu okutun.
