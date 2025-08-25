import axios from "axios";
import { readAuth } from "../utils/storage";
const API_URL = import.meta.env.VITE_URL;
console.log("API_URL:", API_URL);
const jsonInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

jsonInstance.interceptors.request.use((config) => {
  const token = readAuth().accessToken;
  if (token && !config.url?.includes("/auth/login")) {
    if (config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

export default jsonInstance;
