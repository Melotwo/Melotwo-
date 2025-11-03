import React, { useState, useEffect, FormEvent } from 'react';
import ReactDOM from 'react-dom/client';
// CRITICAL: Ensure this path is correct and points to App.tsx in the same directory.
import App from './App.tsx'; 

// FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, Auth, User } from 'firebase/auth';
import { getFirestore, Firestore, doc, setDoc, onSnapshot, DocumentData } from 'firebase/firestore';

// --- CONSTANTS ---
const KLYVIO_LIST_ID = 'UpJTAe';
const KLYVIO_ACCOUNT_ID = 'uWuecH';
const AFFILIATE_LINK = 'https://www.mineafricasafetysolutions.com/catalog?affiliate_id=pPuyfECz9SHZrRc3w6zFwfW2f5yYo8LiN2hys3dTZKlSJrY2ypA72w21manwCKOA';
const currentYear = new Date().getFullYear().toString();

// -------------------------------------------------------------------------
// MANDATORY: TypeScript declarations for the global variables provided by the Canvas environment
// -------------------------------------------------------------------------
declare const __app_id: string | undefined;
declare const __firebase_config: string | undefined;
declare const __initial_auth_token: string | undefined;

/**
 * Utility function for exponential backoff on fetch.
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);

            // Only retry on Server errors (5xx)
            if (response.status >= 500 && i < retries - 1) {
                throw new Error(`Server error: ${response.status}`);
            }

            return response;
        } catch (error: unknown) {
            if (i < retries - 1) {
                const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s, delay
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
    throw new Error('Fetch failed after multiple retries.');
}

// -------------------------------------------------------------------------
// Data Interfaces (Required for robust TypeScript)
// -------------------------------------------------------------------------
interface Product {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
}

interface CartItem extends Product {
    quantity: number;
}

interface Cart {
    items: CartItem[];
    subtotal: number;
    shipping: number;
    total: number;
}

export interface AppContextType {
    db: Firestore | null;
    auth: Auth | null;
    userId: string | null;
    currentCart: Cart | null;
    isAuthReady: boolean;
    appId: string;
    message: string | null;
    success: boolean;
    addProductToCart: (product: Product) => void;
    updateCartItemQuantity: (productId: number, delta: number) => void;
    removeProductFromCart: (productId: number) => void;
    handleCheckout: () => void;
    setEmail: React.Dispatch<React.SetStateAction<string>>;
    setMessage: React.Dispatch<React.SetStateAction<string | null>>;
    setSuccess: React.Dispatch<React.SetStateAction<boolean>>;
}

const defaultCart: Cart = {
    items: [],
    subtotal: 0,
    shipping: 0,
    total: 0,
};

// -------------------------------------------------------------------------
// Global Variable Handling and Firebase Setup
// -------------------------------------------------------------------------

// Set up the Firebase configuration variables from the global context
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
// We parse the stringified JSON config, falling back to an empty object
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : undefined;


// -------------------------------------------------------------------------
// Main App Provider Component (Handles State and Firebase Logic)
// -------------------------------------------------------------------------

function AppProvider() {
    const [db, setDb] = useState<Firestore | null>(null);
    const [auth, setAuth] = useState<Auth | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentCart, setCurrentCart] = useState<Cart | null>(null);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // 1. Initialize Firebase and Authenticate User
    useEffect(() => {
        if (Object.keys(firebaseConfig).length === 0) {
             console.error('Firebase configuration is missing.');
             // Set auth ready state to continue app function without persistence
             setIsAuthReady(true);
             return;
        }

        try {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const authInstance = getAuth(app);

            setDb(firestore);
            setAuth(authInstance);

            const unsubscribe = authInstance.onAuthStateChanged(async (user: User | null) => {
                // If a user is not logged in, attempt to sign in using the provided token or anonymously
                if (!user) {
                    try {
                        if (initialAuthToken) {
                            const userCredential = await signInWithCustomToken(authInstance, initialAuthToken);
                            setUserId(userCredential.user.uid);
                        } else {
                            // Fallback to anonymous sign-in if no token is available
                            const userCredential = await signInAnonymously(authInstance);
                            setUserId(userCredential.user.uid);
                        }
                    } catch (error) {
                        console.error("Firebase Auth Error:", error);
                        // If authentication fails, create a random UUID as a temporary placeholder userId
                        setUserId(crypto.randomUUID());
                    }
                } else {
                    setUserId(user.uid);
                }
                setIsAuthReady(true);
            });

            // Cleanup subscription on unmount
            return () => unsubscribe();
        } catch (error) {
            console.error("Firebase Initialization Error:", error);
            // If initialization fails, fall back to a random UUID
            setUserId(crypto.randomUUID());
            setIsAuthReady(true);
        }
    }, [initialAuthToken]); 

    // 2. Cart Data Listener (Real-time updates)
    useEffect(() => {
        if (db && userId && isAuthReady) {
            // The path for private user data: /artifacts/{appId}/users/{userId}/cart/current
            const cartDocRef = doc(db, 'artifacts', appId, 'users', userId, 'cart', 'current');

            const unsubscribe = onSnapshot(
                cartDocRef,
                (docSnap: DocumentData) => {
                    const data = docSnap.data();
                    // Initialize with default cart structure if data is missing or empty
                    const fetchedCart: Cart = data && data.cart ? data.cart : defaultCart; 

                    // Ensure items is an array of CartItem structure
                    const validatedItems: CartItem[] = (fetchedCart.items || []).map((item: any) => ({
                        id: item.id || 0,
                        name: item.name || 'Unknown',
                        price: item.price || 0,
                        quantity: item.quantity || 0,
                        imageUrl: item.imageUrl || 'https://placehold.co/50x50/334155/ffffff?text=N/A'
                    }));


                    // Calculate totals from the fetched items 
                    const subtotal = validatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
                    const shipping = subtotal > 1000 ? 0 : 50; // Example rule: Free shipping over $1000
                    const total = subtotal + shipping;

                    setCurrentCart({
                        items: validatedItems,
                        subtotal,
                        shipping,
                        total,
                    });
                },
                (error: Error) => {
                    console.error("Error listening to cart changes:", error);
                    setCurrentCart(defaultCart);
                }
            );

            return () => unsubscribe();
        } else if (isAuthReady && !userId) {
             // If we failed to get a user ID, set a default empty cart
             setCurrentCart(defaultCart);
        }
    }, [db, userId, isAuthReady, appId]);

    // 3. Cart Management Functions
    const saveCartToFirestore = async (newCart: Cart) => {
        if (db && userId) {
            try {
                const cartDocRef = doc(db, 'artifacts', appId, 'users', userId, 'cart', 'current');
                await setDoc(cartDocRef, { cart: newCart }, { merge: true });
            } catch (error) {
                console.error("Error saving cart to Firestore:", error);
                setMessage("An error occurred while saving your cart.");
                setSuccess(false);
            }
        } else {
            console.warn("Firestore not ready. Cannot save cart.");
        }
    };

    const addProductToCart = (product: Product) => {
        const cart = currentCart || defaultCart;
        const existingItem = cart.items.find((item) => item.id === product.id);

        let updatedItems: CartItem[];

        if (existingItem) {
            // Item exists, update quantity
            updatedItems = cart.items.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
        } else {
            // Item is new, add it
            updatedItems = [...cart.items, { ...product, quantity: 1 }];
        }

        const newCart: Cart = { ...defaultCart, items: updatedItems };
        saveCartToFirestore(newCart);
        setMessage(`${product.name} added to cart!`);
        setSuccess(true);
    };

    const updateCartItemQuantity = (productId: number, delta: number) => {
        const cart = currentCart || defaultCart;
        const updatedItems = cart.items
            .map((item) =>
                item.id === productId ? { ...item, quantity: item.quantity + delta } : item
            )
            .filter((item) => item.quantity > 0); 

        const newCart: Cart = { ...defaultCart, items: updatedItems };
        saveCartToFirestore(newCart);
    };

    const removeProductFromCart = (productId: number) => {
        const cart = currentCart || defaultCart;
        const updatedItems = cart.items.filter((item) => item.id !== productId);

        const removedItem = cart.items.find((item) => item.id === productId);

        const newCart: Cart = { ...defaultCart, items: updatedItems };
        saveCartToFirestore(newCart);
        setMessage(`${removedItem?.name || 'Item'} removed from cart.`);
        setSuccess(true);
    };

    const handleCheckout = () => {
        const cart = currentCart || defaultCart;

        if (cart.items.length === 0) {
            setMessage("Your cart is empty. Please add items before checking out.");
            setSuccess(false);
            return;
        }

        // Generate the simulated checkout link with cart data
        const productList = cart.items.map(item => `${item.id}:${item.quantity}`).join(',');
        const checkoutUrl = `${AFFILIATE_LINK}&cart_items=${productList}&currency=USD&total=${cart.total}`;

        // Clear the cart after "checkout" (simulated)
        const emptyCart: Cart = { ...defaultCart, items: [] };
        saveCartToFirestore(emptyCart);

        // Redirect the user
        window.open(checkoutUrl, '_blank');

        setMessage(`Checkout complete! Redirecting you to the affiliate link...`);
        setSuccess(true);
    };

    // 4. Handle email signup to Klaviyo (simulated)
    const handleEmailSignup = async (e: FormEvent) => {
        e.preventDefault();
        if (!email) {
            setMessage("Please enter a valid email address.");
            setSuccess(false);
            return;
        }

        const klaviyoUrl = `https://a.klaviyo.com/api/v2/list/${KLYVIO_LIST_ID}/subscribe?api_key=${KLYVIO_ACCOUNT_ID}`;
        const data = {
            profiles: [{ email }],
        };

        setMessage("Subscribing...");

        try {
            const response = await fetchWithRetry(klaviyoUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            
            if (response.ok) {
                 setMessage("Thank you for subscribing! Check your email for a special offer.");
                 setSuccess(true);
                 setEmail('');
            } else {
                 const errorData = await response.json();
                 const errorMessage = errorData.detail || `Subscription failed with status ${response.status}. Please try again.`;
                 setMessage(errorMessage);
                 setSuccess(false);
            }
        } catch (error) {
            console.error('Klaviyo Subscription Error:', error);
            setMessage("Subscription failed due to a network error. Please try again later.");
            setSuccess(false);
        }
    };

    // --- Component Rendering ---

    if (!isAuthReady || currentCart === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-xl">
                    <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-gray-700">Loading Melotwo website...</p>
                    <p className="text-xs text-gray-500 mt-1">(Initializing Firebase)</p>
                </div>
            </div>
        );
    }

    const contextValue: AppContextType = {
        db,
        auth,
        userId,
        currentCart,
        isAuthReady,
        appId,
        message,
        success,
        addProductToCart,
        updateCartItemQuantity,
        removeProductFromCart,
        handleCheckout,
        setEmail,
        setMessage,
        setSuccess,
    };

    return (
        <React.StrictMode>
            {/* The main App component receives all the state and handlers via props */}
            <App
                context={contextValue}
                handleEmailSignup={handleEmailSignup}
                email={email}
                currentYear={currentYear}
            />
        </React.StrictMode>
    );
}

// Render the main provider component into the DOM
ReactDOM.createRoot(document.getElementById('root')!).render(
    <AppProvider />
);
