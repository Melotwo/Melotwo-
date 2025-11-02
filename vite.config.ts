import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration File
 *
 * This file defines the build configuration for the project.
 * It's set up for a React application using TypeScript.
 */
export default defineConfig({
  // The 'react' plugin enables fast refresh for React components
  // and handles JSX transformations.
  plugins: [react()],

  // Configure the server for development purposes
  server: {
    // Port on which the development server will run
    port: 3000,
    // Automatically open the app in the browser on server start
    open: true,
  },

  // Configure how the final build (production) is processed
  build: {
    // Output directory for the production build
    outDir: 'dist',
    // Generate sourcemaps for debugging production code
    sourcemap: true,
  }
});
