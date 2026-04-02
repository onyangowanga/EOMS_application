import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Hotfix for stale PWA caches causing blank pages after deployments.
// We unregister old service workers and clear runtime caches on load.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister())
    })
  })
}

if ('caches' in window) {
  window.addEventListener('load', () => {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key))
    })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
