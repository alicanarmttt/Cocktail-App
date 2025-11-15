import { createSlice, current } from "@reduxjs/toolkit";

// === MOCK (SAHTE) VERİ ===
const mockProUser = {
  // (seed.js dosyamızdaki pro@user.com kullanıcısını simüle ediyoruz)
  firebase_uid: "456",
  email: "pro@user.com",
  is_pro: true, // <-- DAVRANIŞI TEST ETMEK İÇİN BUNU DEĞİŞTİR
};

const mockFreeUser = {
  // (seed.js dosyamızdaki free@user.com kullanıcısını simüle ediyoruz)
  firebase_uid: "123",
  email: "free@user.com",
  is_pro: false, // <-- DAVRANIŞI TEST ETMEK İÇİN BUNU DEĞİŞTİR
};
// ==========================

const initialState = {
  currentUser: mockProUser,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currentUser = action.payload;
    },
    clearUser: (state) => {
      state.currentUser = null;
    },
  },
});

// === Selector'ler (Bu 'slice'ın verilerini okumak için) ===

export const { setUser, clearUser } = userSlice.actions;

/**
 * @desc  Mevcut giriş yapmış kullanıcıyı seçer
 */
export const selectCurrentUser = (state) => state.user.currentUser;

/**
 * @desc  Mevcut kullanıcının 'Pro' olup olmadığını (true/false) seçer
 */
export const selectIsPro = (state) => state.user.currentUser?.is_pro || false;

export default userSlice.reducer;
