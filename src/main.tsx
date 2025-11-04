import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// This file is kept minimal. It is only responsible for mounting the React application.
// All complex logic (like Firebase initialization, state, and utility functions)
// is correctly contained within the main component, src/App.tsx.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
