// src/api/axios.ts
import axios from 'axios';
import { store } from '@/store/store'; // ton Redux store
import { logout } from '@/store/users';


const api = axios.create({
  baseURL: 'https://bypass-api.jobs-conseil.host/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
     "ngrok-skip-browser-warning": "true" 
  },
  withCredentials: true,
});

api.interceptors.request.use(config => {
  const state = store.getState();
  let token = state.user.token; // récupère le token depuis Redux
  
  // Fallback: si le token n'est pas dans Redux (store pas encore hydraté), 
  // essayer de le récupérer depuis localStorage
  if (!token) {
    try {
      const persistedState = localStorage.getItem('persist:root');
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        const userState = parsed.user ? JSON.parse(parsed.user) : null;
        token = userState?.token || null;
      }
    } catch (error) {
      console.error('Error reading token from localStorage:', error);
    }
  }
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

// Intercepteur de réponse pour gérer les erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si on est déjà sur la page de login, ne pas faire de logout
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        // Déconnecter l'utilisateur et rediriger vers la page de login
        store.dispatch(logout());
        // Rediriger seulement si on n'est pas déjà sur la page de login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;                               
