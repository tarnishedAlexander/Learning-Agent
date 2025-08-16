import axios from "axios";
const API_URL = import.meta.env.API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // para las cookies
  headers: {
    "Content-Type": "application/json",
  },
});
