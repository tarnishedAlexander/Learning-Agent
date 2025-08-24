import axios from "axios";
import { readAuth } from "../utils/storage";
const API_URL = import.meta.env.API_URL;

const apiClient = axios.create({
  baseURL: API_URL || "http://localhost:3000/",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = readAuth().accessToken;
  if (token && !config.url?.includes("auth/login")) {
    if (config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
})

export default apiClient;
