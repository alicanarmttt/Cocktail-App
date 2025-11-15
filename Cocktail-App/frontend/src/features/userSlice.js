import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// YENİ EKLENDİ: API isteği için
import axios from "axios";

// YENİ EKLENDİ: (barmenSlice.js'teki gibi .env dosyasından)
const BASE_API_URL = process.env.EXPO_PUBLIC_API_URL;

// === MOCK (SAHTE) VERİ SİLİNDİ ===
// const mockProUser = { ... };
// const mockFreeUser = { ... };
// =================================

/**
 * @desc    Backend'deki 'Kullanıcıyı Bul/Oluştur' API'sine POST isteği gönderir.
 * @name    user/loginOrRegisterUser
 * @param   {object} payload - { firebase_uid: "...", email: "..." }
 */
export const loginOrRegisterUser = createAsyncThunk(
  "user/loginOrRegisterUser",
  async (payload) => {
    // Backend'de EKSİK 4 olarak oluşturduğumuz API'yi çağır
    const response = await axios.post(
      `${BASE_API_URL}/api/users/loginOrRegister`,
      payload // { firebase_uid, email }
    );
    // Backend'den dönen (ve 'is_pro' bayrağını içeren)
    // tam kullanıcı objesini (user object) döndürür
    return response.data;
  }
);

const initialState = {
  // GÜNCELLEME: 'mockProUser' yerine 'null'
  // Uygulama artık "Giriş Yapılmamış" (Logged Out) olarak başlıyor
  currentUser: null,

  // YENİ EKLENDİ: API isteğinin durumunu (state) yönet
  loginStatus: "idle", // 'idle', 'loading', 'succeeded', 'failed'
  loginError: null,
};

export const userSlice = createSlice({
  name: "user", // Redux state'indeki adı (state.user)
  initialState,
  reducers: {
    // (setUser ve clearUser'ı 'logout' (çıkış) için saklayalım)
    setUser: (state, action) => {
      state.currentUser = action.payload;
    },
    // Çıkış Yap (Logout) reducer'ı
    clearUser: (state) => {
      state.currentUser = null;
      state.loginStatus = "idle";
      state.loginError = null;
    },
  },
  // YENİ EKLENDİ: 'loginOrRegisterUser' (API isteği) thunk'ını dinle
  extraReducers: (builder) => {
    builder
      .addCase(loginOrRegisterUser.pending, (state) => {
        state.loginStatus = "loading";
        state.loginError = null;
      })
      .addCase(loginOrRegisterUser.fulfilled, (state, action) => {
        state.loginStatus = "succeeded";
        // API'den dönen (is_pro bayrağını içeren) GERÇEK kullanıcı verisini
        // 'currentUser' state'ine kaydet
        state.currentUser = action.payload;
      })
      .addCase(loginOrRegisterUser.rejected, (state, action) => {
        state.loginStatus = "failed";
        state.loginError = action.error.message;
        state.currentUser = null; // Hata olursa kullanıcıyı 'null' yap
      });
  },
});

// === Selector'ler (Bu 'slice'ın verilerini okumak için) ===

export const { setUser, clearUser } = userSlice.actions;

/**
 * @desc  Mevcut giriş yapmış kullanıcıyı seçer
 */
export const selectCurrentUser = (state) => state.user.currentUser;

/**
 * @desc  Mevcut kullanıcının 'Pro' olup olmadığını (true/false) seçer
 */
export const selectIsPro = (state) => state.user.currentUser?.is_pro || false;

// YENİ EKLENDİ: Login ekranı için
export const getLoginStatus = (state) => state.user.loginStatus;

export default userSlice.reducer;
