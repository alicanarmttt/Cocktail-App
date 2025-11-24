import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_API_URL = process.env.EXPO_PUBLIC_API_URL;

/**
 * @desc    Backend'deki 'Akıllı Filtreleme' API'sine POST isteği gönderir.
 * @name    barmen/findRecipes
 * @param   {object} payload - { inventoryIds: [1, 7, ...], mode: 'strict' }
 */
export const findRecipes = createAsyncThunk(
  "barmen/findRecipes",
  async (payload, { getState }) => {
    const lang = getState().ui?.language || "tr";

    // ÖNEMLİ: ingredientSlice'taki 'GET'ten farklı olarak,
    // biz 'POST' kullanıyoruz ve 'payload' (gövde) gönderiyoruz.
    const response = await axios.post(
      `${BASE_API_URL}/api/barmen/find-recipes?lang=${lang}`,
      payload // { inventoryIds: [...], mode: '...' }
    );
    return response.data;
  }
);

const initialState = {
  searchResults: [],
  searchStatus: "idle",
  searchError: null,
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
  },
  extraReducers: (builder) => {
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
  },
});

// === Selector'ler (Bu 'slice'ın verilerini okumak için) ===

export const { clearSearchResults } = barmenSlice.actions;

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

export default barmenSlice.reducer;
