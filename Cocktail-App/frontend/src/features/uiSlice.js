import { createSlice } from "@reduxjs/toolkit";
import i18n from "../i18n";
const initialState = {
  language: "tr", // Varsayılan dil Türkçe
  themeMode: "light",
};

export const uiSlice = createSlice({
  name: "ui",
  initialState: {
    language: i18n.language || "tr", // Başlangıç değeri
  },
  reducers: {
    setLanguage: (state, action) => {
      // 'tr' veya 'en' olarak dili değiştir
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
