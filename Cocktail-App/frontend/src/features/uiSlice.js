import { createSlice } from "@reduxjs/toolkit";
import i18n from "../i18n";
const initialState = {
  language: "tr", // Varsayılan dil Türkçe
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
  },
});

export const { setLanguage } = uiSlice.actions;
export const selectLanguage = (state) => state.ui.language;

export default uiSlice.reducer;
