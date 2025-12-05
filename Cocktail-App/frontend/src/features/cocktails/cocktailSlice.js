import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../api/apiClient";

/**
 * @desc Fetches all cocktails from the backend API
 * @name coctails/fetchCocktails
 */
export const fetchCocktails = createAsyncThunk(
  "cocktails/fetchCocktails",
  async () => {
    const response = await apiClient.get(`/cocktails`);
    return response.data;
  }
);

/**
 * @desc    Fetches a SINGLE detailed cocktail (detail view) by its ID
 * @name    cocktails/fetchCocktailById
 * @param   {number} cocktailId - The ID of the cocktail to fetch
 */
export const fetchCocktailById = createAsyncThunk(
  "cocktails/fetchCocktailById",
  async (cocktail_id) => {
    // '/api/cocktails/:id' rotası backend'de getCocktailById (JOIN'lu) modelini çağırır
    const response = await apiClient.get(`/cocktails/${cocktail_id}`);
    return response.data;
  }
);

const initialState = {
  // Ana sayfadaki (HomeScreen) tüm kokteyllerin listesi için
  list: {
    data: [],
    status: "idle", // 'idle', 'loading', 'succeeded', 'failed'
    error: null,
  },
  // Detay sayfasındaki (CocktailDetailScreen) seçili tek kokteyl için
  detail: {
    data: null, // Başlangıçta seçili kokteyl yok
    status: "idle",
    error: null,
  },
};

export const cocktailSlice = createSlice({
  name: "cocktails",
  initialState,

  // 'reducers', 'dispatch(doSomething())' gibi doğrudan (senkron) eylemler içindir.
  reducers: {
    //Resets the detail state to idle when leaving the detail screen.
    clearDetail: (state) => {
      state.detail.data = null;
      state.detail.status = "idle";
      state.detail.error = null;
    },
  },

  // 'extraReducers', 'createAsyncThunk' gibi dış (asenkron) eylemleri dinler
  extraReducers: (builder) => {
    builder
      // --- 'fetchCocktails' (Liste) Durumları ---
      .addCase(fetchCocktails.pending, (state) => {
        state.list.status = "loading";
        state.error = null;
      })
      .addCase(fetchCocktails.fulfilled, (state, action) => {
        state.list.status = "succeeded";
        state.list.data = action.payload;
      })
      .addCase(fetchCocktails.rejected, (state, action) => {
        state.list.status = "failed";
        state.list.error = action.error.message;
      })

      // --- 'fetchCocktailById' (Detay) Durumları ---
      .addCase(fetchCocktailById.pending, (state) => {
        state.detail.status = "loading";
        state.detail.error = null;
      })
      .addCase(fetchCocktailById.fulfilled, (state, action) => {
        state.detail.status = "succeeded";
        state.detail.data = action.payload;
      })
      .addCase(fetchCocktailById.rejected, (state, action) => {
        state.detail.status = "failed";
        state.detail.error = action.error.message;
      });
  },
});

// --- Eylemleri (Actions) Dışa Aktar ---
export const { clearDetail } = cocktailSlice.actions;

// === SELECTORS ===
// Selector'ler: Depodan (store) veri okumak için kısa yollar
// (Bunları React bileşenlerimizde (component) kullanacağız)
export const selectAllCocktails = (state) => state.cocktails.list.data;
export const getCocktailsListStatus = (state) => state.cocktails.list.status;
export const getCocktailsListError = (state) => state.cocktails.list.error;

// Detay (CocktailDetailScreen) için (Yeni selector'ler)
export const selectDetailedCocktail = (state) => state.cocktails.detail.data;
export const getDetailedCocktailStatus = (state) =>
  state.cocktails.detail.status;
export const getDetailedCocktailError = (state) => state.cocktails.detail.error;

// YENİ EKLENEN FONKSİYON (HomeScreen'in Gösterge Alanı için)
/**
 * @desc    Selects a single cocktail from the LIST state by its ID.
 * @param   {object} state - The entire Redux state object
 * @param   {number} cocktailId - The ID of the cocktail to find
 * @returns {object | undefined} - The cocktail object, or undefined if not found.
 */
export const selectCocktailById = (state, cocktailId) => {
  // DİKKAT: 'state.cocktails.list.data' (LİSTE) içinden arıyoruz,
  // 'detail.data' içinden değil.
  return state.cocktails.list.data.find(
    (cocktail) => cocktail.cocktail_id === cocktailId
  );
};

export default cocktailSlice.reducer;
