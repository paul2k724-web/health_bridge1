import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { store } from './store/store.js'
import { ThemeProvider } from './context/ThemeContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider>
            <App />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                },
              }}
            />
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>,
)
