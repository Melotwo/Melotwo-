import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
// NOTE: In a real project, you would import global CSS/Tailwind here, but we'll use inline Tailwind classes.

// Check if the root element exists before trying to render
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  console.error("Failed to find the root element in the document.");
}

