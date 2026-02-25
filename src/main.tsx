import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { store, persistor } from './store/store'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react';


// const BASE_URL = 'http://127.0.0.1:8001/api';
createRoot(document.getElementById("root")!).render(
    <Provider store={ store }>
        <PersistGate loading={<div>Chargement...</div>} persistor={persistor}>
            <App />
        </PersistGate>
    </Provider>
);
