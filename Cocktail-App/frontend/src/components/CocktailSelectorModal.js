import React, { useState, useMemo, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { selectAllCocktails } from "../features/cocktails/cocktailSlice";
import PremiumButton from "../ui/PremiumButton";
import CocktailImage from "../components/CocktailImage.js";
/**
 * @desc    Hem tekli (Home) hem çoklu (Rulet) seçim yapabilen akıllı modal.
 * Tasarım, HomeScreen'deki orijinal modal yapısından alındı.
 * * @param {boolean} visible - Modalın görünürlüğü
 * @param {function} onClose - Modal kapatma fonksiyonu
 * @param {function} onSelect - Seçim yapıldığında çalışacak fonksiyon
 * (Tekli: ID döner, Çoklu: ID array döner)
 * @param {boolean} multiSelect - Çoklu seçim modu (Varsayılan: false)
 */
const CocktailSelectorModal = ({
  visible,
  onClose,
  onSelect,
  multiSelect = false,
}) => {
  const { colors, fonts } = useTheme();
  const { t, i18n } = useTranslation();

  // Veriyi Redux'tan çekiyoruz
  const allCocktails = useSelector(selectAllCocktails);

  // Local State
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState([]); // Çoklu seçim için ID listesi

  // Modal her açıldığında temizlik yap
  useEffect(() => {
    if (visible) {
      setSearchText("");
      setSelectedIds([]); // Her açılışta seçimleri sıfırla (İsteğe göre değişebilir)
    }
  }, [visible]);

  // Helper: İsim Çevirisi
  const getName = (item) => {
    if (!item || !item.name) return "";
    return item.name[i18n.language] || item.name["en"] || "";
  };

  // Filtreleme Mantığı
  const filteredCocktails = useMemo(() => {
    if (!allCocktails) return [];
    return allCocktails.filter((cocktail) => {
      const name = getName(cocktail);
      return name.toLowerCase().includes(searchText.toLowerCase());
    });
  }, [allCocktails, searchText, i18n.language]);

  // Seçim İşleyici (Kalbi Burası)
  const handleItemPress = (cocktailId) => {
    if (multiSelect) {
      // --- ÇOKLU SEÇİM MODU (Rulet İçin) ---
      setSelectedIds((prev) => {
        if (prev.includes(cocktailId)) {
          return prev.filter((id) => id !== cocktailId); // Varsa çıkar
        } else {
          return [...prev, cocktailId]; // Yoksa ekle
        }
      });
    } else {
      // --- TEKLİ SEÇİM MODU (Home İçin) ---
      onSelect(cocktailId); // Direkt ID'yi gönder
      // Modalı HomeScreen kapatacak, burada çağırmıyoruz
    }
  };

  // Çoklu seçimde "Oluştur" butonu
  const handleConfirmMultiple = () => {
    onSelect(selectedIds); // ID dizisini gönder
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
      >
        {/* --- HEADER --- */}
        <View
          style={[styles.modalHeader, { borderBottomColor: colors.border }]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {/* Çoklu moddaysa başlık değişebilir, yoksa varsayılan başlık */}
            {multiSelect
              ? t("roulette.create_custom_title")
              : t("home.search_modal_title")}
          </Text>
          <Pressable onPress={onClose}>
            <Ionicons
              name="close-circle"
              size={30}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>

        {/* --- SEARCH BAR --- */}
        <View
          style={[
            styles.modalInputContainer,
            { backgroundColor: colors.subCard },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={colors.textSecondary}
            style={{ marginRight: 10 }}
          />
          <TextInput
            style={[styles.modalInput, { color: colors.text }]}
            placeholder={t("home.search_modal_placeholder")}
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
            autoFocus={false} // Otomatik odaklama bazen klavye zıplaması yapar, kapattım
          />
        </View>

        {/* --- LİSTE --- */}
        <FlatList
          data={filteredCocktails}
          keyExtractor={(item) => item.cocktail_id.toString()}
          contentContainerStyle={{ paddingBottom: 100 }} // Footer için boşluk
          renderItem={({ item }) => {
            const isSelected = selectedIds.includes(item.cocktail_id);
            return (
              <TouchableOpacity
                style={[
                  styles.searchItem,
                  { borderBottomColor: colors.border },
                  // Çoklu seçimde seçili olanı hafif renklendir
                  multiSelect &&
                    isSelected && { backgroundColor: colors.primary + "10" },
                ]}
                onPress={() => handleItemPress(item.cocktail_id)}
              >
                <CocktailImage
                  uri={item.image_url}
                  style={[
                    styles.searchItemImage,
                    { backgroundColor: colors.subCard },
                  ]}
                ></CocktailImage>

                <Text
                  style={[
                    styles.searchItemText,
                    { color: colors.text },
                    multiSelect &&
                      isSelected && {
                        color: colors.primary,
                        fontWeight: "bold",
                      },
                  ]}
                >
                  {getName(item)}
                </Text>

                {/* İkon Yönetimi: Çoklu modda tik işareti, tekli modda ok */}
                {multiSelect ? (
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.border}
                  />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text
              style={[styles.noResultText, { color: colors.textSecondary }]}
            >
              {t("assistant.not_found")}
            </Text>
          }
        />

        {/* --- FOOTER (SADECE ÇOKLU SEÇİM MODUNDA) --- */}
        {multiSelect && (
          <View
            style={[
              styles.footerContainer,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
              },
            ]}
          >
            <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>
              {selectedIds.length} {t("general.selected")}
            </Text>
            <PremiumButton
              variant="gold"
              title={t("roulette.create_wheel_btn")}
              onPress={handleConfirmMultiple}
              disabled={selectedIds.length < 2} // Mantıken en az 2 seçenek olmalı
              style={{ width: "100%" }}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

// HomeScreen'den alınan stiller
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 0 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 50,
  },
  modalInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  searchItemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  searchItemText: {
    fontSize: 16,
    flex: 1,
  },
  noResultText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
  },
  // Yeni Footer Stili
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    borderTopWidth: 1,
    alignItems: "center",
    elevation: 20, // Android gölge
    shadowColor: "#000", // iOS gölge
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default CocktailSelectorModal;
