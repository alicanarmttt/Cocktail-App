import userReducer, { loginOrRegisterUser, clearUser } from "./userSlice";

// --- BU KISMI EKLE (ZİNCİRİ KIRAN MOCK) ---
// apiClient'ı mocklayarak Firebase config dosyasına erişimi kesiyoruz.
// Böylece "SyntaxError: Unexpected token export" hatası gelmiyor.
jest.mock("../api/apiClient", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

describe("User Slice (Redux Logic) Testleri", () => {
  const initialState = {
    currentUser: null,
    loginStatus: "idle",
    loginError: null,
    upgradeStatus: "idle",
    upgradeError: null,
    isAuthLoading: true,
  };

  // 1. Başlangıç Durumu
  it("başlangıçta state boş ve loading true olmalı", () => {
    const state = userReducer(undefined, { type: "unknown" });
    expect(state.currentUser).toBeNull();
    expect(state.isAuthLoading).toBe(true);
  });

  // 2. Login İşlemi (Pending - Bekleniyor)
  it('loginOrRegisterUser.pending -> loginStatus "loading" olmalı', () => {
    const action = { type: loginOrRegisterUser.pending.type };
    const state = userReducer(initialState, action);

    expect(state.loginStatus).toBe("loading");
    expect(state.isAuthLoading).toBe(true);
  });

  // 3. Login İşlemi (Fulfilled - Başarılı)
  it("loginOrRegisterUser.fulfilled -> kullanıcı verisi state'e yazılmalı", () => {
    const mockUser = { id: 123, email: "sef@test.com", is_pro: false };
    const action = {
      type: loginOrRegisterUser.fulfilled.type,
      payload: mockUser,
    };

    const state = userReducer(initialState, action);

    expect(state.loginStatus).toBe("succeeded");
    expect(state.currentUser).toEqual(mockUser);
    expect(state.isAuthLoading).toBe(false); // Yükleme bitmeli
  });

  // 4. Login İşlemi (Rejected - Hatalı)
  it("loginOrRegisterUser.rejected -> hata mesajı kaydedilmeli", () => {
    const action = {
      type: loginOrRegisterUser.rejected.type,
      error: { message: "Şifre yanlış" },
    };

    const state = userReducer(initialState, action);

    expect(state.loginStatus).toBe("failed");
    expect(state.loginError).toBe("Şifre yanlış");
    expect(state.currentUser).toBeNull();
    expect(state.isAuthLoading).toBe(false);
  });

  // 5. Logout (Çıkış) Testi
  it("clearUser -> kullanıcı verisini sıfırlamalı", () => {
    const loggedInState = {
      ...initialState,
      currentUser: { id: 1, name: "Şef" },
      loginStatus: "succeeded",
    };

    const state = userReducer(loggedInState, clearUser());

    expect(state.currentUser).toBeNull();
    expect(state.loginStatus).toBe("idle");
  });
});
