import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import AppNavigator from "./src/navigation/AppNavigator";
import "./src/i18n";
import { Provider } from "react-redux";
import { store } from "./src/app/store";

// Yorum: Burası projemizin ana giriş noktasıdır.
export default function App() {
  return (
    <View style={styles.container}>
      <Provider store={store}>
        <AppNavigator />
      </Provider>
      {/* StatusBar'ı (saat, pil) en dışa almak ve sekmelerle 
          uyumlu hale getirmek iyi bir pratiktir */}
      <StatusBar style="light" backgroundColor="#f4511e" />
    </View>
  );
}

// "flex: 1" stilini tanımlıyoruz
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Arka plan rengi (opsiyonel)
  },
});
