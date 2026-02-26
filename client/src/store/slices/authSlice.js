import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../api'

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const data = response.data.data
      
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      
      return data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  }
)

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ userId, otp }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify-otp', { userId, otp })
      if (response.data.data.token) {
        localStorage.setItem('token', response.data.data.token)
      }
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'OTP verification failed')
    }
  }
)

export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me')
      return response.data.data.user
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get user')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem('token'),
  },
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.user) {
          state.user = action.payload.user
          state.token = action.payload.token
          state.isAuthenticated = true
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(getMe.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.loading = false
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload
        state.isAuthenticated = true
        state.loading = false
      })
      .addCase(getMe.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.user = null
        state.token = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
