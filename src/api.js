import axios from 'axios';

// This is your single source of truth for the backend URL
const API_BASE_URL = "https://quiz-backend-mvfg.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;