import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // Imports the main App component
import './index.css'; // Imports the compiled Tailwind styles

// Find the root element from index.html
const rootElement = document.getElementById('root');

if (rootElement) {
  // Create a React root and render the App
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Failed to find the root element. The app cannot be mounted.");
}

