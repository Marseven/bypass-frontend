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
  two_fa_enabled?: boolean;
};

interface AuthState {
  isLogin: boolean;
  user: User | null;
  token: string | null;
  users: User[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  awaiting2FA: boolean;
  tempToken: string | null;

  login: (user: User, token: string) => void;
  logout: () => void;
  setUsers: (users: User[]) => void;
  updateUser: (partial: Partial<User>) => void;
  fetchUsers: () => Promise<void>;
  setOnline: (online: boolean) => void;
  set2FAState: (awaiting: boolean, token: string | null) => void;
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
      awaiting2FA: false,
      tempToken: null,

      login: (user, token) => set({ isLogin: true, user, token, awaiting2FA: false, tempToken: null }),

      logout: () => set({ isLogin: false, user: null, token: '', users: [], awaiting2FA: false, tempToken: null }),

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

      set2FAState: (awaiting, token) => set({ awaiting2FA: awaiting, tempToken: token }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isLogin: state.isLogin,
        user: state.user,
        token: state.token,
        users: state.users,
        isOnline: state.isOnline,
        // Exclude awaiting2FA and tempToken from persistence
      }),
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
