import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });
      // Persist token
      localStorage.setItem('token', data.token);
      return data; // { success, token, user }
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Login failed. Please try again.'
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await API.post('/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    }
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await API.get('/auth/me');
      return data; // { success, user }
    } catch (err) {
      localStorage.removeItem('token');
      return rejectWithValue(
        err.response?.data?.message || 'Session expired. Please log in again.'
      );
    }
  }
);

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// ─── Slice ───────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── Login ────────────────────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = payload.token;
        state.user = payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, { payload }) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = payload;
      });

    // ── Register ─────────────────────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = payload.token;
        state.user = payload.user;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, { payload }) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = payload;
      });

    // ── Load User ────────────────────────────────────────────────────────
    builder
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = payload.user;
        state.error = null;
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
