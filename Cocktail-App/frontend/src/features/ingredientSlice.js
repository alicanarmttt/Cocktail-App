import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_API_URL = process.env.EXPO_PUBLİC_API_URL;

/**
 * @desc    Fetches all ingredients (categorized) from the backend API.
 * @name    ingredients/fetchIngredients
 */
export const fetchIngredients = createAsyncThunk(
  "ingredients/fetchIngredients",
  async () => {
    const response = await axios.get(`${BASE_API_URL}/api/ingredients`);
    return response.data;
  }
);

const initialState = {
  data: [],
  status: "idle",
  error: null,
};

export const ingredientSlice = createSlice({
  name: "ingredients",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchIngredients.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchIngredients.fulfilled, (state, action) => {
        state.status = "succeeced";
        state.data = action.payload;
      })
      .addCase(fetchIngredients.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

// Selector'ler: Depodan (store) bu 'slice'ın verilerini okumak için
/**
 * @desc    Selects all ingredients from the state.
 * @param   {object} state - The entire Redux state object
 * @returns {Array} The array of ingredients
 */
export const selectAllIngredients = (state) => state.ingredients.data;

/**
 * @desc    Gets the current status ('idle', 'loading', 'succeeded', 'failed')
 * @param   {object} state - The entire Redux state object
 * @returns {string} The current status
 */
export const getIngredientsStatus = (state) => state.ingredients.status;

/**
 * @desc    Gets the current error message, if any.
 * @param   {object} state - The entire Redux state object
 * @returns {string | null} The error message or null
 */
export const getIngredientsError = (state) => state.ingredients.error;

export default ingredientSlice.reducer;
