import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // Imports the main App component
import './index.css'; // Assuming you have a CSS entry point for Tailwind or global styles

// --- Global Variable Initialization (Mandatory for Canvas Environment) ---

// 1. Initialize global constants for Firestore connection
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined'
    ? JSON.parse(__firebase_config)
    : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined'
    ? __initial_auth_token
    : null;

// 2. Attach global constants to the window object so they are accessible
// in functional components (like App.tsx) without props drilling.
if (typeof window !== 'undefined') {
    (window as any).__APP_ID = appId;
    (window as any).__FIREBASE_CONFIG = firebaseConfig;
    (window as any).__INITIAL_AUTH_TOKEN = initialAuthToken;
}

// -------------------------------------------------------------------------

// Find the root element from index.html (standard vite/react setup)
const rootElement = document.getElementById('root');

if (rootElement) {
  // Create a React root and render the App
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  // Log an error if the root element isn't found
  console.error("Failed to find the root element with ID 'root'. The app cannot be mounted.");
}
