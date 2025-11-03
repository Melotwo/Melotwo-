import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShoppingCart, X, Plus, Minus, CreditCard, Loader, User } from 'lucide-react';

// Firebase Imports (using CDN style imports for single file environment)
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';

// Define the product type (for reference)
// interface Product { id: number; name: string; price: number; image: string; }

// Define the cart item type, which extends Product but includes quantity (for reference)
// interface CartItem extends Product { quantity: number; }

// Mock Product Data
const PRODUCTS = [
  { id: 1, name: "Heavy Duty Gloves", price: 29.99, image: "https://placehold.co/128x128/333333/FFFFFF?text=GLOVE" },
  { id: 2, name: "Safety Helmet (Type A)", price: 45.50, image: "https://placehold.co/128x128/333333/FFFFFF?text=HELMET" },
  { id: 3, name: "Reflective Vest", price: 19.00, image: "https://placehold.co/128x128/333333/FFFFFF?text=VEST" },
  { id: 4, name: "Steel Toe Boots", price: 99.75, image: "https://placehold.co/128x128/333333/FFFFFF?text=BOOTS" },
];

// --- Firebase Setup and Utilities ---

// Access global variables safely
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const FIREBASE_CONFIG = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const INITIAL_AUTH_TOKEN = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

/**
 * Saves the current cart to Firestore.
 * @param {object} db Firestore instance
 * @param {string} userId Current user ID
 * @param {Array<object>} currentCart The cart array to save
 */
const saveCartToFirestore = async (db, userId, currentCart) => {
  if (!db || !userId) return;
  try {
    // Path: /artifacts/{APP_ID}/users/{userId}/carts/mainCart
    const cartRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'carts', 'mainCart');
    await setDoc(cartRef, { items: currentCart, lastUpdated: new Date() });
    console.log("Cart saved to Firestore.");
  } catch (error) {
    console.error("Error writing document: ", error);
  }
};

// Main App Component
const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseMessage, setPurchaseMessage] = useState(null);

  // 1. Initialize Firebase and Authenticate User
  useEffect(() => {
    if (Object.keys(FIREBASE_CONFIG).length === 0) {
      console.error("Firebase config is missing.");
      // Stop loading if config is missing to prevent infinite loading state
      setIsLoading(false); 
      return;
    }

    try {
      const app = initializeApp(FIREBASE_CONFIG);
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);

      setAuth(authInstance);
      setDb(dbInstance);

      const authenticate = async () => {
        try {
          if (INITIAL_AUTH_TOKEN) {
            await signInWithCustomToken(authInstance, INITIAL_AUTH_TOKEN);
          } else {
            await signInAnonymously(authInstance);
          }
        } catch (error) {
          console.error("Firebase Authentication failed:", error);
          // Fallback to anonymous if custom token fails
          await signInAnonymously(authInstance);
        }
      };
      
      authenticate();

      const unsubscribe = onAuthStateChanged(authInstance, (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          // If sign-in failed or signed out, use a random ID as fallback
          setUserId(crypto.randomUUID()); 
        }
      });

      return () => unsubscribe(); // Cleanup auth listener
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      setIsLoading(false);
    }
  }, []);

  // 2. Real-time Cart Listener (onSnapshot)
  useEffect(() => {
    if (!db || !userId) return;

    // Path: /artifacts/{APP_ID}/users/{userId}/carts/mainCart
    const cartRef = doc(db, 'artifacts', APP_ID, 'users', userId, 'carts', 'mainCart');

    const unsubscribe = onSnapshot(cartRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCart(data.items || []);
      } else {
        // Document does not exist, initialize with an empty cart
        setCart([]);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error reading cart from Firestore:", error);
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup snapshot listener
  }, [db, userId]);


  // Helper function to update cart state locally and save to Firestore
  const updateCartAndSave = useCallback((newCart) => {
    setCart(newCart);
    if (db && userId) {
      saveCartToFirestore(db, userId, newCart);
    }
  }, [db, userId]);


  // --- Cart Modification Logic (now updates Firestore) ---

  const addToCart = useCallback((product) => {
    setPurchaseMessage(null); // Clear message on new action
    const existingItem = cart.find(item => item.id === product.id);

    let newCart;
    if (existingItem) {
      newCart = cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }
    updateCartAndSave(newCart);
  }, [cart, updateCartAndSave]);

  const updateQuantity = useCallback((productId, delta) => {
    const newCart = cart.reduce((acc, item) => {
      if (item.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity > 0) {
          acc.push({ ...item, quantity: newQuantity });
        }
      } else {
        acc.push(item);
      }
      return acc;
    }, []);
    updateCartAndSave(newCart);
  }, [cart, updateCartAndSave]);

  const removeItem = useCallback((productId) => {
    const newCart = cart.filter(item => item.id !== productId);
    updateCartAndSave(newCart);
  }, [cart, updateCartAndSave]);

  // Calculations (Use useMemo for performance)
  const { subtotal, totalItems, tax, total } = useMemo(() => {
    const sub = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const items = cart.reduce((sum, item) => sum + item.quantity, 0);
    const taxRate = 0.15; // Example 15% VAT/Sales Tax
    const calculatedTax = sub * taxRate;
    const calculatedTotal = sub + calculatedTax;
    return {
      subtotal: sub,
      totalItems: items,
      tax: calculatedTax,
      total: calculatedTotal
    };
  }, [cart]);


  // Handle the final purchase action
  const handlePurchase = async () => {
    if (cart.length === 0) {
      setPurchaseMessage("Your cart is empty. Please add items before checking out.");
      return;
    }

    // Simulate successful purchase and clear the cart in Firestore
    setPurchaseMessage(`Purchase successful! Your total was $${total.toFixed(2)}. ${totalItems} items are on their way.`);
    
    // Clear the cart in Firestore
    await updateCartAndSave([]);
  };

  // --- Child Components ---

  // Component to render individual Product Cards
  const ProductCard = ({ product }) => (
    <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center space-y-3 transform hover:scale-[1.02] active:scale-100">
      <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-md border border-gray-100" onError={(e) => e.target.src = `https://placehold.co/128x128/333333/FFFFFF?text=${product.name.split(' ')[0]}`}/>
      <h3 className="text-lg font-semibold text-gray-800 text-center">{product.name}</h3>
      <p className="text-xl font-bold text-green-600">${product.price.toFixed(2)}</p>
      <button
        onClick={() => addToCart(product)}
        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-all duration-200 flex items-center justify-center text-sm transform hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        <Plus size={16} className="mr-2" /> Add to Cart
      </button>
    </div>
  );

  // Component to render individual Cart Rows
  const CartRow = ({ item }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
      <div className="flex items-start space-x-3 w-3/5">
        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" onError={(e) => e.target.src = `https://placehold.co/48x48/333333/FFFFFF?text=Item`}/>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-gray-800 line-clamp-2">{item.name}</span>
          <span className="text-sm text-gray-500">${item.price.toFixed(2)} ea</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-2/5 justify-end">
        {/* Quantity Controls */}
        <div className="flex items-center border border-gray-300 rounded-lg bg-white">
          <button
            onClick={() => updateQuantity(item.id, -1)}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors duration-100 disabled:opacity-50"
            aria-label={`Decrease quantity of ${item.name}`}
            disabled={item.quantity <= 1}
          >
            <Minus size={16} />
          </button>
          <span className="px-2 w-8 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.id, 1)}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors duration-100"
            aria-label={`Increase quantity of ${item.name}`}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Subtotal and Remove Button */}
        <div className="flex items-center space-x-2 ml-4">
          <span className="font-bold text-base text-gray-900 w-16 text-right hidden sm:inline">${(item.price * item.quantity).toFixed(2)}</span>
          <button
            onClick={() => removeItem(item.id)}
            className="p-1 text-red-500 hover:bg-red-100 rounded-full transition-colors duration-100"
            aria-label={`Remove ${item.name} from cart`}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-3 p-8 bg-white rounded-xl shadow-xl">
          <Loader size={32} className="animate-spin text-blue-600" />
          <p className="text-lg font-medium text-gray-700">Loading Store and Cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-lg z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight">
            👷 PPE Secure Store
          </h1>
          <div className="flex items-center space-x-4">
            {userId && (
              <div className="flex items-center text-xs sm:text-sm text-gray-600 bg-gray-100 p-2 rounded-lg shadow-inner">
                <User size={16} className="mr-2 text-gray-500 hidden sm:inline" />
                <span className="font-medium">User ID:</span> 
                <span className="ml-1 truncate max-w-[100px] sm:max-w-none font-mono">{userId}</span>
              </div>
            )}
            <span className="relative">
              <ShoppingCart className="text-gray-600" size={28} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center ring-2 ring-white shadow-md">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          
          {/* Product Grid (2/3 width on desktop) */}
          <section className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-extrabold text-gray-800 pb-4 border-b-4 border-blue-100">Essential Safety Gear</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {PRODUCTS.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          {/* Shopping Cart Sidebar (1/3 width on desktop) */}
          <aside className="lg:col-span-1 mt-10 lg:mt-0 sticky top-28 h-fit">
            <div className="bg-white p-6 rounded-2xl shadow-3xl border border-gray-200 space-y-6">
              
              <h2 className="text-2xl font-bold text-gray-900 flex items-center pb-2 border-b">
                <ShoppingCart size={24} className="mr-2 text-blue-600" />
                Your Cart
              </h2>

              {/* Purchase Message */}
              {purchaseMessage && (
                <div className={`p-4 rounded-xl text-base font-semibold ${cart.length === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {purchaseMessage}
                </div>
              )}

              {/* Cart Items List */}
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-gray-500 py-6 text-center italic">Your persistent cart is empty. Start shopping!</p>
                ) : (
                  cart.map(item => <CartRow key={item.id} item={item} />)
                )}
              </div>

              {/* Summary and Checkout */}
              <div className="pt-4 border-t border-gray-300 space-y-3">
                <div className="flex justify-between font-medium text-gray-700">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium text-gray-700">
                  <span>Tax (15%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-xl text-gray-900 pt-3 border-t border-gray-300">
                  <span>Order Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={cart.length === 0}
                  className="w-full py-3 mt-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-green-300"
                >
                  <CreditCard size={20} />
                  <span>Proceed to Checkout</span>
                </button>
              </div>

            </div>
          </aside>
        </div>
      </main>

    </div>
  );
};

export default App;
