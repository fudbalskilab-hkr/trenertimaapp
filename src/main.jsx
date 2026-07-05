import React from 'react'
import { createRoot } from 'react-dom/client'
import { StoreProvider } from './data/store'
import { AuthGate } from './auth'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthGate>
      <StoreProvider>
        <App />
      </StoreProvider>
    </AuthGate>
  </React.StrictMode>
)
