import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { store } from '@/store/store';

window.Pusher = Pusher;

// Fonction pour obtenir le token depuis Redux
const getToken = () => {
    const state = store.getState();
    return state.user.token;
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
    const apiUrl = import.meta.env.VITE_API_URL || 'https://bypass-api.jobs-conseil.host';
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    try {
        return new Echo({
            broadcaster: "pusher",
            key: pusherKey,
            cluster: pusherCluster,
            forceTLS: !isLocal, // Désactiver TLS en local si nécessaire
            encrypted: !isLocal,
            authEndpoint: `${apiUrl}/broadcasting/auth`,
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

// Réécouter les changements de token dans Redux
let currentToken = getToken();
store.subscribe(() => {
    const newToken = getToken();
    if (newToken !== currentToken) {
        currentToken = newToken;
        // Si le token change, on peut recréer l'instance Echo
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
