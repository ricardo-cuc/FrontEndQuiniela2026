import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// ✅ Registro del Service Worker con control de actualización
const updateSW = registerSW({
  onNeedRefresh() {
    //console.log('🔄 Nueva versión disponible');
    if (confirm('Hay una nueva versión disponible. ¿Deseas actualizar?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    //console.log('✅ App lista para trabajar offline');
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)