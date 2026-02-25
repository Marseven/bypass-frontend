import { configureStore } from '@reduxjs/toolkit'
import storage from 'redux-persist/lib/storage'; // par défaut => localStorage
import { persistReducer, persistStore } from 'redux-persist';
import { combineReducers } from 'redux';
import users from './users'


const persistConfig = {
  key: 'root',
  storage, // utilise localStorage
  whitelist: ['user'], // 👈 quels reducers on veut persister
};

const rootReducer = combineReducers({
  user: users,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);


export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // désactive l'erreur "non serializable" de redux-persist
    }),
})


export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store