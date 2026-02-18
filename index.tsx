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

const displayError = (err: any, title = "Mounting Error") => {
  const loaderText = document.getElementById('loader-text');
  if (loaderText) {
    loaderText.innerHTML = `
      <span style="color: #ff4444; font-size: 14px;">${title}</span><br/>
      <small style="text-transform: none; color: #666; display: block; margin-top: 10px; font-weight: normal; letter-spacing: normal;">
        ${err instanceof Error ? err.message : String(err)}
      </small>
      <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
        <button onclick="location.reload()" style="background: #222; border: 1px solid #333; color: #29A829; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-weight:bold;">Try Again</button>
      </div>
    `;
    const spinner = document.querySelector('.spinner') as HTMLElement;
    if (spinner) spinner.style.borderColor = 'rgba(255, 68, 68, 0.2)';
  }
};

if (container) {
  try {
    // Detect missing database configuration before React boot
    if (!process.env.DATABASE_URL) {
      console.warn("CRITICAL: DATABASE_URL environment variable is missing.");
      // We don't crash the whole app here, just warn. 
      // The storageService will handle the empty state gracefully.
    }

    // Expose React globally to help some ESM modules find it
    (window as any).React = React;

    const root = createRoot(container);
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // Give the browser time to finish the first paint before hiding the loading overlay
    window.addEventListener('load', () => {
        setTimeout(hideLoader, 500);
    });

    // Failsafe for hideLoader
    setTimeout(hideLoader, 2000);

  } catch (error) {
    console.error("Critical React Mount Failure:", error);
    displayError(error);
  }
} else {
  console.error("Critical Failure: Root element not found.");
}