import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LekhaporaProvider } from './contexts/LekhaporaContext';
import { AuthProvider } from './contexts/AuthContext';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Global error tracking
window.addEventListener('error', (event) => {
  console.error('CRITICAL APP ERROR:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('UNHANDLED PROMISE REJECTION:', event.reason);
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registered'))
      .catch(err => console.log('SW registration failed', err));
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <LekhaporaProvider>
        <App />
        <SpeedInsights />
      </LekhaporaProvider>
    </AuthProvider>
  </React.StrictMode>
);