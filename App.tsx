import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, X, Plus, Minus, CreditCard } from 'lucide-react';

// Define the product type
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

// Define the cart item type, which extends Product but includes quantity
interface CartItem extends Product {
  quantity: number;
}

// Mock Product Data
const PRODUCTS: Product[] = [
  { id: 1, name: "Heavy Duty Gloves", price: 29.99, image: "https://placehold.co/128x128/333333/FFFFFF?text=GLOVE" },
  { id: 2, name: "Safety Helmet (Type A)", price: 45.50, image: "https://placehold.co/128x128/333333/FFFFFF?text=HELMET" },
  { id: 3, name: "Reflective Vest", price: 19.00, image: "https://placehold.co/128x128/333333/FFFFFF?text=VEST" },
  { id: 4, name: "Steel Toe Boots", price: 99.75, image: "https://placehold.co/128x128/333333/FFFFFF?text=BOOTS" },
];

// Main App Component
const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);

  // Calculate Subtotal and Total Items
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const taxRate = 0.15; // Example 15% VAT/Sales Tax
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Function to add or increment item quantity in cart
  const addToCart = useCallback((product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        // Increment quantity if item exists
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        // Add new item if it doesn't exist
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    // Clear any previous purchase message
    setPurchaseMessage(null); 
  }, []);

  // Function to remove an item completely
  const removeItem = useCallback((productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  // Function to update item quantity (for plus/minus buttons)
  const updateQuantity = useCallback((productId: number, delta: 1 | -1) => {
    setCart(prevCart => {
      return prevCart.reduce((acc, item) => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity > 0) {
            acc.push({ ...item, quantity: newQuantity });
          }
          // If newQuantity is 0, we just filter it out by not pushing to acc.
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as CartItem[]);
    });
  }, []);

  // Handle the final purchase action
  const handlePurchase = () => {
    if (cart.length === 0) {
      setPurchaseMessage("Your cart is empty. Please add items before checking out.");
      return;
    }

    // Simulate successful purchase and clear the cart
    setPurchaseMessage(`Purchase successful! Your total was $${total.toFixed(2)}. ${totalItems} items are on their way.`);
    setCart([]);
  };

  // Component to render individual Product Cards
  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <div className="bg-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center space-y-3">
      <img src={product.image} alt={product.name} className="w-24 h-24 object-cover rounded-md border border-gray-100" />
      <h3 className="text-lg font-semibold text-gray-800 text-center">{product.name}</h3>
      <p className="text-xl font-bold text-green-600">${product.price.toFixed(2)}</p>
      <button
        onClick={() => addToCart(product)}
        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center text-sm"
      >
        <Plus size={16} className="mr-2" /> Add to Cart
      </button>
    </div>
  );

  // Component to render individual Cart Rows
  const CartRow: React.FC<{ item: CartItem }> = ({ item }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
      <div className="flex items-start space-x-3 w-3/5">
        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
        <div className="flex flex-col">
          <span className="font-medium text-gray-800 line-clamp-2">{item.name}</span>
          <span className="text-sm text-gray-500">${item.price.toFixed(2)} each</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-2/5 justify-end">
        {/* Quantity Controls */}
        <div className="flex items-center border border-gray-300 rounded-lg">
          <button
            onClick={() => updateQuantity(item.id, -1)}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors duration-100"
            aria-label={`Decrease quantity of ${item.name}`}
          >
            <Minus size={16} />
          </button>
          <span className="px-2 w-8 text-center text-sm font-semibold">{item.quantity}</span>
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
          <span className="font-bold text-base text-gray-900 w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
          <button
            onClick={() => removeItem(item.id)}
            className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors duration-100"
            aria-label={`Remove ${item.name} from cart`}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            PPE Store
          </h1>
          <div className="flex items-center space-x-4">
            <span className="relative">
              <ShoppingCart className="text-gray-600" size={24} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          
          {/* Product Grid (2/3 width on desktop) */}
          <section className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-bold text-gray-800 border-b pb-2 mb-4">Safety Products</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {PRODUCTS.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          {/* Shopping Cart Sidebar (1/3 width on desktop) */}
          <aside className="lg:col-span-1 mt-10 lg:mt-0 sticky top-20">
            <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 space-y-6">
              
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <ShoppingCart size={24} className="mr-2 text-blue-600" />
                Shopping Cart ({totalItems})
              </h2>

              {/* Purchase Message */}
              {purchaseMessage && (
                <div className={`p-3 rounded-lg text-sm font-medium ${cart.length === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {purchaseMessage}
                </div>
              )}

              {/* Cart Items List */}
              <div className="divide-y divide-gray-100">
                {cart.length === 0 ? (
                  <p className="text-gray-500 py-4 text-center">Your cart is empty.</p>
                ) : (
                  cart.map(item => <CartRow key={item.id} item={item} />)
                )}
              </div>

              {/* Summary and Checkout */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex justify-between font-medium text-gray-700">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium text-gray-700">
                  <span>Tax ({(taxRate * 100).toFixed(0)}%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-xl text-gray-900 pt-2 border-t border-gray-300">
                  <span>Order Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={cart.length === 0}
                  className="w-full py-3 mt-4 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
