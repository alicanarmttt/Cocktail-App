// cocktailSlice.test.js dosyasının tepesine ekle:
jest.mock("../../api/apiClient", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

import cocktailReducer, {
  fetchCocktails,
  fetchCocktailById,
  clearDetail,
  selectCocktailById,
} from "./cocktailSlice";

describe("Cocktail Slice (Redux Logic) Testleri", () => {
  // Testlerde kullanacağımız başlangıç durumu
  const initialState = {
    list: {
      data: [],
      status: "idle",
      error: null,
    },
    detail: {
      data: null,
      status: "idle",
      error: null,
    },
  };

  // --- 1. BAŞLANGIÇ DURUMU ---
  it("başlangıçta state doğru yapıda ve boş olmalı", () => {
    // Reducer'a undefined state verirsek initial state'i döndürmeli
    const state = cocktailReducer(undefined, { type: "unknown" });
    expect(state).toEqual(initialState);
  });

  // --- 2. LİSTELEME TESTLERİ (fetchCocktails) ---

  it('fetchCocktails.pending -> list status "loading" olmalı', () => {
    // Aksiyonu manuel olarak oluşturuyoruz
    const action = { type: fetchCocktails.pending.type };
    const state = cocktailReducer(initialState, action);

    expect(state.list.status).toBe("loading");
    expect(state.list.error).toBeNull();
  });

  it('fetchCocktails.fulfilled -> list status "succeeded" ve veri dolmalı', () => {
    // Sanki API'den şu veri dönmüş gibi yapıyoruz:
    const mockData = [
      { cocktail_id: 1, name: { en: "Mojito" } },
      { cocktail_id: 2, name: { en: "Martini" } },
    ];

    const action = {
      type: fetchCocktails.fulfilled.type,
      payload: mockData,
    };

    const previousState = {
      ...initialState,
      list: { ...initialState.list, status: "loading" },
    };

    const state = cocktailReducer(previousState, action);

    expect(state.list.status).toBe("succeeded");
    expect(state.list.data).toHaveLength(2);
    expect(state.list.data[0].name.en).toBe("Mojito");
  });

  it('fetchCocktails.rejected -> list status "failed" ve hata mesajı olmalı', () => {
    const action = {
      type: fetchCocktails.rejected.type,
      error: { message: "Sunucu hatası" },
    };

    const state = cocktailReducer(initialState, action);

    expect(state.list.status).toBe("failed");
    expect(state.list.error).toBe("Sunucu hatası");
  });

  // --- 3. DETAY VE TEMİZLEME TESTLERİ ---

  it("clearDetail -> detay verisini sıfırlamalı", () => {
    // Diyelim ki detay sayfasında bir veri var
    const dirtyState = {
      ...initialState,
      detail: {
        data: { id: 99, name: "Kirli Veri" },
        status: "succeeded",
        error: null,
      },
    };

    // Temizleme aksiyonunu çağırıyoruz
    const state = cocktailReducer(dirtyState, clearDetail());

    // Fabrika ayarlarına dönmüş mü?
    expect(state.detail.data).toBeNull();
    expect(state.detail.status).toBe("idle");
  });

  // --- 4. SELECTOR TESTİ (Kritik!) ---
  // HomeScreen'de kullandığın o özel bulucu fonksiyonu test ediyoruz.
  it("selectCocktailById -> ID ile doğru kokteyli bulmalı", () => {
    // Test için sahte bir dolu state oluşturuyoruz
    const filledState = {
      cocktails: {
        list: {
          data: [
            { cocktail_id: 101, name: "Negroni" },
            { cocktail_id: 202, name: "Bellini" },
          ],
        },
      },
    };

    // 202 ID'li kokteyli iste
    const result = selectCocktailById(filledState, 202);

    expect(result).toBeDefined();
    expect(result.name).toBe("Bellini");
  });

  it("selectCocktailById -> Olmayan ID için undefined dönmeli", () => {
    const filledState = {
      cocktails: {
        list: { data: [{ cocktail_id: 101, name: "Negroni" }] },
      },
    };

    const result = selectCocktailById(filledState, 999);
    expect(result).toBeUndefined();
  });
});
