import React, { useState, useEffect } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react'; // Using lucide-react for icons

// Define the main App component as a functional component using React.FC (TypeScript)
const App: React.FC = () => {
  // State to manage the current theme mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  // useEffect hook to update the 'dark' class on the document's root element (<html>)
  // This is how Tailwind CSS detects dark mode globally.
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]); // Re-run effect when isDarkMode changes

  // Handler function to toggle the theme
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Centralized Tailwind classes for maintainability and clarity
  const containerClasses = 'min-h-screen flex items-center justify-center p-4 transition-colors duration-500';
  const cardClasses = 'bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-6 md:p-10 w-full max-w-md transition-all duration-500 transform hover:scale-[1.02] border border-gray-100 dark:border-gray-700';
  const buttonClasses = 'w-full py-3 mt-6 text-lg font-bold rounded-lg shadow-md transition-all duration-300 flex items-center justify-center space-x-2';

  return (
    // Outer container handles the background color based on the theme
    <div className={`${containerClasses} ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'}`}>
      <div className={cardClasses}>
        <div className="flex items-center justify-center mb-6">
          <Sparkles className={`h-10 w-10 transition-colors duration-500 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
        </div>
        <h1 className="text-3xl font-extrabold text-center mb-4 dark:text-white">
          Responsive Theme Switcher
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Click the button below to toggle between Light and Dark mode.
        </p>

        {/* Visual indicator (Sun/Moon icon) */}
        <div className="flex justify-center items-center h-40 w-40 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900 border-4 border-indigo-300 dark:border-indigo-600 transition-all duration-500">
          {isDarkMode ? (
            <Moon className="h-20 w-20 text-indigo-400 transition-transform duration-500 transform rotate-12" />
          ) : (
            <Sun className="h-20 w-20 text-yellow-500 transition-transform duration-500 transform -rotate-12" />
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`${buttonClasses} ${isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500' : 'bg-yellow-400 text-gray-900 hover:bg-yellow-300 focus:ring-2 focus:ring-yellow-400'}`}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-5 h-5" />
              <span>Switch to Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              <span>Switch to Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default App;
