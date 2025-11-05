import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, Auth, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, Firestore, Timestamp, doc } from 'firebase/firestore';

// Define global variables expected from the environment
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string;

// --- Interfaces ---

interface GalleryItem {
    id: string;
    prompt: string;
    imageUrl: string;
    analysis: string;
    timestamp: Timestamp;
}

// --- Constants ---

// Model and API settings
const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';
const API_KEY = ""; // Canvas will inject the key

// System prompt for the critique (Refinement #1)
const CRITIQUE_SYSTEM_PROMPT = "You are a professional art critic specializing in AI-generated imagery. Provide a detailed, 2-3 paragraph critique of the image, focusing on composition, lighting, style coherence, and how well the final image matches the user's creative intent (the prompt). Use an encouraging, yet honest, tone.";

// --- Helper Functions ---

const exponentialBackoffFetch = async (url: string, options: RequestInit, maxRetries = 5) => {
    let lastError: Error | unknown = new Error("Initial fetch failed.");
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // If it's a 4xx or 5xx, we might need to retry, or throw a specific error
                if (response.status === 429 || response.status >= 500) {
                     throw new Error(`HTTP error! Status: ${response.status}`);
                }
                throw new Error(`API Error: ${response.statusText}`);
            }
            return response;
        } catch (error) {
            lastError = error;
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw new Error(`Fetch failed after ${maxRetries} attempts: ${lastError}`);
};

// --- API Functions ---

const generateImage = async (userPrompt: string, setLoading: (loading: boolean) => void, setImageUrl: (url: string) => void) => {
    setLoading(true);
    setImageUrl('');

    const payload = { 
        instances: [{ prompt: userPrompt }], 
        parameters: { "sampleCount": 1 } 
    };

    try {
        const response = await exponentialBackoffFetch(`${IMAGEN_API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const base64Data = result?.predictions?.[0]?.bytesBase64Encoded;
        
        if (base64Data) {
            const imageUrl = `data:image/png;base64,${base64Data}`;
            setImageUrl(imageUrl);
        } else {
            console.error("Image generation failed. Result:", result);
            alert("Image generation failed. Please check the console for details.");
        }
    } catch (error) {
        console.error("Error during image generation:", error);
        alert(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        setLoading(false);
    }
};

const analyzeImage = async (userPrompt: string, base64ImageData: string, setLoading: (loading: boolean) => void, setAnalysis: (analysis: string) => void) => {
    setLoading(true);
    setAnalysis('Analyzing image with Gemini...');

    const promptParts = [
        { text: `Critique the following image based on the original prompt: "${userPrompt}"` },
        {
            inlineData: {
                mimeType: "image/png",
                data: base64ImageData
            }
        }
    ];

    const payload = {
        contents: [{ role: "user", parts: promptParts }],
        systemInstruction: { parts: [{ text: CRITIQUE_SYSTEM_PROMPT }] }
    };

    try {
        const response = await exponentialBackoffFetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
            setAnalysis(text);
        } else {
            setAnalysis("Analysis failed. Model returned no text.");
            console.error("Analysis failed. Result:", result);
        }
    } catch (error) {
        setAnalysis("An error occurred during analysis.");
        console.error("Error during analysis:", error);
    } finally {
        setLoading(false);
    }
};


// --- React Component ---

const App: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [currentImageUrl, setCurrentImageUrl] = useState('');
    const [currentAnalysis, setCurrentAnalysis] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Firestore State (Persistence #2)
    const [db, setDb] = useState<Firestore | null>(null);
    const [auth, setAuth] = useState<Auth | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [saveMessage, setSaveMessage] = useState('');


    // --- Firebase Initialization and Auth ---

    useEffect(() => {
        // Retrieve global variables
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        let firebaseConfig = {};
        if (typeof __firebase_config !== 'undefined') {
            try {
                firebaseConfig = JSON.parse(__firebase_config);
            } catch (e) {
                console.error("Failed to parse __firebase_config:", e);
            }
        }
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;

        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const authentication = getAuth(app);

        setDb(firestore);
        setAuth(authentication);

        const unsubscribe = onAuthStateChanged(authentication, async (user) => {
            if (!user) {
                try {
                    // Sign in using custom token or anonymously
                    if (initialAuthToken) {
                        await signInWithCustomToken(authentication, initialAuthToken);
                    } else {
                        await signInAnonymously(authentication);
                    }
                } catch (error) {
                    console.error("Firebase Auth Error:", error);
                }
            }
            // Once auth state is set, use the UID or a random ID
            setUserId(authentication.currentUser?.uid || crypto.randomUUID());
        });

        return () => unsubscribe();
    }, []);
    
    // Utility function to get collection path
    const getGalleryCollectionPath = useCallback((uid: string) => {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        // Private data path: /artifacts/{appId}/users/{userId}/{collectionName}
        return `artifacts/${appId}/users/${uid}/gallery_items`;
    }, []);


    // --- Firestore Data Listener (Gallery) ---
    
    useEffect(() => {
        if (db && userId) {
            const collectionPath = getGalleryCollectionPath(userId);
            const galleryCollection = collection(db, collectionPath);
            
            // Listen for real-time updates
            const q = query(galleryCollection);

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const items: GalleryItem[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    items.push({
                        id: doc.id,
                        prompt: data.prompt,
                        imageUrl: data.imageUrl,
                        analysis: data.analysis,
                        timestamp: data.timestamp || Timestamp.now(), // Fallback for old data
                    });
                });
                // Sort by timestamp descending (newest first)
                items.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());
                setGalleryItems(items);
            }, (error) => {
                console.error("Error fetching gallery items:", error);
            });

            // Cleanup function
            return () => unsubscribe();
        }
    }, [db, userId, getGalleryCollectionPath]);


    // --- Save Artifact Function ---

    const saveArtifact = async () => {
        if (!db || !userId || !currentImageUrl || !currentAnalysis) {
            console.error("Cannot save: DB not ready or data missing.");
            setSaveMessage('Error: Image or analysis missing.');
            return;
        }

        setSaveMessage('Saving...');
        try {
            const collectionPath = getGalleryCollectionPath(userId);
            await addDoc(collection(db, collectionPath), {
                prompt: prompt, // Use the prompt that generated the image
                imageUrl: currentImageUrl,
                analysis: currentAnalysis,
                timestamp: Timestamp.now(),
            });
            setSaveMessage('Saved successfully!');
        } catch (error) {
            console.error("Error saving artifact:", error);
            setSaveMessage('Save failed!');
        } finally {
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };


    // --- Main Generation Handler ---

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            alert('Please enter a prompt!');
            return;
        }

        setCurrentImageUrl('');
        setCurrentAnalysis('');

        await generateImage(prompt, setIsGenerating, async (url) => {
            setCurrentImageUrl(url);
            
            // Once image is generated, immediately trigger analysis
            const base64Data = url.split(',')[1];
            await analyzeImage(prompt, base64Data, setIsAnalyzing, setCurrentAnalysis);
        });
    };

    const isReady = !isGenerating && !isAnalyzing;


    // --- Render Functions ---

    const renderGallery = () => (
        <div className="gallery-section">
            <h2 className="gallery-title">Gallery ({galleryItems.length})</h2>
            <p className="user-id">User ID: <span className="font-mono text-xs text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">{userId || 'Loading...'}</span></p>

            <div className="gallery-grid">
                {galleryItems.length === 0 ? (
                    <p className="text-gray-500 italic text-center col-span-1 md:col-span-2 py-8">
                        Your saved creations will appear here in real-time.
                    </p>
                ) : (
                    galleryItems.map((item) => (
                        <div key={item.id} className="gallery-item">
                            <img src={item.imageUrl} alt={item.prompt} className="gallery-image" />
                            <div className="gallery-content">
                                <p className="gallery-prompt-text font-semibold truncate">{item.prompt}</p>
                                <details className="gallery-details">
                                    <summary className="gallery-summary">View Critique</summary>
                                    <p className="gallery-analysis-text">{item.analysis}</p>
                                    <small className="text-gray-400">
                                        Saved: {item.timestamp.toDate().toLocaleDateString()}
                                    </small>
                                </details>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
    

    return (
        <div id="app-container">
            <header className="header">
                <h1>AI Art Critic</h1>
                <p>Generate an image and get a professional critique from the Gemini model.</p>
            </header>

            <div id="main-layout">
                {/* --- Left Column: Generator --- */}
                <div className="generation-area">
                    <div className="input-card">
                        <textarea
                            className="prompt-input"
                            placeholder="Enter your artistic vision here (e.g., 'A cyberpunk street scene with neon rain and a flying car, highly detailed 8k')."
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isGenerating || isAnalyzing}
                        />
                        <button 
                            className="generate-button"
                            onClick={handleGenerate} 
                            disabled={!isReady || !prompt.trim()}
                        >
                            {isGenerating ? 'Generating Image...' : (isAnalyzing ? 'Analyzing Image...' : 'Generate & Critique')}
                        </button>
                    </div>

                    <div className="output-card">
                        <h2>Visual Artifact</h2>
                        <div className="image-container">
                            {isGenerating && (
                                <div className="loading-overlay">
                                    <div className="spinner"></div>
                                    <p>Generating...</p>
                                </div>
                            )}
                            {currentImageUrl ? (
                                <img src={currentImageUrl} alt="Generated Art" className="generated-image" />
                            ) : (
                                <div className="placeholder">
                                    Your generated art will appear here.
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-between items-center mt-3">
                            <button 
                                className={`save-button ${!currentImageUrl || !isReady ? 'disabled' : ''}`}
                                onClick={saveArtifact}
                                disabled={!currentImageUrl || !isReady}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1">
                                    <path d="M5.5 10a.5.5 0 01.5-.5h4a.5.5 0 010 1H6a.5.5 0 01-.5-.5z" />
                                    <path fillRule="evenodd" d="M3 3.5A1.5 1.5 0 014.5 2h11A1.5 1.5 0 0117 3.5v13a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13zm1.5-.5a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-13a.5.5 0 00-.5-.5h-11zM10 13a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2a.5.5 0 01-.5-.5z" clipRule="evenodd" />
                                </svg>
                                Save to Gallery
                            </button>
                            <p className="text-sm font-medium text-indigo-600 transition-opacity duration-300">
                                {saveMessage}
                            </p>
                        </div>
                    </div>
                    
                    <div className="output-card analysis-card">
                        <h2>Art Critique</h2>
                        {isAnalyzing && (
                            <div className="flex items-center space-x-2 text-indigo-500">
                                <div className="spinner-small"></div>
                                <p className="italic">Running professional critique...</p>
                            </div>
                        )}
                        {!currentImageUrl && !isGenerating && !isAnalyzing ? (
                             <p className="text-gray-500 italic">Generate an image to receive a critique here.</p>
                        ) : (
                             <p className="analysis-text whitespace-pre-wrap">{currentAnalysis || 'Awaiting analysis...'}</p>
                        )}
                    </div>
                </div>

                {/* --- Right Column: Gallery --- */}
                {renderGallery()}
            </div>

            {/* Always display User ID for debug/sharing */}
            {/* The ID is now moved inside the gallery section */}
        </div>
    );
};

// --- Pure CSS Styling (Tweak #3) ---

const style = document.createElement('style');
style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');

    :root {
        --primary-color: #4f46e5; /* Indigo 600 */
        --primary-light: #818cf8; /* Indigo 400 */
        --bg-color: #f8fafc; /* Slate 50 */
        --card-bg: #ffffff;
        --border-color: #e5e7eb; /* Gray 200 */
    }

    #app-container {
        font-family: 'Inter', sans-serif;
        background-color: var(--bg-color);
        min-height: 100vh;
        padding: 1rem;
    }

    .header {
        text-align: center;
        padding: 1rem 0 2rem;
        color: var(--primary-color);
    }
    .header h1 {
        font-size: 2.25rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
    }
    .header p {
        font-size: 1rem;
        color: #64748b; /* Slate 500 */
    }

    /* Main Layout for Responsiveness */
    #main-layout {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
    }

    @media (min-width: 1024px) {
        #main-layout {
            flex-direction: row;
            align-items: flex-start;
        }
    }

    .generation-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    /* Cards */
    .input-card, .output-card, .gallery-item {
        background-color: var(--card-bg);
        border-radius: 0.75rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        border: 1px solid var(--border-color);
    }

    /* Input Area */
    .prompt-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db; /* Gray 300 */
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        resize: none;
        transition: border-color 0.2s;
    }
    .prompt-input:focus {
        border-color: var(--primary-color);
        outline: none;
        box-shadow: 0 0 0 1px var(--primary-color);
    }

    .generate-button {
        width: 100%;
        padding: 0.75rem;
        background-color: var(--primary-color);
        color: white;
        font-weight: 600;
        border-radius: 0.5rem;
        transition: background-color 0.2s, opacity 0.2s;
    }
    .generate-button:hover:not(:disabled) {
        background-color: #4338ca; /* Indigo 700 */
    }
    .generate-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    /* Output Area */
    .output-card h2 {
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 1rem;
        color: #1f2937; /* Gray 800 */
    }

    .image-container {
        position: relative;
        width: 100%;
        aspect-ratio: 1 / 1;
        background-color: #f3f4f6; /* Gray 100 */
        border-radius: 0.5rem;
        overflow: hidden;
        border: 1px dashed var(--primary-light);
    }

    .generated-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #9ca3af; /* Gray 400 */
        font-style: italic;
    }

    .analysis-card {
        min-height: 150px;
    }

    .analysis-text {
        line-height: 1.6;
        color: #374151; /* Gray 700 */
    }
    
    .save-button {
        display: flex;
        align-items: center;
        padding: 0.5rem 1rem;
        background-color: #10b981; /* Emerald 500 */
        color: white;
        font-weight: 600;
        border-radius: 0.5rem;
        transition: background-color 0.2s;
    }
    .save-button:hover:not(.disabled) {
        background-color: #059669; /* Emerald 600 */
    }
    .save-button.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: #6b7280; /* Gray 500 */
    }


    /* --- Gallery Section (Persistence #2) --- */

    .gallery-section {
        flex: 1;
    }
    
    @media (min-width: 1024px) {
        .gallery-section {
            flex: 1;
        }
    }

    .gallery-title {
        font-size: 1.75rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
        color: var(--primary-color);
    }
    
    .user-id {
        margin-bottom: 1rem;
        color: #4b5563; /* Gray 600 */
        font-size: 0.875rem;
    }
    
    .gallery-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    @media (min-width: 640px) {
        .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    
    .gallery-item {
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        border: 1px solid #d1d5db;
        transition: transform 0.2s;
    }
    .gallery-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    }

    .gallery-image {
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border-radius: 0.375rem;
        margin-bottom: 0.75rem;
    }
    
    .gallery-content {
        flex-grow: 1;
    }

    .gallery-prompt-text {
        font-size: 0.9rem;
        color: #1f2937;
    }
    
    .gallery-details {
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px solid #f3f4f6;
    }
    
    .gallery-summary {
        font-weight: 500;
        cursor: pointer;
        color: var(--primary-color);
    }
    
    .gallery-analysis-text {
        margin-top: 0.5rem;
        font-size: 0.8rem;
        color: #4b5563;
        line-height: 1.4;
    }


    /* --- Loading Spinners --- */

    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.9);
        z-index: 10;
        color: var(--primary-color);
        font-weight: 600;
    }

    .spinner, .spinner-small {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-left-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 0.5rem;
    }
    .spinner {
        width: 50px;
        height: 50px;
    }
    .spinner-small {
        width: 20px;
        height: 20px;
        border-width: 3px;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
`;
document.head.appendChild(style);

export default App;
