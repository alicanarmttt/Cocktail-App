import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/apiClient";

// 1. FAVORİLERİ GETİR (Listeleme)
export const fetchFavorites = createAsyncThunk(
  "favorites/fetchFavorites",
  async (_, { rejectWithValue }) => {
    try {
      // apiClient zaten base URL'i (/api) ve Token'ı içeriyor.
      // Sadece endpoint'i yazıyoruz.
      const response = await apiClient.get("/favorites");
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
export const addFavorite = createAsyncThunk(
  "favorites/addFavorite",
  async (cocktailId, { rejectWithValue }) => {
    try {
      // Body olarak { cocktailId } gönderiyoruz
      await apiClient.post("/favorites", { cocktailId });
      return cocktailId;
    } catch (error) {
      console.error("Favori ekleme hatası:", error);
      return rejectWithValue(error.response?.data?.error || "Eklenemedi");
    }
  }
);

// 3. FAVORİDEN ÇIKAR
export const removeFavorite = createAsyncThunk(
  "favorites/removeFavorite",
  async (cocktailId, { rejectWithValue }) => {
    try {
      // ID'yi URL'e ekliyoruz
      await apiClient.delete(`/favorites/${cocktailId}`);
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
    items: [], // Favori listesi (Resim, isim vs. dolu objeler)
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    // Kullanıcı çıkış yaparsa (Logout) bu fonksiyonu çağırıp temizleyeceğiz
    clearFavorites: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- FETCH FAVORITES ---
      .addCase(fetchFavorites.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload; // Backend'den gelen dolu listeyi kaydet
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // --- REMOVE FAVORITE ---
      .addCase(removeFavorite.fulfilled, (state, action) => {
        // Silinen kokteyli listeden anında uçur (Tekrar fetch yapmaya gerek kalmaz)
        state.items = state.items.filter(
          (item) => item.cocktail_id !== action.payload
        );
      });

    // Not: addFavorite için burada bir işlem yapmıyoruz.
    // Çünkü favori ekleme genelde Detay sayfasında yapılır.
    // Favoriler sayfasına gelince zaten "fetchFavorites" çalışacağı için liste güncellenir.
  },
});

export const { clearFavorites } = favoritesSlice.actions;

// SELECTORS
export const selectAllFavorites = (state) => state.favorites.items;
export const getFavoritesStatus = (state) => state.favorites.status;
export const getFavoritesError = (state) => state.favorites.error;

// Bir kokteyl favori mi? (Kalp ikonunu boyamak için)
export const selectIsFavorite = (state, cocktailId) => {
  return state.favorites.items.some((item) => item.cocktail_id === cocktailId);
};

export default favoritesSlice.reducer;
