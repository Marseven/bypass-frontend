import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../axios';

export type UserRole =
  | 'operateur' | 'technicien' | 'instrumentiste' | 'chef_de_quart'
  | 'responsable_hse' | 'resp_exploitation' | 'directeur' | 'administrateur'
  | 'user' | 'supervisor' | 'director' | 'administrator';

export type User = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: number;
  phone: string;
};

interface AuthState {
  isLogin: boolean;
  user: User | null;
  token: string | null;
  users: User[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;

  login: (user: User, token: string) => void;
  logout: () => void;
  setUsers: (users: User[]) => void;
  updateUser: (partial: Partial<User>) => void;
  fetchUsers: () => Promise<void>;
  setOnline: (online: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLogin: false,
      user: null,
      token: null,
      users: [],
      loading: false,
      error: null,
      isOnline: true,

      login: (user, token) => set({ isLogin: true, user, token }),

      logout: () => set({ isLogin: false, user: null, token: '', users: [] }),

      setUsers: (users) => set({ users }),

      updateUser: (partial) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...partial } });
        }
      },

      fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
          const response = await api.get('/users');
          set({ loading: false, users: response.data });
        } catch {
          set({ loading: false, error: 'Erreur lors du fetch' });
        }
      },

      setOnline: (online) => set({ isOnline: online }),
    }),
    {
      name: 'auth-storage',
      partials: undefined,
      // Migrate from redux-persist format on first load
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) return;

          // Migrate from old redux-persist format
          try {
            const oldData = localStorage.getItem('persist:root');
            if (oldData) {
              const parsed = JSON.parse(oldData);
              const userState = parsed.user ? JSON.parse(parsed.user) : null;
              if (userState?.token && userState?.user) {
                const store = useAuthStore.getState();
                if (!store.token) {
                  store.login(userState.user, userState.token);
                }
              }
              // Remove old format after migration
              localStorage.removeItem('persist:root');
            }
          } catch {
            // Ignore migration errors
          }
        };
      },
    }
  )
);
