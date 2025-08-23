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

export default jsonInstance;
