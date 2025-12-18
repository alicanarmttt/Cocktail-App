import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "../api/apiClient";

/**
 * @desc    Backend'deki 'Akıllı Filtreleme' API'sine POST isteği gönderir.
 * @name    barmen/findRecipes
 * @param   {object} payload - { inventoryIds: [1, 7, ...], mode: 'strict' }
 */
export const findRecipes = createAsyncThunk(
  "barmen/findRecipes",
  async (payload) => {
    // ÖNEMLİ: ingredientSlice'taki 'GET'ten farklı olarak,
    // biz 'POST' kullanıyoruz ve 'payload' (gövde) gönderiyoruz.
    const response = await apiClient.post(
      `barmen/find-recipes`,
      payload // { inventoryIds: [...], mode: '...' }
    );
    return response.data;
  }
);

/**
 * @desc    WIZARD MODU İÇİN: Seçilen ana içkilere göre yancı/ipucu malzemeleri getirir.
 * @name    barmen/fetchMenuHints
 * @param   {Array} baseSpiritIds - [1, 5] gibi ID dizisi
 */
export const fetchMenuHints = createAsyncThunk(
  "barmen/fetchMenuHints",
  async (baseSpiritIds, { rejectWithValue }) => {
    try {
      // Backend route: /api/barmen/hints
      const response = await apiClient.post(`barmen/hints`, { baseSpiritIds });
      return response.data;
    } catch (error) {
      // apiClient hatasını yakala ve Redux'a bildir
      return rejectWithValue(
        error.response?.data || "İpuçları alınırken hata oluştu"
      );
    }
  }
);

const initialState = {
  // Arama Sonuçları (Result Screen)
  searchResults: [],
  searchStatus: "idle",
  searchError: null,

  // İpuçları (Wizard Screen) -- YENİ EKLENDİ
  hints: [],
  hintsStatus: "idle",
};

export const barmenSlice = createSlice({
  name: "barmen",
  initialState,
  reducers: {
    // İstersek arama sonuçlarını temizlemek için bir 'reducer'
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchStatus = "idle";
      state.searchError = null;
    },
    // Wizard ekranından çıkınca ipuçlarını temizle -- YENİ EKLENDİ
    clearHints: (state) => {
      state.hints = [];
      state.hintsStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    // --- FIND RECIPES (MEVCUT) ---
    builder
      .addCase(findRecipes.pending, (state) => {
        state.searchStatus = "loading";
        state.searchError = null;
      })
      .addCase(findRecipes.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
        state.searchResults = action.payload;
      })
      .addCase(findRecipes.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.searchError = action.error.message;
      });

    // --- FETCH MENU HINTS (YENİ EKLENDİ) ---
    builder
      .addCase(fetchMenuHints.pending, (state) => {
        state.hintsStatus = "loading";
      })
      .addCase(fetchMenuHints.fulfilled, (state, action) => {
        state.hintsStatus = "succeeded";
        state.hints = action.payload;
      })
      .addCase(fetchMenuHints.rejected, (state) => {
        state.hintsStatus = "failed";
      });
  },
});

// === Selector'ler (Bu 'slice'ın verilerini okumak için) ===

export const { clearSearchResults, clearHints } = barmenSlice.actions;

/**
 * @desc  Akıllı arama sonucunda dönen kokteyl listesini seçer
 */
export const selectSearchResults = (state) => state.barmen.searchResults;

/**
 * @desc  Akıllı aramanın (findRecipes) durumunu alır
 */
export const getSearchStatus = (state) => state.barmen.searchStatus;

/**
 * @desc  Akıllı aramadaki hatayı alır
 */
export const getSearchError = (state) => state.barmen.searchError;

// --- YENİ SELECTORLAR (Wizard Modu İçin) ---

/**
 * @desc  Wizard modunda gelen akıllı malzeme önerilerini seçer
 */
export const selectHints = (state) => state.barmen.hints;

/**
 * @desc  İpucu çekme işleminin durumunu alır (loading/succeeded/failed)
 */
export const getHintsStatus = (state) => state.barmen.hintsStatus;

export default barmenSlice.reducer;
