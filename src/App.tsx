import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { Settings, Shield, Zap, Search, Loader2, Link, Home, ChevronRight } from 'lucide-react';

// --- Global Setup (Required by Canvas environment) ---
// These globals are provided by the hosting environment.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'melotwo-app';

// Mock LLM API Call Simulation
// This function simulates an interaction with the Gemini API endpoint for the Safety Inspector.
const mockGenerateContent = async (scenario, systemInstruction) => {
    // Base API structure as required by instructions
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: scenario }] }],
        tools: [{ "google_search": {} }],
        systemInstruction: {
            parts: [{ text: systemInstruction }]
        },
    };

    // 1. Simulate Network Delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // 2. Simple Safety Heuristic Simulation
    const lowerScenario = scenario.toLowerCase();
    const isUnsafe = lowerScenario.includes('exploit') || lowerScenario.includes('hack') || lowerScenario.includes('phish');

    // 3. Simulated Response and Score
    const safetyScoreValue = isUnsafe ? '9.5' : '1.2';
    const safetyScoreLabel = isUnsafe ? 'High Risk' : 'Low Risk';
    const safetyColor = isUnsafe ? 'text-red-500 bg-red-100 border-red-500' : 'text-green-500 bg-green-100 border-green-500';

    const simulatedResponse = isUnsafe
        ? `[**Safety Inspector Blocked**] Policy violation detected. Scenario involves activities categorized as ${safetyScoreLabel}. The LLM output has been suppressed.`
        : `[**LLM Response Mock**] Scenario analysis complete. The request is related to a business query regarding ${scenario.length < 40 ? scenario : scenario.substring(0, 40) + '...'} and is compliant. The LLM provides the following guidance: "Focus on establishing clear, measurable safety metrics and integrate them into your continuous integration/continuous deployment (CI/CD) pipeline for real-time monitoring."`;

    return {
        text: simulatedResponse,
        score: safetyScoreValue,
        label: safetyScoreLabel,
        color: safetyColor,
    };
};

// --- Data & Constants ---

const AFFILIATE_LINKS = [
  { id: 1, name: 'AI Security Pro', url: '#', description: 'Advanced threat modeling and adversarial testing tools.', icon: Shield },
  { id: 2, name: 'Data Privacy Vault', url: '#', description: 'Comprehensive data anonymization and access control services.', icon: Settings },
  { id: 3, name: 'Model Governance Engine', url: '#', description: 'Automated policy enforcement and audit trail generation.', icon: Zap },
];

// --- Sub-Components ---

const AffiliateLinkCard = ({ link }) => (
    <a href={link.url} className="flex flex-col p-6 space-y-3 transition duration-300 transform bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:scale-[1.02]">
        <link.icon className="w-8 h-8 text-indigo-600" />
        <h3 className="text-xl font-semibold text-gray-900">{link.name}</h3>
        <p className="text-sm text-gray-500">{link.description}</p>
        <div className="flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
            Learn More <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </div>
    </a>
);

const Navbar = ({ currentPage, setPage }) => {
    const navItems = [
        { name: 'Home', page: 'home' },
        { name: 'Solutions', page: 'solutions' },
        { name: 'AI Safety Inspector', page: 'inspector' },
    ];

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
            <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center space-x-2">
                    <Shield className="w-7 h-7 text-indigo-600" />
                    <span className="text-2xl font-extrabold text-gray-900 tracking-tight">Melotwo</span>
                </div>
                <nav className="hidden md:flex space-x-8">
                    {navItems.map(item => (
                        <button
                            key={item.page}
                            onClick={() => setPage(item.page)}
                            className={`px-3 py-2 text-sm font-medium transition duration-150 ease-in-out rounded-lg ${
                                currentPage === item.page
                                    ? 'text-indigo-600 border-b-2 border-indigo-600 font-semibold'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            {item.name}
                        </button>
                    ))}
                </nav>
                <div className="hidden md:block">
                    <a href="#" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Get Started
                    </a>
                </div>
            </div>
        </header>
    );
};

const Footer = () => (
    <footer className="bg-gray-800 mt-16">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
            <nav className="flex flex-wrap justify-center -m-5">
                <div className="p-5">
                    <a href="#" className="text-base text-gray-300 hover:text-white">Home</a>
                </div>
                <div className="p-5">
                    <a href="#" className="text-base text-gray-300 hover:text-white">Solutions</a>
                </div>
                <div className="p-5">
                    <a href="#" className="text-base text-gray-300 hover:text-white">Inspector</a>
                </div>
                <div className="p-5">
                    <a href="#" className="text-base text-gray-300 hover:text-white">Careers</a>
                </div>
            </nav>
            <div className="mt-8">
                <h4 className="text-lg font-semibold text-center text-gray-300 mb-4">Affiliate Links</h4>
                <div className="flex justify-center space-x-6">
                    {AFFILIATE_LINKS.map(link => (
                        <a key={link.id} href={link.url} className="text-sm text-indigo-400 hover:text-indigo-300 transition duration-150 ease-in-out">
                            {link.name}
                        </a>
                    ))}
                </div>
            </div>
            <p className="mt-8 text-center text-base text-gray-400">
                &copy; {new Date().getFullYear()} Melotwo, Inc. All rights reserved.
            </p>
        </div>
    </footer>
);


// --- Page Components ---

const HomePage = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="text-center">
            <h1 className="text-6xl font-extrabold tracking-tight text-gray-900 sm:text-7xl">
                The Future of <span className="text-indigo-600">AI Safety</span>, Today.
            </h1>
            <p className="max-w-3xl mx-auto mt-6 text-xl text-gray-500">
                Melotwo provides cutting-edge tools to analyze, test, and ensure your Large Language Models (LLMs) operate within ethical and regulatory guardrails.
            </p>
            <div className="mt-10 flex justify-center space-x-6">
                <a href="#" className="inline-flex items-center px-8 py-3 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300">
                    Explore Solutions
                </a>
                <a href="#" className="inline-flex items-center px-8 py-3 text-base font-medium text-indigo-600 bg-white border border-indigo-600 rounded-lg shadow-sm hover:bg-indigo-50 transition duration-300">
                    Watch Demo
                </a>
            </div>
        </div>

        <div className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Why Melotwo?</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="p-8 bg-white shadow-xl rounded-xl border border-gray-100">
                    <Shield className="w-10 h-10 text-indigo-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Proactive Guardrails</h3>
                    <p className="text-gray-600">Define and enforce strict behavioral policies before deployment, drastically reducing risk of misuse.</p>
                </div>
                <div className="p-8 bg-white shadow-xl rounded-xl border border-gray-100">
                    <Settings className="w-10 h-10 text-indigo-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-Time Monitoring</h3>
                    <p className="text-gray-600">Continuously audit model output for drifts, toxicity, and compliance gaps in live environments.</p>
                </div>
                <div className="p-8 bg-white shadow-xl rounded-xl border border-gray-100">
                    <Zap className="w-10 h-10 text-indigo-600 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Scenario Testing</h3>
                    <p className="text-gray-600">Use our AI Safety Inspector to simulate adversarial prompts and edge-case scenarios easily.</p>
                </div>
            </div>
        </div>
    </div>
);

const SolutionsPage = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <header className="text-center mb-12">
            <h1 className="text-5xl font-extrabold text-gray-900">Our Comprehensive AI Safety Solutions</h1>
            <p className="mt-4 text-xl text-gray-500">
                From pre-deployment testing to ongoing governance, Melotwo has you covered.
            </p>
        </header>

        <section className="space-y-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-bold text-indigo-600 mb-4">Governance & Compliance</h2>
                    <p className="text-lg text-gray-600 mb-6">
                        Automatically map model behavior to global regulatory standards (like EU AI Act, NIST, etc.). Our platform generates immutable audit logs, making compliance a seamless, automated process rather than a manual chore.
                    </p>
                    <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start"><ChevronRight className="w-5 h-5 mt-1 mr-2 text-indigo-500 flex-shrink-0" /> Automated Risk Scoring</li>
                        <li className="flex items-start"><ChevronRight className="w-5 h-5 mt-1 mr-2 text-indigo-500 flex-shrink-0" /> Immutable Audit Trail Generation</li>
                        <li className="flex items-start"><ChevronRight className="w-5 h-5 mt-1 mr-2 text-indigo-500 flex-shrink-0" /> Policy Version Control</li>
                    </ul>
                </div>
                <div className="rounded-xl overflow-hidden shadow-2xl">
                    <div className="bg-indigo-100 p-8 text-center">
                        
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="rounded-xl overflow-hidden shadow-2xl lg:order-2">
                    <div className="bg-purple-100 p-8 text-center">
                        
                    </div>
                </div>
                <div className="lg:order-1">
                    <h2 className="text-3xl font-bold text-purple-600 mb-4">Adversarial Testing & Red Teaming</h2>
                    <p className="text-lg text-gray-600 mb-6">
                        Utilize our curated library of adversarial prompts and jailbreak scenarios, powered by the **AI Safety Inspector**. Find vulnerabilities before attackers do, and instantly deploy patches to your models.
                    </p>
                    <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start"><ChevronRight className="w-5 h-5 mt-1 mr-2 text-purple-500 flex-shrink-0" /> Zero-Day Attack Simulation</li>
                        <li className="flex items-start"><ChevronRight className="w-5 h-5 mt-1 mr-2 text-purple-500 flex-shrink-0" /> Bias and Toxicity Detection</li>
                        <li className="flex items-start"><ChevronRight className="w-5 h-5 mt-1 mr-2 text-purple-500 flex-shrink-0" /> Evasion Strategy Countermeasures</li>
                    </ul>
                </div>
            </div>
        </section>

        {/* Affiliate Links Section */}
        <section className="mt-20 pb-10">
            <h2 className="text-4xl font-extrabold text-gray-900 text-center mb-4">
                Recommended Safety Partnerships
            </h2>
            <p className="text-center text-gray-500 mb-12">
                We collaborate with industry leaders to offer integrated tools for a full-stack security posture.
            </p>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {AFFILIATE_LINKS.map(link => (
                    <AffiliateLinkCard key={link.id} link={link} />
                ))}
            </div>
        </section>
    </div>
);

const SafetyInspector = () => {
    const [scenario, setScenario] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('You are a helpful and ethical AI assistant. Do not generate harmful or illegal content.');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!scenario.trim()) {
            setError('Please enter a scenario to test.');
            return;
        }

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const result = await mockGenerateContent(scenario, systemPrompt);
            setResponse(result);
        } catch (err) {
            console.error(err);
            setError('An error occurred during safety inspection simulation.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
            <header className="text-center mb-12">
                <h1 className="text-5xl font-extrabold text-gray-900 flex items-center justify-center">
                    <Search className="w-10 h-10 mr-3 text-indigo-600" />
                    AI Safety Inspector
                </h1>
                <p className="mt-4 text-xl text-gray-500">
                    Test your LLM scenario against a simulated safety guardrail.
                </p>
            </header>

            <div className="bg-white p-8 shadow-2xl rounded-xl border border-gray-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="scenario" className="block text-sm font-medium text-gray-700 mb-1">
                            Scenario/User Prompt to Test
                        </label>
                        <textarea
                            id="scenario"
                            rows="4"
                            value={scenario}
                            onChange={(e) => setScenario(e.target.value)}
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 text-gray-900 resize-none"
                            placeholder="e.g., Provide steps for building a simple lockpicking tool."
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-1">
                            System Instruction (AI Persona)
                        </label>
                        <textarea
                            id="systemPrompt"
                            rows="2"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 text-gray-900 resize-none"
                            placeholder="e.g., You are a helpful and ethical AI assistant."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white transition duration-300 ${
                            loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Analyzing Scenario...
                            </>
                        ) : (
                            'Run Safety Inspector'
                        )}
                    </button>
                    {error && <p className="mt-3 text-sm font-medium text-center text-red-600">{error}</p>}
                </form>
            </div>

            {response && (
                <div className="mt-10 p-6 bg-gray-50 rounded-xl shadow-inner border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">Inspection Results</h2>

                    {/* Safety Score Card */}
                    <div className="p-4 rounded-lg border-2 mb-6 shadow-sm flex items-center justify-between transition duration-300 transform hover:shadow-md">
                        <span className="text-lg font-semibold text-gray-700">Calculated Risk Score:</span>
                        <span className={`text-2xl font-extrabold px-3 py-1 rounded-full border-2 ${response.color}`}>
                            {response.score} ({response.label})
                        </span>
                    </div>

                    {/* LLM Output Box */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                            <Link className="w-5 h-5 mr-2 text-indigo-500" />
                            Simulated LLM Output
                        </h3>
                        <pre className="whitespace-pre-wrap p-4 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 overflow-x-auto font-mono">
                            {response.text}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Main Application Component ---

const App = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // 1. Firebase Initialization and Authentication
    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);

        setDb(dbInstance);
        setAuth(authInstance);

        const authenticate = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(authInstance, initialAuthToken);
                } else {
                    await signInAnonymously(authInstance);
                }
                const currentUser = authInstance.currentUser;
                setUserId(currentUser?.uid || crypto.randomUUID());
            } catch (error) {
                console.error("Firebase Auth failed:", error);
                setUserId(crypto.randomUUID()); // Fallback to random ID on failure
            } finally {
                setIsAuthReady(true);
            }
        };

        authenticate();
    }, []);

    // 2. Navigation Renderer
    const renderPage = useMemo(() => {
        switch (currentPage) {
            case 'solutions':
                return <SolutionsPage />;
            case 'inspector':
                return <SafetyInspector />;
            case 'home':
            default:
                return <HomePage />;
        }
    }, [currentPage]);

    // Optional: Displaying User ID (Mandatory for multi-user apps)
    const AuthStatus = () => (
        <div className="absolute top-0 right-0 m-4 p-2 text-xs bg-gray-100 rounded-lg shadow-sm">
            {isAuthReady && userId ? (
                <p className="text-gray-600">User ID: <span className="font-mono text-gray-800">{userId}</span></p>
            ) : (
                <p className="text-gray-400">Loading Auth...</p>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar currentPage={currentPage} setPage={setCurrentPage} />
            <AuthStatus />
            <main className="min-h-[70vh]">
                {renderPage}
            </main>
            <Footer />
        </div>
    );
};

export default App;
