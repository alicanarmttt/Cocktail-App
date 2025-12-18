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
    const response = await apiClient.post(`barmen/find-recipes`, payload);
    return response.data;
  }
);

/**
 * @desc    (MEVCUT) MANUEL MOD İPUÇLARI
 * @name    barmen/fetchMenuHints
 */
export const fetchMenuHints = createAsyncThunk(
  "barmen/fetchMenuHints",
  async (baseSpiritIds, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`barmen/hints`, { baseSpiritIds });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "İpuçları alınırken hata oluştu"
      );
    }
  }
);

// ============================================================
//               YENİ REHBER (WIZARD) THUNK'LARI
// ============================================================

/**
 * @desc    REHBER ADIM 1: Ana içki ailelerini (Viski, Rom...) çeker.
 * @name    barmen/fetchGuideStep1
 * @param   {string} lang - 'tr' veya 'en'
 */
export const fetchGuideStep1 = createAsyncThunk(
  "barmen/fetchGuideStep1",
  async (lang = "en", { rejectWithValue }) => {
    try {
      // Backend: GET /api/barmen/guide/step-1?lang=tr
      const response = await apiClient.get(`barmen/guide/step-1?lang=${lang}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Rehber verileri alınamadı"
      );
    }
  }
);

/**
 * @desc    REHBER ADIM 2: Seçilen aileye uygun yancıları çeker.
 * @name    barmen/fetchGuideStep2
 * @param   {object} payload - { family: "whiskey", lang: "tr" }
 */
export const fetchGuideStep2 = createAsyncThunk(
  "barmen/fetchGuideStep2",
  async ({ family, lang }, { rejectWithValue }) => {
    try {
      // Backend: POST /api/barmen/guide/step-2
      const response = await apiClient.post(`barmen/guide/step-2`, {
        family,
        lang,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Seçenekler alınamadı");
    }
  }
);

/**
 * @desc    REHBER ADIM 3: Seçilen aileye ve ŞİŞELERE uygun taze malzemeleri çeker.
 */
export const fetchGuideStep3 = createAsyncThunk(
  "barmen/fetchGuideStep3",
  // Parametreye 'step2Ids' eklendi
  async ({ family, step2Ids, lang }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`barmen/guide/step-3`, {
        family,
        step2Ids, // Backend'e gönderiyoruz
        lang,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Taze ürünler alınamadı");
    }
  }
);

/**
 * @desc    REHBER SONUÇLARINI GETİR
 * Backend'deki /guide/results endpoint'ine istek atar.
 */
export const fetchWizardResults = createAsyncThunk(
  "barmen/fetchWizardResults",
  async ({ family, selectedIds }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`barmen/guide/results`, {
        family, // örn: "whiskey"
        selectedIds, // örn: [12, 55]
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Sonuçlar alınamadı");
    }
  }
);

const initialState = {
  // --- MEVCUT ---
  searchResults: [],
  searchStatus: "idle",
  searchError: null,
  hints: [],
  hintsStatus: "idle",

  // --- YENİ REHBER STATE'LERİ ---
  guideStep1Options: [], // [{ key: 'whiskey', name: 'Viski' }, ...]
  guideStep2Options: [], // [{ id: 55, name: 'Kahve Likörü' }, ...]
  guideStep3Options: [],
  guideStatus: "idle", // 'loading' | 'succeeded' | 'failed'
  guideError: null,
};

export const barmenSlice = createSlice({
  name: "barmen",
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchStatus = "idle";
      state.searchError = null;
    },
    clearHints: (state) => {
      state.hints = [];
      state.hintsStatus = "idle";
    },
    // Rehberden çıkınca veya baştan başlayınca temizlik için
    clearGuideData: (state) => {
      state.guideStep1Options = [];
      state.guideStep2Options = [];
      state.guideStatus = "idle";
      state.guideError = null;
    },
  },
  extraReducers: (builder) => {
    // --- FIND RECIPES (MEVCUT) ---
    builder
      .addCase(findRecipes.pending, (state) => {
        state.searchStatus = "loading";
      })
      .addCase(findRecipes.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
        state.searchResults = action.payload;
      })
      .addCase(findRecipes.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.searchError = action.error.message;
      });

    // --- FETCH MENU HINTS (MEVCUT) ---
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

    // --- REHBER ADIM 1 (YENİ) ---
    builder
      .addCase(fetchGuideStep1.pending, (state) => {
        state.guideStatus = "loading";
        state.guideError = null;
      })
      .addCase(fetchGuideStep1.fulfilled, (state, action) => {
        state.guideStatus = "succeeded";
        state.guideStep1Options = action.payload;
      })
      .addCase(fetchGuideStep1.rejected, (state, action) => {
        state.guideStatus = "failed";
        state.guideError = action.payload || "Bir hata oluştu";
      });

    // --- REHBER ADIM 2 (YENİ) ---
    builder
      .addCase(fetchGuideStep2.pending, (state) => {
        state.guideStatus = "loading";
        state.guideError = null;
      })
      .addCase(fetchGuideStep2.fulfilled, (state, action) => {
        state.guideStatus = "succeeded";
        state.guideStep2Options = action.payload;
      })
      .addCase(fetchGuideStep2.rejected, (state, action) => {
        state.guideStatus = "failed";
        state.guideError = action.payload || "Bir hata oluştu";
      });

    // --- REHBER ADIM 3  ---
    builder
      .addCase(fetchGuideStep3.pending, (state) => {
        state.guideStatus = "loading";
        state.guideError = null;
      })
      .addCase(fetchGuideStep3.fulfilled, (state, action) => {
        state.guideStatus = "succeeded";
        state.guideStep3Options = action.payload;
      })
      .addCase(fetchGuideStep3.rejected, (state, action) => {
        state.guideStatus = "failed";
        state.guideError = action.payload;
      });

    builder
      .addCase(fetchWizardResults.pending, (state) => {
        state.searchStatus = "loading";
        state.searchError = null;
      })
      .addCase(fetchWizardResults.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
        // DİKKAT: Sonucu 'searchResults'a yazıyoruz ki Result ekranı çalışsın
        state.searchResults = action.payload;
      })
      .addCase(fetchWizardResults.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.searchError = action.payload;
      });
  },
});

export const { clearSearchResults, clearHints, clearGuideData } =
  barmenSlice.actions;

// --- SELECTORS ---
export const selectSearchResults = (state) => state.barmen.searchResults;
export const getSearchStatus = (state) => state.barmen.searchStatus;
export const getSearchError = (state) => state.barmen.searchError;

export const selectHints = (state) => state.barmen.hints;
export const getHintsStatus = (state) => state.barmen.hintsStatus;

// --- YENİ REHBER SELECTORLARI ---
export const selectGuideStep1 = (state) => state.barmen.guideStep1Options;
export const selectGuideStep2 = (state) => state.barmen.guideStep2Options;
export const selectGuideStep3 = (state) => state.barmen.guideStep3Options;
export const getGuideStatus = (state) => state.barmen.guideStatus;

export default barmenSlice.reducer;
