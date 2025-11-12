import { configureStore } from "@reduxjs/toolkit";

import cocktailReducer from "../features/cocktails/cocktailSlice.js";
import ingredientReducer from "../features/ingredientSlice.js";
/**
 * @desc    Configures and creates the main Redux store for the application.
 * Tüm 'reducer'ları (veri mantığı dilimlerini) burada birleştiririz.
 */

export const store = configureStore({
  reducer: {
    // Depomuzun (store) 'cocktails' adında bir bölümü olacağını
    // ve bu bölümü 'cocktailReducer'ın yöneteceğini belirtiyoruz.
    cocktails: cocktailReducer,
    // (Gelecekteki dilimler buraya eklenecek)
    // user: userReducer,
    ingredients: ingredientReducer,
  },
});
