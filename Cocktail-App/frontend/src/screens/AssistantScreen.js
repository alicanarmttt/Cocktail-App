import React, { useMemo } from "react";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  fetchIngredients,
  selectAllIngredients,
  getIngredientsStatus,
  getIngredientsError,
} from "../features/ingredientSlice.js";

/**
 * @desc    Barmen'in Asistanı Ekranı. (Pazar/Tezgah Mantığı)
 * Kullanıcının malzemeleri arayıp "Tezgah"a eklemesini sağlar.
 */
const AssistantScreen = () => {
  const dispatch = useDispatch();

  const [searchText, setSearchText] = useState("");
  const [tezgahItems, setTezgahItems] = useState([]);

  const allIngredients = useSelector(selectAllIngredients);
  const ingredientsStatus = useSelector(getIngredientsStatus);
  const ingredientsError = useSelector(getIngredientsError);

  // Ekran ilk yüklendiğinde "Ana Pazar Listesi"ni (tüm malzemeleri) API'den çek
  useEffect(() => {
    if (ingredientsStatus === "idle") {
      dispatch(fetchIngredients());
    }
  }, [ingredientsStatus, dispatch]);

  // === 3. "PAZAR" (Market) FİLTRELEME MANTIĞI ===
  const pazarList = useMemo(() => {
    // 1. Önce "Tezgah"ta OLANLARI Pazar'dan çıkar
    const tezgahIds = tezgahItems.map((item) => item.ingredient_id);
    const avaliableIngredients = allIngredients.filter(
      (item) => !tezgahIds.includes(item.ingredient_id)
    );
    // 2. Kalanları 'searchText' (arama metni) ile filtrele
    if (!searchText) {
      return avaliableIngredients;
    }
    return avaliableIngredients.filter((item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, allIngredients, tezgahItems]); // Bu 3'ü değişince filtreyi yeniden hesapla

  // === 4. ETKİLEŞİM (Interaction) FONKSİYONLARI ===

  // Pazar'daki bir malzemeye tıklandığında (Tezgah'a Ekle)
  const handleAddToTezgah = (ingredient) => {
    // 'tezgahItems' (lokal state) listemize bu malzemeyi ekle
    setTezgahItems([...tezgahItems, ingredient]);
    // Arama çubuğunu sıfırla
    setSearchText("");
  };

  // Tezgah'taki bir malzemeye tıklandığında (Pazar'a Geri Gönder)
  const handleRemoveFromTezgah = (ingredient) => {
    setTezgahItems(
      tezgahItems.filter(
        (item) => item.ingredient_id !== ingredient.ingredient_id
      )
    );
  };

  // === 5. ARAYÜZ (UI) RENDER ETME ===
  if (ingredientsStatus === "loading") {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#f4511e" />
        <Text>Pazar kuruluyor...</Text>
      </SafeAreaView>
    );
  }
  // API hatası olursa göster
  if (ingredientsStatus === "failed") {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.errorText}>{ingredientsError}</Text>
      </SafeAreaView>
    );
  }
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100} // Gerekirse bu değeri ayarlayın
    >
      <SafeAreaView style={styles.container}>
        {/* --- BÖLÜM 1: TEZGAH (Seçilenler) --- */}
        <View style={styles.tezgahContainer}>
          <Text style={styles.sectionTitle}>
            Tezgah ({tezgahItems.length} Malzeme)
          </Text>
          <ScrollView
            horizontal // Yatay kaydırma
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
          >
            {tezgahItems.length === 0 ? (
              <Text style={styles.emptyText}> Pazar'dan malzeme seçin...</Text>
            ) : (
              tezgahItems.map((item) => (
                <Pressable
                  key={item.ingredient_id}
                  style={[styles.itemChip, styles.tezgahChip]}
                  onPress={() => handleRemoveFromTezgah(item)}
                >
                  <Text style={styles.chipText}>{item.name}</Text>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color="#fff"
                    style={{ marginLeft: 5 }}
                  />
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>

        {/* --- BÖLÜM 2: ARAMA ÇUBUĞU --- */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="gray"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Pazar'da ara (örn: Rom, Votka, Nane...)"
            value={searchText}
            onChangeText={setSearchText} // Harf girildikçe 'searchText' state'ini günceller
          />
        </View>

        {/* --- BÖLÜM 3: PAZAR (Tüm Malzemeler) --- */}
        {/* 'ScrollView', kategorili gösterim için 'FlatList'ten daha esnek olabilir,
            ancak 150+ malzeme için 'FlatList' daha performanslıdır.
            Şimdilik 'ScrollView' (Kategorisiz) kullanalım: */}
        <ScrollView style={styles.pazarContainer}>
          {pazarList.map((item) => (
            <Pressable
              key={item.ingredient_id}
              style={styles.pazarItem}
              onPress={() => handleAddToTezgah(item)}
            >
              <Text style={styles.pazarItemText}>{item.name}</Text>
              <Text style={styles.pazarCategoryText}>
                ({item.category_name})
              </Text>
              <Ionicons name="add-circle" size={24} color="#f4511e" />
            </Pressable>
          ))}
        </ScrollView>

        {/* --- BÖLÜM 4: TARİF BUL BUTONU --- */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.prepareButton,
              tezgahItems.length === 0 && styles.prepareButtonDisabled, // Tezgah boşsa butonu pasif yap
            ]}
            disabled={tezgahItems.length === 0}
            // (İleride buraya 'onPress' ile sonuçları getirme mantığı eklenecek)
          >
            <Text style={styles.prepareButtonText}>
              {tezgahItems.length} Malzeme ile Kokteylleri Göster
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );

  // Başarılı: Pazar/Tezgah Arayüzünü göster
};

// === Stil Dosyaları ===
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9", // Hafif gri arka plan
  },
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 15,
    marginBottom: 10,
  },
  // --- Tezgah Stilleri ---
  tezgahContainer: {
    height: 120, // Tezgah için ayrılmış sabit yükseklik
    paddingTop: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  emptyText: {
    fontSize: 14,
    color: "gray",
    marginLeft: 15,
    alignSelf: "center",
  },
  itemChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    marginHorizontal: 5,
    height: 40, // Sabit yükseklik
  },
  tezgahChip: {
    backgroundColor: "#007AFF", // Mavi (Seçili)
  },
  chipText: {
    color: "white",
    fontWeight: "600",
  },
  // --- Arama Stilleri ---
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  // --- Pazar Stilleri ---
  pazarContainer: {
    flex: 1, // Kalan tüm alanı kapla
  },
  pazarItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pazarItemText: {
    fontSize: 16,
    flex: 1, // İsmin sola yaslanmasını sağlar
  },
  pazarCategoryText: {
    fontSize: 14,
    color: "gray",
    marginHorizontal: 10,
  },
  // --- Footer (Alt Buton) Stilleri ---
  footer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 15,
  },
  prepareButton: {
    backgroundColor: "#f4511e",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  prepareButtonDisabled: {
    backgroundColor: "#ccc",
  },
  prepareButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    padding: 20,
    textAlign: "center",
  },
});

export default AssistantScreen;
