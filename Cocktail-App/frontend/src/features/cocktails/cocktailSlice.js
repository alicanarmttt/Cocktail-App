import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_API_URL = process.env.EXPO_PUBLIC_API_URL;

/**
 * @desc Fetches all cocktails from the backend API
 * @name coctails/fetchCocktails
 */
export const fetchCocktails = createAsyncThunk(
  "cocktails/fetchCocktails",
  async () => {
    const response = await axios.get(`${BASE_API_URL}/api/cocktails`);
    return response.data;
  }
);

const initialState = {
  data: [],
  status: "idle", // 'idle' (boşta), 'loading', 'succeeded' (başarılı), 'failed' (hatalı)
  error: null,
};

export const cocktailSlice = createSlice({
  name: "cocktails",
  initialState,
  // 'reducers', 'dispatch(doSomething())' gibi doğrudan (senkron) eylemler içindir.
  reducers: {},
  // 'extraReducers', 'createAsyncThunk' gibi dış (asenkron) eylemleri dinler
  extraReducers: (builder) => {
    builder
      .addCase(fetchCocktails.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCocktails.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchCocktails.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

// Selector'ler: Depodan (store) veri okumak için kısa yollar
// (Bunları React bileşenlerimizde (component) kullanacağız)
export const selectAllCocktails = (state) => state.cocktails.data;
export const getCocktailsStatus = (state) => state.cocktails.status;
export const getCocktailsError = (state) => state.cocktails.error;

export default cocktailSlice.reducer;
