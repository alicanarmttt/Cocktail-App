import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  language: "tr", // Varsayılan dil Türkçe
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
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
