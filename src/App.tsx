import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, Auth, Firestore, Timestamp } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query } from 'firebase/firestore';

// Define global variables expected from the environment
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string;

// --- Constants & Types ---

type Page = 'home' | 'solutions' | 'inspector';

interface GalleryItem {
    id: string;
    prompt: string;
    imageUrl: string;
    analysis: string;
    timestamp: Timestamp;
}

const STYLE_OPTIONS = [
    { name: "High-Resolution Inspection Photo", prompt: ", professional quality, high-detail, clear visibility, 8k photo" },
    { name: "Thermal/Infrared View", prompt: ", thermal camera view, infrared spectrum, heat map overlay, vivid colors" },
    { name: "Low-Light Headlamp View", prompt: ", ultra-realistic underground mine, focused LED headlamp illumination, deep shadows, wet surfaces" },
    { name: "Digital Hazard Overlay", prompt: ", digital painting, clear safety zone markers, red hazard triangles, compliance indicators" },
];

const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';
const API_KEY = ""; 

const CRITIQUE_SYSTEM_PROMPT = `
You are a highly experienced **Mine Safety Inspector and Risk Assessment Analyst**. Your primary goal is to analyze the provided image and the associated prompt (which describes the scene) for potential hazards, non-compliance with common safety regulations (like MSHA/OSHA standards), and best practices.

Provide a detailed, three-part report:

1.  **Compliance & Hazards:** List all immediate and potential **hazards or non-compliant actions** visible in the image (e.g., lack of PPE, unstable ground, improper ventilation, blocked egress).
2.  **Risk Mitigation:** Propose specific, actionable steps to **mitigate each identified risk** (e.g., "Install secondary support beams," "Enforce hard hat and visibility vest use").
3.  **Overall Assessment:** Provide a summary rating (e.g., 'High Risk,' 'Moderate Concern,' 'Compliant') and a concise concluding recommendation.
`;

// --- Utility Functions ---

const exponentialBackoffFetch = async (url: string, options: RequestInit, maxRetries = 5) => {
    let lastError: Error | unknown = new Error("Initial fetch failed.");
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
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

const generateImage = async (fullPrompt: string, setLoading: (loading: boolean) => void, setImageUrl: (url: string) => void) => {
    setLoading(true);
    setImageUrl('');

    const payload = { 
        instances: [{ prompt: fullPrompt }], 
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
    setAnalysis('Analyzing image for safety risks with Gemini...');

    const promptParts = [
        { text: `Analyze the safety risks in this image. The scene described in the prompt is: "${userPrompt}"` },
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

// --- AI Safety Inspector Component (Internal) ---

interface AISafetyInspectorProps {
    db: Firestore | null;
    userId: string | null;
    getGalleryCollectionPath: (uid: string) => string;
}

const AISafetyInspector: React.FC<AISafetyInspectorProps> = ({ db, userId, getGalleryCollectionPath }) => {
    const [prompt, setPrompt] = useState('');
    const [artStyle, setArtStyle] = useState(STYLE_OPTIONS[0].prompt); 
    const [currentImageUrl, setCurrentImageUrl] = useState('');
    const [currentAnalysis, setCurrentAnalysis] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [saveMessage, setSaveMessage] = useState('');

    // --- Firestore Data Listener (Gallery) ---
    
    useEffect(() => {
        if (db && userId) {
            const collectionPath = getGalleryCollectionPath(userId);
            const galleryCollection = collection(db, collectionPath);
            const q = query(galleryCollection);

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const items: GalleryItem[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const timestamp = (data.timestamp && (data.timestamp as any).toDate) ? data.timestamp as Timestamp : Timestamp.now();
                    
                    items.push({
                        id: doc.id,
                        prompt: data.prompt,
                        imageUrl: data.imageUrl,
                        analysis: data.analysis,
                        timestamp: timestamp, 
                    });
                });
                items.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());
                setGalleryItems(items);
            }, (error) => {
                console.error("Error fetching safety reports:", error);
            });

            return () => unsubscribe();
        }
    }, [db, userId, getGalleryCollectionPath]);

    // --- Save Artifact Function ---

    const saveArtifact = async () => {
        if (!db || !userId || !currentImageUrl || !currentAnalysis) {
            setSaveMessage('Error: Image or analysis missing.');
            return;
        }

        setSaveMessage('Saving...');
        try {
            const collectionPath = getGalleryCollectionPath(userId);
            await addDoc(collection(db, collectionPath), {
                prompt: prompt,
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
            alert('Please enter a description of the safety scene!');
            return;
        }

        setCurrentImageUrl('');
        setCurrentAnalysis('');
        
        const fullPrompt = prompt.trim() + artStyle + ", in an underground mine environment, safety inspection, focused on hazards";

        await generateImage(fullPrompt, setIsGenerating, async (url) => {
            setCurrentImageUrl(url);
            
            const base64Data = url.split(',')[1];
            await analyzeImage(fullPrompt, base64Data, setIsAnalyzing, setCurrentAnalysis);
        });
    };

    const isReady = !isGenerating && !isAnalyzing;

    const renderGallery = () => (
        <div className="gallery-section">
            <h2 className="gallery-title">Saved Safety Reports ({galleryItems.length})</h2>
            <p className="user-id">User ID: <span className="font-mono text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded">{userId || 'Loading...'}</span></p>

            <div className="gallery-grid">
                {galleryItems.length === 0 ? (
                    <p className="text-gray-500 italic text-center col-span-1 md:col-span-2 py-8">
                        Your saved safety inspection reports will appear here.
                    </p>
                ) : (
                    galleryItems.map((item) => (
                        <div key={item.id} className="gallery-item">
                            <img src={item.imageUrl} alt={item.prompt} className="gallery-image" />
                            <div className="gallery-content">
                                <p className="gallery-prompt-text font-semibold truncate">{item.prompt}</p>
                                <details className="gallery-details">
                                    <summary className="gallery-summary">View Full Safety Report</summary>
                                    <p className="gallery-analysis-text whitespace-pre-wrap">{item.analysis}</p>
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
        <div className="flex flex-col gap-8">
            <header className="text-center pb-4 border-b border-gray-200">
                <h1 className="text-4xl font-extrabold text-melotwo-blue">AI Safety Inspector Tool</h1>
                <p className="text-xl text-gray-600 mt-2">Simulate, inspect, and mitigate mining risks.</p>
                <p className="text-red-600 font-semibold mt-4 text-sm">Disclaimer: This application simulates a safety inspection for demonstration purposes and should not be used for real-world compliance.</p>
            </header>
            <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full">
                {/* --- Left Column: Generator & Analysis --- */}
                <div className="flex-1 flex flex-col gap-6">
                    <div className="input-card">
                        <div className="style-selector-group">
                            <label htmlFor="art-style" className="style-label">Select Imaging Style:</label>
                            <select
                                id="art-style"
                                className="style-select"
                                value={artStyle}
                                onChange={(e) => setArtStyle(e.target.value)}
                                disabled={isGenerating || isAnalyzing}
                            >
                                {STYLE_OPTIONS.map(option => (
                                    <option key={option.name} value={option.prompt}>
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <textarea
                            className="prompt-input"
                            placeholder="Describe the mine scene to inspect (e.g., 'A poorly supported mine face with a worker operating heavy machinery without a helmet')."
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
                            {isGenerating ? 'Generating Scene...' : (isAnalyzing ? 'Analyzing Risks...' : 'Generate Scene & Inspect')}
                        </button>
                    </div>

                    <div className="output-card">
                        <h2>Scene Visualization</h2>
                        <div className="image-container">
                            {isGenerating && (
                                <div className="loading-overlay">
                                    <div className="spinner"></div>
                                    <p>Generating Scene...</p>
                                </div>
                            )}
                            {currentImageUrl ? (
                                <img src={currentImageUrl} alt="Generated Safety Scene" className="generated-image" />
                            ) : (
                                <div className="placeholder">
                                    The visualized mine scene will appear here for inspection.
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
                                Save Safety Report
                            </button>
                            <p className="text-sm font-medium text-red-600 transition-opacity duration-300">
                                {saveMessage}
                            </p>
                        </div>
                    </div>
                    
                    <div className="output-card analysis-card">
                        <h2>Mine Safety Report</h2>
                        {isAnalyzing && (
                            <div className="flex items-center space-x-2 text-red-500">
                                <div className="spinner-small"></div>
                                <p className="italic">Running risk analysis and report generation...</p>
                            </div>
                        )}
                        {!currentImageUrl && !isGenerating && !isAnalyzing ? (
                             <p className="text-gray-500 italic">Generate a scene to receive a detailed safety report here.</p>
                        ) : (
                             <p className="analysis-text whitespace-pre-wrap">{currentAnalysis || 'Awaiting analysis...'}</p>
                        )}
                    </div>
                </div>

                {/* --- Right Column: Gallery --- */}
                <div className="lg:w-1/3 w-full">
                    {renderGallery()}
                </div>
            </div>
        </div>
    );
};


// --- Melotwo Main Website Component ---

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('home');
    
    // Firebase State
    const [db, setDb] = useState<Firestore | null>(null);
    const [auth, setAuth] = useState<Auth | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [klaviyoStatus, setKlaviyoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    // --- Firebase Initialization and Auth ---

    useEffect(() => {
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
                    if (initialAuthToken) {
                        await signInWithCustomToken(authentication, initialAuthToken);
                    } else {
                        await signInAnonymously(authentication);
                    }
                } catch (error) {
                    console.error("Firebase Auth Error:", error);
                }
            }
            setUserId(authentication.currentUser?.uid || crypto.randomUUID());
        });

        return () => unsubscribe();
    }, []);
    
    // Utility function to get collection path (passed to inspector component)
    const getGalleryCollectionPath = useCallback((uid: string) => {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        return `artifacts/${appId}/users/${uid}/safety_reports`;
    }, []);

    // --- Klaviyo Mock Integration ---

    const handleKlaviyoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || klaviyoStatus === 'loading') return;

        setKlaviyoStatus('loading');
        console.log(`[MOCK] Attempting to capture email: ${email} for Klaviyo integration.`);

        // --- MOCK API CALL START ---
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        const mockSuccess = true; // Always succeed in the mock environment

        if (mockSuccess) {
            setKlaviyoStatus('success');
            setEmail('');
        } else {
            setKlaviyoStatus('error');
        }
        // --- MOCK API CALL END ---
        
        setTimeout(() => setKlaviyoStatus('idle'), 5000);
    };

    // --- Render Functions ---

    const renderPageContent = () => {
        if (currentPage === 'inspector') {
            return (
                <AISafetyInspector 
                    db={db} 
                    userId={userId} 
                    getGalleryCollectionPath={getGalleryCollectionPath} 
                />
            );
        }

        if (currentPage === 'solutions') {
            return (
                <div className="solutions-page-content">
                    <h2 className="text-4xl font-bold text-melotwo-blue mb-8">Certified Safety Solutions for African Mining</h2>
                    <p className="text-xl text-gray-700 max-w-4xl mx-auto mb-12">
                        Melotwo partners with global leaders to bring certified, durable, and regionally-tested safety solutions directly to your operations. Compliance is our foundation.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="solution-card">
                            <div className="icon-circle bg-red-100 text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M11.96 2.277a.814.814 0 011.08 0l2.768 2.188a3.978 3.978 0 002.164.737l3.417.361a.81.81 0 01.761.855 7.152 7.152 0 01-.219 1.487c-.173.4-.33.748-.484 1.053a20.873 20.873 0 01-1.464 2.452 24.212 24.212 0 01-2.404 2.617 21.306 21.306 0 01-2.909 2.76c-.66.56-1.332 1.092-2.022 1.587a.81.81 0 01-.986 0c-.69-.495-1.362-1.027-2.022-1.587a21.306 21.306 0 01-2.909-2.76 24.212 24.212 0 01-2.404-2.617 20.873 20.873 0 01-1.464-2.452c-.154-.305-.311-.653-.484-1.053a7.152 7.152 0 01-.219-1.487.81.81 0 01.761-.855l3.417-.361a3.978 3.978 0 002.164-.737l2.767-2.188a.814.814 0 011.08 0z" clipRule="evenodd" /></svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ground Support Systems</h3>
                            <p className="text-gray-600">Certified rock bolts, mesh, and specialized spray applications designed for unstable rock faces across African geology.</p>
                        </div>
                        <div className="solution-card">
                            <div className="icon-circle bg-yellow-100 text-yellow-600">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2.25a.75.75 0 01.75.75v.51a.75.75 0 01-1.5 0v-.51A.75.75 0 0112 2.25zM12 18a.75.75 0 01.75.75v.51a.75.75 0 01-1.5 0v-.51A.75.75 0 0112 18zM19.03 5.47a.75.75 0 010 1.06l-.51.51a.75.75 0 11-1.06-1.06l.51-.51a.75.75 0 011.06 0zM5.47 19.03a.75.75 0 010-1.06l.51-.51a.75.75 0 111.06 1.06l-.51.51a.75.75 0 01-1.06 0zM17.47 17.47a.75.75 0 010 1.06l-.51.51a.75.75 0 11-1.06-1.06l.51-.51a.75.75 0 011.06 0zM5.47 5.47a.75.75 0 010 1.06l-.51.51a.75.75 0 01-1.06-1.06l.51-.51a.75.75 0 011.06 0zM2.97 12a.75.75 0 01.75-.75h.51a.75.75 0 010 1.5h-.51a.75.75 0 01-.75-.75zM18 12a.75.75 0 01.75-.75h.51a.75.75 0 010 1.5h-.51a.75.75 0 01-.75-.75z" /><path fillRule="evenodd" d="M12 5.25a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM12 11.25a.75.75 0 100 1.5.75.75 0 000-1.5z" clipRule="evenodd" /></svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ventilation & Air Quality</h3>
                            <p className="text-gray-600">Advanced air monitoring and filtration systems crucial for deep-level mines, ensuring clean and compliant breathing air.</p>
                        </div>
                        <div className="solution-card">
                            <div className="icon-circle bg-blue-100 text-melotwo-blue">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M7.8 7.5a.75.75 0 00-1.5 0v.5a.75.75 0 001.5 0v-.5z" /><path fillRule="evenodd" d="M8.379 7.749A3.375 3.375 0 0012 9.75a3.375 3.375 0 003.621-2.001A.75.75 0 0116.5 7.5h1.875a.75.75 0 01.624 1.229l-1.071 1.07a8.25 8.25 0 01-5.467 4.091.25.25 0 00-.24 0 8.25 8.25 0 01-5.467-4.091l-1.07-1.07A.75.75 0 014.125 7.5H6a.75.75 0 000 1.5H4.875l.487.488a6.75 6.75 0 004.887 3.303.75.75 0 010 1.499c-2.31.258-4.593.57-6.848.916a.75.75 0 00-.03 1.498l19.563-.002a.75.75 0 00.03-1.498c-2.255-.345-4.538-.657-6.848-.916a.75.75 0 010-1.499 6.75 6.75 0 004.887-3.303l.488-.488H18a.75.75 0 000-1.5h-1.875a.75.75 0 01-.621-1.229z" clipRule="evenodd" /></svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Specialized PPE</h3>
                            <p className="text-gray-600">High-visibility, fire-resistant, and ergonomically designed Personal Protective Equipment tailored for harsh underground conditions.</p>
                        </div>
                    </div>

                    <div className="partner-section mt-16 pt-12 border-t border-gray-200">
                        <h3 className="text-2xl font-bold text-melotwo-blue mb-6">Certified Partners & Affiliates</h3>
                        <div className="flex flex-wrap justify-center gap-6">
                            <a href="#" className="affiliate-link">Global Safety Tech</a>
                            <a href="#" className="affiliate-link">African Mining Compliance</a>
                            <a href="#" className="affiliate-link">GeoStructure Tools</a>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="home-page-content">
                <section className="hero-section">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
                            Certified Safety Solutions for African Mining
                        </h1>
                        <p className="mt-6 text-xl text-red-100 font-light max-w-2xl mx-auto">
                            Melotwo is your trusted partner in compliance and risk mitigation, delivering world-class safety technology across the African continent.
                        </p>
                        <button 
                            className="cta-button mt-8"
                            onClick={() => setCurrentPage('solutions')}
                        >
                            Explore Our Certified Solutions
                        </button>
                    </div>
                </section>
                
                <section className="feature-section">
                    <h2 className="text-3xl font-bold text-melotwo-blue mb-4">Empowering Safety with AI</h2>
                    <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-10">
                        Harness the power of machine learning to proactively identify hazards before they lead to incidents.
                    </p>
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="feature-card">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Risk Modeling</h3>
                            <p className="text-gray-600">Generate and analyze virtual mine scenarios to train teams on hazard recognition and rapid response.</p>
                        </div>
                        <div className="feature-card">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Compliance Audits</h3>
                            <p className="text-gray-600">Rapidly cross-reference site conditions against MSHA, OSHA, and local regulations.</p>
                        </div>
                        <div className="feature-card">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Mitigation Planning</h3>
                            <p className="text-gray-600">Receive actionable, step-by-step guidance on implementing best-practice safety measures.</p>
                        </div>
                    </div>
                    <div className="text-center mt-10">
                        <button 
                            className="secondary-button"
                            onClick={() => setCurrentPage('inspector')}
                        >
                            Try the AI Safety Inspector Now
                        </button>
                    </div>
                </section>
            </div>
        );
    };

    return (
        <div id="app-container">
            {/* --- Navigation Bar --- */}
            <nav className="nav-bar">
                <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center">
                        <span className="text-2xl font-bold text-white tracking-widest">MELOTWO</span>
                    </div>
                    <div className="flex space-x-6">
                        <a href="#" className={`nav-link ${currentPage === 'home' ? 'active' : ''}`} onClick={() => setCurrentPage('home')}>Home</a>
                        <a href="#" className={`nav-link ${currentPage === 'solutions' ? 'active' : ''}`} onClick={() => setCurrentPage('solutions')}>Solutions</a>
                        <a href="#" className={`nav-link ${currentPage === 'inspector' ? 'active' : ''}`} onClick={() => setCurrentPage('inspector')}>AI Inspector</a>
                    </div>
                </div>
            </nav>

            {/* --- Main Content Area --- */}
            <main className="main-content">
                {renderPageContent()}
            </main>

            {/* --- Footer & Klaviyo Email Capture --- */}
            <footer className="footer">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-4 sm:px-6 lg:px-8">
                    <div className="md:col-span-2">
                        <h3 className="text-xl font-bold text-white mb-4">MELOTWO</h3>
                        <p className="text-gray-300 text-sm">Dedicated to raising the bar for mine safety and compliance across the African continent.</p>
                        <p className="mt-4 text-gray-400 text-xs">© {new Date().getFullYear()} Melotwo. All rights reserved.</p>
                    </div>
                    
                    {/* Affiliate Link Section (for visibility) */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li><a href="#" className="footer-link">Certified Solutions</a></li>
                            <li><a href="#" className="footer-link">Partner Portal (Affiliate)</a></li>
                            <li><a href="#" className="footer-link">Career Opportunities</a></li>
                        </ul>
                    </div>

                    {/* Email Capture Section (Klaviyo Integration) */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Stay Compliant</h3>
                        <p className="text-sm text-gray-300 mb-3">Sign up for our safety bulletins and updates.</p>
                        <form onSubmit={handleKlaviyoSubmit} className="flex flex-col space-y-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="email-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={klaviyoStatus === 'loading'}
                            />
                            <button
                                type="submit"
                                className="subscribe-button"
                                disabled={klaviyoStatus === 'loading'}
                            >
                                {klaviyoStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                            </button>
                        </form>
                        {klaviyoStatus === 'success' && <p className="text-green-400 text-sm mt-2">Subscription successful! (Klaviyo Mock)</p>}
                        {klaviyoStatus === 'error' && <p className="text-red-400 text-sm mt-2">Subscription failed. Please try again.</p>}
                    </div>
                </div>
            </footer>
        </div>
    );
};

// --- Pure CSS Styling for Melotwo Site ---

const style = document.createElement('style');
style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');

    :root {
        --melotwo-blue: #1e3a8a; /* Dark Blue - Corporate */
        --melotwo-red: #ef4444; /* Safety Red - Accent */
        --bg-light: #f9fafb; /* Light Gray */
        --text-color: #1f2937; /* Dark Gray */
    }

    #app-container {
        font-family: 'Inter', sans-serif;
        min-height: 100vh;
        background-color: var(--bg-light);
    }
    
    /* --- Navigation Bar --- */
    .nav-bar {
        background-color: var(--melotwo-blue);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        position: sticky;
        top: 0;
        z-index: 50;
    }
    .nav-link {
        color: rgba(255, 255, 255, 0.7);
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        transition: color 0.2s, background-color 0.2s;
        font-weight: 500;
    }
    .nav-link:hover {
        color: white;
    }
    .nav-link.active {
        color: white;
        background-color: rgba(255, 255, 255, 0.1);
        font-weight: 600;
    }

    /* --- Main Content --- */
    .main-content {
        min-height: calc(100vh - 4rem - 18rem); /* viewport - nav - footer */
        padding: 2rem 0;
    }
    
    .home-page-content, .solutions-page-content {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 1rem;
    }
    .solutions-page-content {
        text-align: center;
        padding: 4rem 1rem;
    }

    /* Hero Section */
    .hero-section {
        background-color: var(--melotwo-blue);
        padding: 6rem 1rem 8rem;
        border-radius: 0 0 1rem 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
        margin-bottom: 4rem;
    }
    
    /* CTA Button */
    .cta-button {
        background-color: var(--melotwo-red);
        color: white;
        padding: 0.75rem 2rem;
        border-radius: 9999px;
        font-weight: 700;
        transition: background-color 0.2s, transform 0.1s;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    }
    .cta-button:hover {
        background-color: #dc2626; /* Red 600 */
        transform: translateY(-1px);
    }

    /* Feature Section */
    .feature-section {
        padding: 3rem 1rem;
        text-align: center;
    }
    .feature-card {
        background-color: white;
        padding: 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        border: 1px solid #f3f4f6;
        transition: transform 0.2s;
    }
    .feature-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    .secondary-button {
        background-color: transparent;
        color: var(--melotwo-blue);
        border: 2px solid var(--melotwo-blue);
        padding: 0.75rem 2rem;
        border-radius: 9999px;
        font-weight: 600;
        transition: background-color 0.2s, color 0.2s;
    }
    .secondary-button:hover {
        background-color: var(--melotwo-blue);
        color: white;
    }
    
    /* Solutions Section */
    .solution-card {
        background-color: white;
        padding: 2rem;
        border-radius: 0.75rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        border-top: 4px solid var(--melotwo-red);
        transition: box-shadow 0.2s;
    }
    .icon-circle {
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
    }
    .affiliate-link {
        display: inline-block;
        padding: 0.5rem 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        color: #4b5563;
        font-weight: 500;
        transition: background-color 0.2s;
    }
    .affiliate-link:hover {
        background-color: #f3f4f6;
        border-color: #d1d5db;
    }

    /* --- Footer --- */
    .footer {
        background-color: var(--melotwo-blue);
        padding: 3rem 0;
        color: white;
        margin-top: 2rem;
    }
    .footer-link {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
        transition: color 0.2s;
    }
    .footer-link:hover {
        color: white;
        text-decoration: underline;
    }
    .email-input {
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        border: none;
        width: 100%;
        color: var(--text-color);
    }
    .subscribe-button {
        background-color: var(--melotwo-red);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 600;
        transition: background-color 0.2s;
    }
    .subscribe-button:hover:not(:disabled) {
        background-color: #dc2626;
    }
    .subscribe-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    /* --- AI Inspector Tool Styles (Reused from previous app) --- */
    
    .input-card, .output-card, .gallery-item {
        background-color: white;
        border-radius: 0.75rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        border: 1px solid #e5e7eb;
    }
    
    .style-selector-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .style-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-color);
    }

    .style-select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        background-color: white;
        transition: border-color 0.2s;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23ef4444'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        background-size: 1.5em 1.5em;
    }

    .prompt-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        resize: none;
        transition: border-color 0.2s;
    }

    .generate-button {
        width: 100%;
        padding: 0.75rem;
        background-color: var(--melotwo-blue);
        color: white;
        font-weight: 600;
        border-radius: 0.5rem;
        transition: background-color 0.2s, opacity 0.2s;
    }
    .generate-button:hover:not(:disabled) {
        background-color: #1a3278;
    }
    .generate-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .output-card h2 {
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 1rem;
        color: var(--text-color);
    }

    .image-container {
        position: relative;
        width: 100%;
        aspect-ratio: 1 / 1;
        background-color: #f3f4f6;
        border-radius: 0.5rem;
        overflow: hidden;
        border: 1px dashed var(--melotwo-red);
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
        color: #9ca3af;
        font-style: italic;
    }

    .analysis-card {
        min-height: 200px;
    }

    .analysis-text {
        line-height: 1.6;
        color: #374151;
        white-space: pre-wrap;
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
        background-color: #059669;
    }
    .save-button.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: #6b7280;
    }

    .gallery-title {
        font-size: 1.5rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
        color: var(--melotwo-blue);
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
    
    .gallery-summary {
        font-weight: 500;
        cursor: pointer;
        color: var(--melotwo-red);
    }
    
    /* Loading Spinners */
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
        color: var(--melotwo-blue);
        font-weight: 600;
    }

    .spinner, .spinner-small {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-left-color: var(--melotwo-blue);
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
