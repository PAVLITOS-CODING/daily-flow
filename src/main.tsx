import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource-variable/space-grotesk'
import './index.css'
import App from './App.tsx'
import { requestPersistentStorage } from './lib/persist.ts'
import { initTheme } from './lib/theme.ts'

// Apply the saved light/dark theme before first paint.
initTheme()

// autoUpdate: fetch and apply new versions in the background.
registerSW({ immediate: true })

// Guard local data against eviction (matters on iOS).
void requestPersistentStorage()

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
