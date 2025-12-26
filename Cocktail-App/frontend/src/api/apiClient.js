import axios from "axios";
import { auth } from "./firebaseConfig";

// Render Backend URL
export const API_URL = "https://cocktail-app-backend-0bba.onrender.com/api";

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
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        // Production'da console.error kalabilir, debug için iyidir.
        console.error("Auth Token Error:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
