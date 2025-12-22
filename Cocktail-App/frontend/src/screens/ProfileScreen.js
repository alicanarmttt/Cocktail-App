import React, { useState } from "react"; // <-- useState eklendi
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Linking,
  Image,
  Modal, // <-- Modal eklendi
  TouchableOpacity, // <-- Modal içi seçim için
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

// --- REDUX & FIREBASE ---
import {
  selectCurrentUser,
  selectIsPro,
  clearUser,
  // updateAvatar, // <-- İlerde Redux'a bu action'ı ekleyeceğiz
} from "../features/userSlice";
import { auth } from "../api/firebaseConfig";
import { signOut } from "firebase/auth";

import {
  setLanguage,
  selectLanguage,
  setThemeMode,
  selectThemeMode,
  updateUserAvatar,
} from "../features/uiSlice";
import { fetchIngredients } from "../features/ingredientSlice";
import { clearSearchResults } from "../features/barmenSlice";
import { clearDetail } from "../features/cocktails/cocktailSlice";
import apiClient from "../api/apiClient";

// --- COMPONENTS ---
import PremiumButton from "../ui/PremiumButton";

// --- AVATAR SEÇENEKLERİ (BUNLARI KENDİ RESİMLERİNLE DEĞİŞTİR) ---
const AVATAR_OPTIONS = [
  { id: 1, source: require("../../assets/avatars/mascot_1_optimized.png") },
  { id: 2, source: require("../../assets/avatars/mascot_2_optimized.png") },
  { id: 3, source: require("../../assets/avatars/mascot_3_optimized.png") },
  { id: 4, source: require("../../assets/avatars/mascot_4_optimized.png") },
  { id: 5, source: require("../../assets/avatars/mascot_5_optimized.png") },
  { id: 6, source: require("../../assets/avatars/mascot_6_optimized.png") },
  // { id: 3, source: require("../../assets/avatars/cool_barman.png") },
];
// Varsayılan avatar ID'si (Kullanıcı henüz seçim yapmadıysa)
const DEFAULT_AVATAR_ID = 1;

const ProfileScreen = () => {
  const { colors, fonts } = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  // --- LOCAL STATE ---
  const [modalVisible, setModalVisible] = useState(false); // Avatar modalı için

  // --- SELECTORS ---
  const currentUser = useSelector(selectCurrentUser);
  const isPro = useSelector(selectIsPro);
  const currentLang = useSelector(selectLanguage);
  const currentTheme = useSelector(selectThemeMode);

  // Kullanıcının şu anki avatarını belirle (Backend bağlanana kadar DEFAULT kullanır)
  const currentAvatarId = currentUser?.avatar_id || DEFAULT_AVATAR_ID;
  const currentAvatarSource =
    AVATAR_OPTIONS.find((a) => a.id === currentAvatarId)?.source ||
    AVATAR_OPTIONS[0].source;

  // --- ACTIONS ---

  // Avatar Seçilince Tetiklenecek Fonksiyon
  const handleAvatarSelect = async (avatarId) => {
    // Eğer zaten seçili olan resimse işlem yapma
    if (avatarId === currentAvatarId) {
      setModalVisible(false);
      return;
    }
    try {
      // 1. Thunk'ı Dispatch Et ve Sonucu Bekle (unwrap)
      await dispatch(updateUserAvatar(avatarId)).unwrap();

      // 2. Başarılıysa buraya düşer
      Alert.alert(
        t("general.success") || "Başarılı",
        "Profil resmi güncellendi!"
      );
      setModalVisible(false); // Modalı kapat
    } catch (errorMsg) {
      // 3. Hata olursa buraya düşer (rejectWithValue'den gelen mesaj)
      console.error("Avatar update error:", errorMsg);
      Alert.alert(
        t("general.error") || "Hata",
        errorMsg || "Avatar güncellenemedi."
      );
    }
  };

  const handleLanguageToggle = async () => {
    const newLang = currentLang === "tr" ? "en" : "tr";
    dispatch(setLanguage(newLang));
    await i18n.changeLanguage(newLang);
    dispatch(clearSearchResults());
    dispatch(clearDetail());
    dispatch(fetchIngredients());
  };

  const handleThemeToggle = (val) => {
    const newMode = val ? "dark" : "light";
    dispatch(setThemeMode(newMode));
  };

  const handleLogout = async () => {
    Alert.alert(t("auth.logout_confirm_title"), t("auth.logout_confirm_msg"), [
      { text: t("general.cancel"), style: "cancel" },
      {
        text: t("auth.logout"),
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            dispatch(clearUser());
            dispatch(clearSearchResults());
            dispatch(clearDetail());
          } catch (error) {
            console.error("Logout Error:", error);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("general.delete_account"),
      t("general.delete_account_confirm"),
      [
        { text: t("general.cancel"), style: "cancel" },
        {
          text: t("general.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete("/users/me");
              await signOut(auth);
              dispatch(clearUser());
              dispatch(clearDetail());
              dispatch(clearSearchResults());
            } catch (error) {
              console.error("Hesap silme hatası:", error);
              Alert.alert(t("general.error"), "Hesap silinemedi.");
            }
          },
        },
      ]
    );
  };

  // --- UI COMPONENTS ---

  const SettingRow = ({ icon, title, rightElement, onPress, isLast }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: isLast ? 0 : 0.5,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      disabled={!onPress}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
          <Ionicons name={icon} size={20} color={colors.text} />
        </View>
        <Text
          style={[
            styles.rowTitle,
            { color: colors.text, fontFamily: fonts.families.sans },
          ]}
        >
          {title}
        </Text>
      </View>
      <View>{rightElement}</View>
    </Pressable>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- 1. HEADER (Avatar Tıklanabilir Oldu) --- */}
        <View style={styles.header}>
          {/* Pressable ile sarmaladık */}
          <Pressable
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <View
              style={[
                styles.avatarContainer,
                { borderColor: isPro ? colors.gold : colors.border },
              ]}
            >
              {/* Seçili Avatarı Göster */}
              <Image
                source={currentAvatarSource}
                style={styles.avatarImage}
                resizeMode="cover"
              />
              {/* Düzenleme İkonu (Küçük Kalem) */}
              <View
                style={[
                  styles.editIconBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="pencil" size={12} color="#fff" />
              </View>
            </View>
          </Pressable>

          <Text
            style={[
              styles.emailText,
              { color: colors.text, fontFamily: fonts.families.serif },
            ]}
          >
            {currentUser?.email}
          </Text>

          <View
            style={[
              styles.badge,
              {
                backgroundColor: isPro ? colors.gold : colors.card,
                borderColor: isPro ? colors.gold : colors.border,
              },
            ]}
          >
            <Ionicons
              name={isPro ? "star" : "cube-outline"}
              size={14}
              color={isPro ? "#000" : colors.textSecondary}
            />
            <Text
              style={[
                styles.badgeText,
                { color: isPro ? "#000" : colors.textSecondary },
              ]}
            >
              {isPro ? "PRO MEMBER" : "FREE MEMBER"}
            </Text>
          </View>
        </View>

        {/* --- 2. UPSELL BANNER --- */}
        {!isPro && (
          <Pressable
            style={styles.upsellContainer}
            onPress={() => navigation.navigate("UpgradeToPro")}
          >
            <LinearGradient
              colors={["#FFD700", "#B8860B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upsellGradient}
            >
              <View>
                <Text style={styles.upsellTitle}>
                  {t("navigation.upgrade_pro")}
                </Text>
                <Text style={styles.upsellSubtitle}>
                  {t("profile.unlock_all")}
                </Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={32} color="#2A050A" />
            </LinearGradient>
          </Pressable>
        )}

        {/* --- 3. ACCOUNT ACTIONS --- */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("profile.account_actions")}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.subCard || "#1A1A1A" },
          ]}
        >
          <SettingRow
            icon="heart"
            title={t("profile.my_favorites")}
            onPress={() => navigation.navigate("Favorites")}
            rightElement={
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            }
          />
        </View>

        {/* --- 4. APP SETTINGS GROUP --- */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("profile.app_settings")}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.subCard || "#1A1A1A" },
          ]}
        >
          <SettingRow
            icon="language-outline"
            title={t("profile.language")}
            rightElement={
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: colors.textSecondary, marginRight: 5 }}>
                  {currentLang === "tr" ? "Türkçe" : "English"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textSecondary}
                />
              </View>
            }
            onPress={handleLanguageToggle}
          />

          <SettingRow
            icon={currentTheme === "dark" ? "moon" : "sunny"}
            title={t("profile.appearance")}
            isLast={true}
            rightElement={
              <Switch
                value={currentTheme === "dark"}
                onValueChange={handleThemeToggle}
                trackColor={{ false: "#767577", true: colors.primary }}
                thumbColor={colors.text}
              />
            }
          />
        </View>

        {/* --- 5. INFO GROUP --- */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("profile.info")}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.subCard || "#1A1A1A" },
          ]}
        >
          <SettingRow
            icon="shield-checkmark-outline"
            title={t("profile.privacy_policy")}
            onPress={() => Linking.openURL("https://github.com/privacy...")}
            rightElement={
              <Ionicons
                name="open-outline"
                size={16}
                color={colors.textSecondary}
              />
            }
          />
          <SettingRow
            icon="information-circle-outline"
            title={t("profile.version")}
            isLast={true}
            rightElement={
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                v1.0.0
              </Text>
            }
          />
        </View>

        {/* --- 6. LOGOUT --- */}
        <View style={styles.actionContainer}>
          <PremiumButton
            title={t("auth.logout")}
            onPress={handleLogout}
            variant="gold"
            style={{ width: "100%" }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#000"
                style={{ marginRight: 8 }}
              />
              <Text style={{ fontWeight: "bold", color: "#000" }}>
                {t("auth.logout")}
              </Text>
            </View>
          </PremiumButton>
        </View>

        {/* --- 7. DANGER ZONE --- */}
        <View style={styles.dangerZone}>
          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => [
              { opacity: pressed ? 0.5 : 1, padding: 10 },
            ]}
          >
            <Text
              style={{
                color: colors.notification,
                fontSize: 13,
                textDecorationLine: "underline",
                textAlign: "center",
              }}
            >
              {t("general.delete_my_account")}
            </Text>
          </Pressable>
          <Text
            style={{ color: colors.textSecondary, fontSize: 10, marginTop: 5 }}
          >
            ID: {currentUser?.firebase_uid?.substring(0, 8)}...
          </Text>
        </View>
      </ScrollView>

      {/* --- AVATAR SEÇİM MODALI --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {currentLang === "tr" ? "Avatar Seç" : "Choose Avatar"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  onPress={() => handleAvatarSelect(avatar.id)}
                  style={[
                    styles.avatarOption,
                    {
                      borderColor:
                        currentAvatarId === avatar.id
                          ? colors.primary
                          : "transparent",
                    },
                  ]}
                >
                  <Image
                    source={avatar.source}
                    style={styles.avatarOptionImage}
                  />
                  {currentAvatarId === avatar.id && (
                    <View
                      style={[
                        styles.selectedCheck,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  header: {
    alignItems: "center",
    marginVertical: 30,
  },
  avatarContainer: {
    width: 90, // Biraz büyüttüm
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    overflow: "visible", // Badge taşsın diye visible yaptım
    backgroundColor: "rgba(255,255,255,0.05)",
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 45,
  },
  editIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff", // veya arka plan rengi
  },
  emailText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 5,
  },
  upsellContainer: {
    marginBottom: 25,
    borderRadius: 15,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  upsellGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 15,
  },
  upsellTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2A050A",
  },
  upsellSubtitle: {
    fontSize: 12,
    color: "#4A0E15",
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 10,
    paddingLeft: 5,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  actionContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  dangerZone: {
    alignItems: "center",
    marginBottom: 20,
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    minHeight: 250,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  avatarGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  avatarOption: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    padding: 2,
    position: "relative",
    marginBottom: 15,
  },
  avatarOptionImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  selectedCheck: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
});

export default ProfileScreen;
