import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/apiClient";

// 1. FAVORİLERİ GETİR
// Backend Beklentisi: GET /api/favorites/:userId
// DİKKAT: Artık bu fonksiyon çağrılırken dispatch(fetchFavorites(userId)) şeklinde ID verilmeli!
export const fetchFavorites = createAsyncThunk(
  "favorites/fetchFavorites",
  async (userId, { rejectWithValue }) => {
    try {
      if (!userId) throw new Error("Kullanıcı ID bulunamadı!");

      // URL'in sonuna userId ekliyoruz
      const response = await apiClient.get(`/favorites/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Favori çekme hatası:", error);
      return rejectWithValue(
        error.response?.data?.error || "Favoriler yüklenemedi"
      );
    }
  }
);

// 2. FAVORİYE EKLE
// Backend Beklentisi: POST /api/favorites -> Body: { userId, cocktailId }
// Kullanım: dispatch(addFavorite({ userId: 2, cocktailId: 154 }))
export const addFavorite = createAsyncThunk(
  "favorites/addFavorite",
  async ({ userId, cocktailId }, { rejectWithValue }) => {
    try {
      await apiClient.post("/favorites", { userId, cocktailId });
      return cocktailId;
    } catch (error) {
      console.error("Favori ekleme hatası:", error);
      return rejectWithValue(error.response?.data?.error || "Eklenemedi");
    }
  }
);

// 3. FAVORİDEN ÇIKAR
// Backend Beklentisi: DELETE /api/favorites/:userId/:cocktailId
// Kullanım: dispatch(removeFavorite({ userId: 2, cocktailId: 154 }))
export const removeFavorite = createAsyncThunk(
  "favorites/removeFavorite",
  async ({ userId, cocktailId }, { rejectWithValue }) => {
    try {
      // Backend route yapımız: /:userId/:cocktailId
      await apiClient.delete(`/favorites/${userId}/${cocktailId}`);
      return cocktailId;
    } catch (error) {
      console.error("Favori silme hatası:", error);
      return rejectWithValue(error.response?.data?.error || "Silinemedi");
    }
  }
);

const favoritesSlice = createSlice({
  name: "favorites",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {
    clearFavorites: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchFavorites.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // REMOVE (Anında arayüzden silmek için)
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => item.cocktail_id !== action.payload
        );
      });
  },
});

export const { clearFavorites } = favoritesSlice.actions;

export const selectAllFavorites = (state) => state.favorites.items;
export const getFavoritesStatus = (state) => state.favorites.status;
export const getFavoritesError = (state) => state.favorites.error;

export const selectIsFavorite = (state, cocktailId) => {
  return state.favorites.items.some((item) => item.cocktail_id === cocktailId);
};

export default favoritesSlice.reducer;
