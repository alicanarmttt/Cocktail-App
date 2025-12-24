import { createSlice } from "@reduxjs/toolkit";
import i18n from "../i18n";

// State'i tek bir yerde topladık (Doğrusu budur)
const initialState = {
  language: i18n.language || "tr", // i18n'den gelen dili al, yoksa tr
  themeMode: "light",
};

export const uiSlice = createSlice({
  name: "ui",
  initialState, // Yukarıdaki tanımlı state'i kullanıyoruz
  reducers: {
    setLanguage: (state, action) => {
      // 'tr', 'en', 'de', 'es', 'it', 'pt' kodlarını alır
      state.language = action.payload;
    },
    setThemeMode: (state, action) => {
      // 'light' veya 'dark' string değerini alır
      state.themeMode = action.payload;
    },
  },
});

export const { setLanguage, setThemeMode } = uiSlice.actions;

export const selectLanguage = (state) => state.ui.language;
export const selectThemeMode = (state) => state.ui.themeMode;

export default uiSlice.reducer;
