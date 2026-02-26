import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../api'

export const createBooking = createAsyncThunk(
  'booking/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings', bookingData)
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Booking failed')
    }
  }
)

export const getMyBookings = createAsyncThunk(
  'booking/getMyBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/customer/bookings')
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings')
    }
  }
)

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    bookings: [],
    currentBooking: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false
        state.currentBooking = action.payload.booking
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(getMyBookings.fulfilled, (state, action) => {
        state.bookings = action.payload
      })
  },
})

export const { clearError, setCurrentBooking } = bookingSlice.actions
export default bookingSlice.reducer
