import { createSlice } from "@reduxjs/toolkit";
// import i18n from "../i18n";  <-- Bunu kaldırıyoruz, gerek yok.
import { getLocales } from "expo-localization"; // <-- Donanıma soran kütüphane

// Telefonun dilini direkt çekiyoruz (Örn: 'en', 'tr')
// Eğer bulamazsa 'en' olsun diyoruz.
const deviceLanguage = getLocales()[0]?.languageCode || "en";

const initialState = {
  language: deviceLanguage, // Artık 'tr'ye veya i18n'e bağımlı değil
  themeMode: "light",
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    setThemeMode: (state, action) => {
      state.themeMode = action.payload;
    },
  },
});

export const { setLanguage, setThemeMode } = uiSlice.actions;

export const selectLanguage = (state) => state.ui.language;
export const selectThemeMode = (state) => state.ui.themeMode;

export default uiSlice.reducer;
