import axios from "axios";
import { auth } from "./firebaseConfig"; // Dosya yolunun ve adının doğru olduğundan emin ol

// NOT: Fiziksel cihazda test ediyorsan .env dosyana bilgisayarının
// yerel IP adresini (örn: 192.168.1.X) yazmalısın.
// export const API_URL =
//   process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5000/api";

export const API_URL = "https://cocktail-app-backend-0bba.onrender.com/api";
console.log("🚀 GÜNCEL API URL:", API_URL);
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;

    if (user) {
      try {
        // DÜZELTME: 'true' parametresi kaldırıldı.
        // Artık sadece token süresi dolmuşsa yeniler, aksi halde cache'ten okur.
        const token = await user.getIdToken();

        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error("Token alma hatası:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
