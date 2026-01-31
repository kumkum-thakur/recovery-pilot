import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { persistenceService } from './services/persistenceService'
import { initializeSeedData } from './services/seedData'

// Initialize seed data on app startup
initializeSeedData(persistenceService);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
