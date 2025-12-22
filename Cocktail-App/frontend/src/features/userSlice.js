import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/apiClient";

// --- THUNKS (ASENKRON İŞLEMLER) ---

/**
 * @desc    Backend'deki 'Kullanıcıyı Bul/Oluştur' API'sine POST isteği gönderir.
 * @name    user/loginOrRegisterUser
 * @param   {object} payload - { firebase_uid: "...", email: "..." }
 */
export const loginOrRegisterUser = createAsyncThunk(
  "user/loginOrRegisterUser",
  async (payload) => {
    const response = await apiClient.post(`/users/loginOrRegister`, payload);

    return response.data;
  }
);

//Yeni Avatar Güncelleme Thunk'ı
export const updateUserAvatar = createAsyncThunk(
  "user/updateUserAvatar",
  async (avatarId, { rejectWithValue }) => {
    try {
      // Backend'e istek at
      const response = await apiClient.put("/users/me/avatar", {
        avatar_id: avatarId,
      });
      // Backend'den dönen veriyi (response.data) reducer'a gönder
      // Backend şuna benzer bir şey dönüyor: { msg: "...", user: { ...avatar_id: 2... } }
      return response.data.user;
    } catch (error) {
      // Hata olursa yakala
      return rejectWithValue(
        error.response?.data?.msg || "Avatar güncellenemedi."
      );
    }
  }
);

/**
 * @desc    Backend'deki 'Pro'ya Yükselt' API'sine POST isteği gönderir.
 * @name    user/upgradeToPro
 * @param   {object} thunkAPI
 */
export const upgradeToPro = createAsyncThunk("/user/upgradeToPro", async () => {
  const response = await apiClient.post(`/users/upgrade-to-pro`, {});
  return response.data;
});

const initialState = {
  // GÜNCELLEME: 'mockProUser' yerine 'null'
  // Uygulama artık "Giriş Yapılmamış" (Logged Out) olarak başlıyor
  currentUser: null,

  // YENİ EKLENDİ: API isteğinin durumunu (state) yönet
  loginStatus: "idle", // 'idle', 'loading', 'succeeded', 'failed'
  loginError: null,

  upgradeStatus: "idle", // 'idle', 'loading', 'succeeded', 'failed'
  upgradeError: null,

  // Uygulama ilk açıldığında Firebase/AsyncStorage'ı
  // kontrol ederken 'true' olacak.
  isAuthLoading: true,
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
      state.upgradeStatus = "idle";
      state.upgradeError = null;
      state.isAuthLoading = false;
    },
  },
  // YENİ EKLENDİ: 'loginOrRegisterUser' (API isteği) thunk'ını dinle
  extraReducers: (builder) => {
    builder
      .addCase(loginOrRegisterUser.pending, (state) => {
        state.loginStatus = "loading";
        state.loginError = null;
        state.isAuthLoading = true;
      })
      .addCase(loginOrRegisterUser.fulfilled, (state, action) => {
        state.loginStatus = "succeeded";
        // API'den dönen (is_pro bayrağını içeren) GERÇEK kullanıcı verisini
        // 'currentUser' state'ine kaydet
        state.currentUser = action.payload;
        state.isAuthLoading = false;
      })
      .addCase(loginOrRegisterUser.rejected, (state, action) => {
        state.loginStatus = "failed";
        state.loginError = action.error.message;
        state.currentUser = null; // Hata olursa kullanıcıyı 'null' yap
        state.isAuthLoading = false;
      });

    // --- AVATAR GÜNCELLEME DURUMLARI ---
    builder
      .addCase(updateUserAvatar.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateUserAvatar.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Backend'den gelen güncel user objesini state'e yaz
        // VEYA sadece avatar_id'yi güncelle:
        if (state.currentUser) {
          state.currentUser.avatar_id = action.payload.avatar_id;
        }
      })
      .addCase(updateUserAvatar.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload; // Hata mesajını kaydet
      })

      // --- PRO DURUMLARI ---
      .addCase(upgradeToPro.pending, (state) => {
        state.upgradeStatus = "loading";
        state.upgradeError = null;
      })
      .addCase(upgradeToPro.fulfilled, (state, action) => {
        state.upgradeStatus = "succeeded";
        // API'den dönen GÜNCELLENMİŞ (is_pro: true) kullanıcı verisiyle
        // 'currentUser' state'ini GÜNCELLE
        state.currentUser = action.payload;
      })
      .addCase(upgradeToPro.rejected, (state, action) => {
        state.upgradeStatus = "failed";
        state.upgradeError = action.error.message;
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
export const getLoginStatus = (state) => state.user.loginStatus;
export const getUpgradeStatus = (state) => state.user.upgradeStatus;
export const getUpgradeError = (state) => state.user.upgradeError;

// (EKSİK 9)
export const getIsAuthLoading = (state) => state.user.isAuthLoading;

export default userSlice.reducer;
