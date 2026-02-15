import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LekhaporaProvider } from './contexts/LekhaporaContext';

// Global error tracking for remote debugging via Vercel logs
window.addEventListener('error', (event) => {
  console.error('🔴 RUNTIME CRASH:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 ASYNC FAILURE:', event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log('🟢 MOUNTING LEKHAPORA CORE...');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LekhaporaProvider>
      <App />
    </LekhaporaProvider>
  </React.StrictMode>
);

// Signal to index.html that the React app has mounted successfully
if ((window as any).markAppAsLoaded) {
  (window as any).markAppAsLoaded();
}