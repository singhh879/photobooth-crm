import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://photobooth-crm.onrender.com',
  timeout: 60000,
});

export default api;
