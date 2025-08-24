import axios from "axios";

const API_URL = import.meta.env.VITE_URL;

export const apiClient = axios.create({
  baseURL: API_URL || "http://localhost:3000/",
  headers: {
    "Content-Type": "application/json",
  },
});
