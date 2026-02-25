import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store/store'
import axios from 'axios';

export type user = {
    id: number,
    username: string,
    email: string,
    full_name: string,
    role: string,
    is_active: number,
    phone: string
}

// Define a type for the slice state
export interface UserState {
  isLogin: boolean | null,
  user: user | null,
  loading: boolean,
  error: string | null,
  users: user[],
  token: string | null
}

// Define the initial state using that type
const initialState: UserState = {
  isLogin: false,
  user: null,
  loading: false,
  error: null,
  users: [],
  token: null
}

export const fetchUsers = createAsyncThunk<user[]>(
    'user/fetchUsers',
    async (_, { rejectWithValue }) => {
      try {
        const response = await axios.get('/api/users');
        return response.data; // tableau d’utilisateurs
      } catch (err: any) {
        return rejectWithValue('Erreur lors du fetch');
      }
    }
);
  

export const UserSlice = createSlice({
  name: 'users',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ user: user; token: string }>) => {
        state.isLogin = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
    },
    logout: (state) => {
        state.isLogin = false;
        state.user = initialState.user;
        state.token = '';
    },
    setUsers: (state, action: PayloadAction<user[]>) => {
        state.users = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<user>>) => {
        if (state.user) {
            state.user = { ...state.user, ...action.payload };
        }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action: PayloadAction<user[]>) => {
      state.loading = false;
      state.users = action.payload;
    });
    builder.addCase(fetchUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
})

export const { login, logout, setUsers, updateUser } = UserSlice.actions

// Other code such as selectors can use the imported `RootState` type
// export const selectCount = (state: RootState) => state.counter.value

export default UserSlice.reducer