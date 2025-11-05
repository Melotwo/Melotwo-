import { useState, useCallback } from 'react';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Define the API URL for image generation (using the preferred model)
const IMAGE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${typeof __initial_auth_token !== 'undefined' ? '' : 'YOUR_API_KEY_HERE'}`;
// Define the API URL for text generation (using the preferred model)
const TEXT_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${typeof __initial_auth_token !== 'undefined' ? '' : 'YOUR_API_KEY_HERE'}`;

// Firebase configuration and initialization (required even if not used for data storage in this simple app)
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;

// The main application component
const App = () => {
  const [prompt, setPrompt] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [analysisText, setAnalysisText] = useState('Enter a prompt above and generate an image, then click "Analyze Image"!');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState('');

  // 1. Authentication setup using useCallback to prevent re-creation
  const setupAuth = useCallback(async () => {
    if (!app) {
      console.error("Firebase App not initialized.");
      return;
    }
    try {
      const auth = getAuth(app);
      if (typeof __initial_auth_token !== 'undefined') {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
      setIsAuthReady(true);
      console.log("Firebase Auth complete.");
    } catch (e) {
      console.error("Authentication failed:", e);
      setError("Authentication failed. Check console for details.");
    }
  }, [app]);

  // Run auth setup once when the component mounts
  useState(() => {
    if (!isAuthReady) {
      setupAuth();
    }
  });

  // Utility function for exponential backoff
  const callApiWithBackoff = async (url: string, payload: any, maxRetries = 5) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          return response.json();
        }

        // Retry on status codes 429 (Too Many Requests) or 5xx (Server Error)
        if (response.status === 429 || response.status >= 500) {
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // For other client errors, throw
        throw new Error(`API Error: ${response.statusText}`);
      } catch (e) {
        if (i === maxRetries - 1) throw e;
      }
    }
    throw new Error('API call failed after maximum retries.');
  };

  // 2. Image Generation Handler
  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for the image.');
      return;
    }
    setIsLoading(true);
    setError('');
    setImageURL('');
    setAnalysisText('Image is being generated...');

    const payload = { 
      instances: [{ prompt: prompt }], 
      parameters: { "sampleCount": 1 } 
    };

    try {
      const result = await callApiWithBackoff(IMAGE_API_URL, payload);

      const base64Data = result?.predictions?.[0]?.bytesBase64Encoded;
      if (base64Data) {
        setImageURL(`data:image/png;base64,${base64Data}`);
        setAnalysisText('Image generated! Now click "Analyze Image" to get a description.');
      } else {
        throw new Error("Image data not found in the response.");
      }
    } catch (e: any) {
      console.error("Image generation failed:", e);
      setError(`Image generation failed: ${e.message || 'Unknown error'}`);
      setAnalysisText('Failed to generate image.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Image Analysis Handler
  const analyzeImage = async () => {
    if (!imageURL) {
      setError('Please generate an image first.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAnalysisText('Analyzing image...');

    // Extract the base64 data part only (without the mime type prefix)
    const base64ImageData = imageURL.split(',')[1];
    
    const userQuery = 'Describe this image in a single, vivid paragraph, focusing on the composition and color palette.';
    const payload = {
      contents: [{
        role: "user",
        parts: [
          { text: userQuery },
          {
            inlineData: {
              mimeType: "image/png",
              data: base64ImageData
            }
          }
        ]
      }],
      systemInstruction: {
        parts: [{ text: "You are a highly observant art critic and describer." }]
      },
    };

    try {
      const result = await callApiWithBackoff(TEXT_API_URL, payload);
      
      const analysis = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Analysis failed.';
      setAnalysisText(analysis);

    } catch (e: any) {
      console.error("Analysis failed:", e);
      setError(`Analysis failed: ${e.message || 'Unknown error'}`);
      setAnalysisText('Failed to analyze image.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      {/* This style block uses pure CSS and a media query to enforce the responsive layout. 
        It replaces the non-functional Tailwind responsive classes.
      */}
      <style>
        {`
        .responsive-container {
            display: flex;
            flex-direction: column; /* Default: Stacked (Mobile) */
            gap: 1.5rem;
            max-width: 80rem; /* max-w-7xl */
            margin-left: auto;
            margin-right: auto;
            padding: 1rem; /* p-4 */
        }
        
        /* Media query for screens 1024px and wider (lg: equivalent) */
        @media (min-width: 1024px) {
            .responsive-container {
                flex-direction: row; /* Side-by-side (Desktop) */
            }
        }
        
        .panel {
            flex: 1;
            padding: 1.5rem; /* p-6 */
            background-color: #ffffff;
            border-radius: 1rem; /* rounded-xl */
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-xl */
        }
        
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10;
        }
        
        .spinner {
            border: 4px solid #f3f3f3; /* Light grey */
            border-top: 4px solid #3b82f6; /* Blue */
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        `}
      </style>
      
      <div className="min-h-screen bg-gray-50 p-4 font-inter">
        <header className="py-6 mb-6 text-center bg-white shadow-md rounded-lg">
          <h1 className="text-4xl font-extrabold text-blue-700">AI Image Creation & Analysis</h1>
          <p className="text-gray-500 mt-2">Generate and then critically analyze the artwork with Gemini.</p>
        </header>

        {/* Main Content Area using Pure CSS responsive classes */}
        <main className="responsive-container">

          {/* Left Panel: Image Generation & Display */}
          <div className="panel relative">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">1. Generate Image</h2>
            
            <input
              type="text"
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., A photorealistic golden retriever wearing a tiny crown in a field of sunflowers"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />

            <button
              onClick={generateImage}
              className="w-full py-3 mb-6 font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition duration-150 shadow-md disabled:bg-gray-400"
              disabled={isLoading}
            >
              Generate Image
            </button>

            {/* Image Display */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden h-96 flex items-center justify-center border-4 border-dashed border-gray-300">
              {isLoading && (
                <div className="flex flex-col items-center">
                  <div className="spinner"></div>
                  <p className="mt-3 text-gray-600">Generating image...</p>
                </div>
              )}
              {imageURL && !isLoading && (
                <img
                  src={imageURL}
                  alt="Generated by AI"
                  className="w-full h-full object-cover"
                />
              )}
              {!imageURL && !isLoading && (
                <p className="text-gray-400">Your AI-generated image will appear here.</p>
              )}
            </div>

          </div>

          {/* Right Panel: Image Analysis */}
          <div className="panel flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">2. Analyze Image</h2>

            <button
              onClick={analyzeImage}
              className="w-full py-3 mb-6 font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 transition duration-150 shadow-md disabled:bg-gray-400"
              disabled={isLoading || !imageURL}
            >
              Analyze Image
            </button>

            {/* Analysis Output */}
            <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-y-auto relative min-h-64">
              {isLoading && !imageURL && (
                 <div className="flex flex-col items-center">
                  <div className="spinner"></div>
                  <p className="mt-3 text-gray-600">Analyzing image...</p>
                </div>
              )}
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{analysisText}</p>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default App;
