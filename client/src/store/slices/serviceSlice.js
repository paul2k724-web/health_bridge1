import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../api'

export const getServices = createAsyncThunk(
  'service/getServices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/services')
      return response.data.data.services
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch services')
    }
  }
)

const serviceSlice = createSlice({
  name: 'service',
  initialState: {
    services: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getServices.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getServices.fulfilled, (state, action) => {
        state.loading = false
        state.services = action.payload
      })
      .addCase(getServices.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError } = serviceSlice.actions
export default serviceSlice.reducer
