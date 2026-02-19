import axios from "axios";

// Standardize the URL for your active Render service
const API_BASE_URL = "https://quiz-backend-68mu.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;