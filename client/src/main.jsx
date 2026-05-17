import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './themes.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </AuthProvider>
  </StrictMode>,
)
