import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx' // Імпортуємо AuthProvider
import './index.css'

const repoName = import.meta.env.MODE === 'production' ? '/webmeteo' : '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={repoName}>
      <AuthProvider> {/* Обгортаємо App */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)