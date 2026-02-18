import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  
  const hideLoader = () => {
    const loader = document.getElementById('app-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => {
        if (loader.parentNode) loader.remove();
      }, 500);
    }
  };

  try {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    // Give React a small window to perform initial mounting before clearing the loader
    setTimeout(hideLoader, 600);
  } catch (error) {
    console.error("Mounting Error:", error);
    const loaderText = document.getElementById('loader-text');
    if (loaderText) {
      loaderText.innerHTML = `
        <span style="color: #ff4444; font-size: 14px;">Initialization Failure</span><br/>
        <small style="text-transform: none; color: #666; display: block; margin-top: 10px; font-weight: normal; letter-spacing: normal;">
          ${error instanceof Error ? error.message : 'Check browser console for logs.'}
        </small>
        <button onclick="location.reload()" style="margin-top: 20px; background: #222; border: 1px solid #333; color: #888; padding: 5px 15px; border-radius: 4px; cursor: pointer;">Retry</button>
      `;
    }
  }
} else {
  console.error("Critical Failure: Root element not found in DOM.");
}
