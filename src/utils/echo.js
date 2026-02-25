import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { useAuthStore } from '@/store/useAuthStore';

window.Pusher = Pusher;

// Fonction pour obtenir le token depuis Zustand
const getToken = () => {
    return useAuthStore.getState().token;
};

// Vérifier si Pusher est configuré
const isPusherConfigured = () => {
    const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY || process.env.VITE_PUSHER_APP_KEY;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Si on est en local et qu'il n'y a pas de clé Pusher, désactiver Echo
    if (isLocal && !pusherKey) {
        console.warn('Pusher non configuré en local - notifications temps réel désactivées');
        return false;
    }

    return !!pusherKey;
};

// Créer une instance Echo avec configuration dynamique
const createEcho = () => {
    const token = getToken();

    if (!token) {
        console.warn('No token available for Echo connection');
        return null;
    }

    // Vérifier si Pusher est configuré
    if (!isPusherConfigured()) {
        console.warn('Pusher not configured - real-time notifications disabled');
        return null;
    }

    const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY || process.env.VITE_PUSHER_APP_KEY;
    const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || process.env.VITE_PUSHER_APP_CLUSTER || 'mt1';
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bypass-api.jobs-conseil.host/api/v1';
    // Broadcasting auth is not under /v1 prefix — use base API URL
    const baseUrl = apiUrl.replace(/\/v1\/?$/, '');
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    try {
        return new Echo({
            broadcaster: "pusher",
            key: pusherKey,
            cluster: pusherCluster,
            forceTLS: !isLocal,
            encrypted: !isLocal,
            authEndpoint: `${baseUrl}/broadcasting/auth`,
            auth: {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            },
            enabledTransports: ['ws', 'wss'],
            disabledTransports: [],
        });
    } catch (error) {
        console.error('Error creating Echo instance:', error);
        return null;
    }
};

// Créer l'instance Echo
let echo = createEcho();

// Réécouter les changements de token via Zustand subscribe
let currentToken = getToken();
useAuthStore.subscribe((state) => {
    const newToken = state.token;
    if (newToken !== currentToken) {
        currentToken = newToken;
        if (echo) {
            try {
                echo.disconnect();
            } catch (error) {
                console.warn('Error disconnecting Echo:', error);
            }
        }
        echo = createEcho();
    }
});

export default echo;
