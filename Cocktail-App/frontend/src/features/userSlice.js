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

// Avatar Güncelleme Thunk'ı
export const updateUserAvatar = createAsyncThunk(
  "user/updateUserAvatar",
  async (avatarId, { rejectWithValue }) => {
    try {
      const response = await apiClient.put("/users/me/avatar", {
        avatar_id: avatarId,
      });
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.msg || "Avatar güncellenemedi."
      );
    }
  }
);

/* // --- GELECEKTE KULLANILACAK: PRO ÜYELİK THUNK'I ---
// Mağaza onayı ve ödeme sistemi entegrasyonu sonrası açılacak.
export const upgradeToPro = createAsyncThunk("/user/upgradeToPro", async () => {
  const response = await apiClient.post(`/users/upgrade-to-pro`, {});
  return response.data;
});
*/

const initialState = {
  // Kullanıcı verisi (Giriş yaparsa dolar, misafirken null kalır)
  currentUser: null,

  // YENİ: Misafir Modu Bayrağı
  isGuest: false,

  // API isteğinin durumunu yönet
  loginStatus: "idle",
  loginError: null,

  /*
  // GELECEKTE AÇILACAK:
  upgradeStatus: "idle", 
  upgradeError: null,
  */

  // Uygulama ilk açıldığında kontrol sürerken true olur
  isAuthLoading: true,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;
      state.isGuest = false; // Gerçek kullanıcı set edilirse misafir değildir
    },

    // YENİ: Misafir Girişi Reducer'ı
    loginAsGuest: (state) => {
      state.isGuest = true;
      state.currentUser = null; // Misafirin backend verisi yoktur
      state.isAuthLoading = false; // Yükleme bitti, içeri al
    },

    // Çıkış Yap (Logout) reducer'ı
    clearUser: (state) => {
      state.currentUser = null;
      state.isGuest = false; // Misafir modundan da çık
      state.loginStatus = "idle";
      state.loginError = null;
      // state.upgradeStatus = "idle"; // GELECEKTE AÇILACAK
      // state.upgradeError = null;    // GELECEKTE AÇILACAK
      state.isAuthLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- LOGIN / REGISTER DURUMLARI ---
      .addCase(loginOrRegisterUser.pending, (state) => {
        state.loginStatus = "loading";
        state.loginError = null;
        state.isAuthLoading = true;
      })
      .addCase(loginOrRegisterUser.fulfilled, (state, action) => {
        state.loginStatus = "succeeded";
        state.currentUser = action.payload;
        state.isGuest = false; // Giriş başarılıysa misafir değildir
        state.isAuthLoading = false;
      })
      .addCase(loginOrRegisterUser.rejected, (state, action) => {
        state.loginStatus = "failed";
        state.loginError = action.error.message;
        state.currentUser = null;
        state.isAuthLoading = false;
      });

    // --- AVATAR GÜNCELLEME DURUMLARI ---
    builder.addCase(updateUserAvatar.fulfilled, (state, action) => {
      if (state.currentUser) {
        state.currentUser.avatar_id = action.payload.avatar_id;
      }
    });

    /*
    // --- GELECEKTE KULLANILACAK: PRO DURUMLARI ---
    builder
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
    */
  },
});

export const { setUser, clearUser, loginAsGuest } = userSlice.actions;

// === Selector'ler ===

export const selectCurrentUser = (state) => state.user.currentUser;

// YENİ: Misafir mi?
export const selectIsGuest = (state) => state.user.isGuest;

// YENİ: Kullanıcı İÇERİDE Mİ? (Giriş yapmış VEYA Misafir ise true döner)
// Bu selector'ı Navigasyon'da kullanacağız.
export const selectIsAuthenticatedOrGuest = (state) =>
  !!state.user.currentUser || state.user.isGuest;

// Pro kontrolü (Sadece gerçek kullanıcı ve is_pro true ise)
// Not: Bu selector kalabilir, false döneceği için sorun yaratmaz.
export const selectIsPro = (state) => state.user.currentUser?.is_pro || false;

export const getLoginStatus = (state) => state.user.loginStatus;
export const getIsAuthLoading = (state) => state.user.isAuthLoading;

// export const getUpgradeStatus = (state) => state.user.upgradeStatus; // GELECEKTE AÇILACAK
// export const getUpgradeError = (state) => state.user.upgradeError;   // GELECEKTE AÇILACAK

export default userSlice.reducer;
