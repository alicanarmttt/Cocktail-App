import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../api/apiClient";

/**
 * @desc    Backend'den Rulet havuzunu çeker.
 * @name    roulette/fetchPool
 * @param   {object} payload - { mode: 'driver', filter: null }
 */
export const fetchRoulettePool = createAsyncThunk(
  "roulette/fetchPool",
  async ({ mode, filter }, { rejectWithValue }) => {
    try {
      // POST isteği atıyoruz çünkü 'body' içinde veri gönderiyoruz
      const response = await apiClient.post(`/roulette/get-pool`, {
        mode, // 'driver', 'popular', 'spirit', 'taste', 'random'
        filter, // Varsa ID (55) veya String ('Sweet')
      });

      return response.data; // Karıştırılmış (Shuffled) kokteyl listesi döner
    } catch (error) {
      // Backend'den gelen özel hata mesajını yakala (örn: "Bulunamadı")
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.msg);
      } else {
        return rejectWithValue(error.message);
      }
    }
  }
);

const initialState = {
  pool: [], // Çarkta dönecek kokteyller
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  winner: null, // Çark durunca seçilen kokteyl (Opsiyonel state)
};

export const rouletteSlice = createSlice({
  name: "roulette",
  initialState,
  reducers: {
    // Ekrandan çıkınca veya yeni oyun başlatınca havuzu temizle
    clearRoulette: (state) => {
      state.pool = [];
      state.status = "idle";
      state.error = null;
      state.winner = null;
    },
    // Manuel olarak bir kazanan belirlemek istersen (UI animasyonu bittiğinde)
    setWinner: (state, action) => {
      state.winner = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoulettePool.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchRoulettePool.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.pool = action.payload;
        // Backend zaten listeyi karıştırıp gönderiyor (Shuffle).
        // İstersen burada ilk elemanı 'winner' olarak şimdiden belirleyebilirsin
        // veya bunu UI animasyonuna bırakabilirsin.
      })
      .addCase(fetchRoulettePool.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Bir hata oluştu.";
      });
  },
});

// === Selector'ler ===
export const { clearRoulette, setWinner } = rouletteSlice.actions;

export const selectRoulettePool = (state) => state.roulette.pool;
export const getRouletteStatus = (state) => state.roulette.status;
export const getRouletteError = (state) => state.roulette.error;

export default rouletteSlice.reducer;
