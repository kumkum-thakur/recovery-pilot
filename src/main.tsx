import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeApp, InitializationError } from './services/initializeApp'

console.log('🚀 Starting Recovery Pilot application...');
console.log('📍 Location:', window.location.href);

// Initialize app with error handling
try {
  console.log('🔧 Initializing app...');
  initializeApp();
  console.log('✅ App initialized successfully');
} catch (error) {
  console.error('❌ Initialization error:', error);
  if (error instanceof InitializationError) {
    // Display user-friendly error message
    console.error('Application failed to start:', error.message);
    
    // Show error in the UI
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
          text-align: center;
          font-family: system-ui, -apple-system, sans-serif;
          background-color: #f8fafc;
        ">
          <div style="
            max-width: 500px;
            padding: 2rem;
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">
            <h1 style="
              color: #dc2626;
              font-size: 1.5rem;
              font-weight: 600;
              margin-bottom: 1rem;
            ">
              ⚠️ Initialization Error
            </h1>
            <p style="
              color: #475569;
              margin-bottom: 1.5rem;
              line-height: 1.6;
            ">
              ${error.message}
            </p>
            <button
              onclick="location.reload()"
              style="
                background-color: #2563eb;
                color: white;
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 0.375rem;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
              "
            >
              Refresh Page
            </button>
          </div>
        </div>
      `;
    }
    
    // Don't render the app
    throw error;
  }
  
  // Unknown error, rethrow
  console.error('❌ Unknown initialization error:', error);
  throw error;
}

console.log('🎨 Rendering React app...');
const rootElement = document.getElementById('root');
console.log('📦 Root element:', rootElement);

if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

console.log('✅ React app rendered');
