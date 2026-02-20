import axios from "axios";

// ✅ MODIFIED: Picks up the Vercel variable, or defaults to your current URL
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "https://quiz-backend-68mu.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;