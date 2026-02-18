import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

const hideLoader = () => {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      if (loader.parentNode) loader.remove();
    }, 500);
  }
};

if (container) {
  const root = createRoot(container);
  
  try {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Smooth transition from loader to app
    if (document.readyState === 'complete') {
      setTimeout(hideLoader, 500);
    } else {
      window.addEventListener('load', () => setTimeout(hideLoader, 500));
    }
    
    // Fallback safety for the loader
    setTimeout(hideLoader, 3000);
  } catch (error) {
    console.error("Secure Mount Failure:", error);
    // In case of a catastrophic crash, at least hide the loader
    hideLoader();
  }
}