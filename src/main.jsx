
import './index.css'      
import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'         
import App from './App.jsx'           
import { AuthProvider } from './contexts/AuthContext'

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
)
