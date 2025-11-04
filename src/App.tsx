import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  Auth,
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  addDoc, 
  collection, 
  Firestore,
  // We don't use onSnapshot for the contact form, but typically use it for real-time data
} from 'firebase/firestore';


// --- TYPE DEFINITIONS ---
interface Product {
    id: number;
    name: string;
    category: 'Head Protection' | 'Monitoring' | 'Fall Protection' | 'Workwear';
    image: string;
    description: string;
    price: number;
    features: string[];
}
type ContactFormData = {
    name: string;
    email: string;
    company: string;
    inquiry: string;
    message: string;
};


// --- MOCK DATA ---

const NAV_ITEMS = [
  { name: 'Solutions', href: '#solutions' },
  { name: 'Products', href: '#products' },
  { name: 'Contact', href: '#contact' },
];

const SOLUTIONS_DATA = [
  // ... (unchanged)
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-highlight-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    ),
    title: 'Advanced Head & Face Protection',
    description: 'High-impact helmets, respirators, and face shields designed for extreme mining conditions, protecting against debris and dust.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-highlight-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 17a4 4 0 0 0-8 0M12 12V3M12 21h0"/></svg>
    ),
    title: 'Integrated Fall Arrest Systems',
    description: 'Certified harnesses, lanyards, and anchorage points ensuring maximum safety during work at height in vertical shafts and surface operations.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-highlight-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 0-7 17.07l.21.36.25.43c.3.52.88.8 1.48.8h10.12c.6 0 1.18-.28 1.48-.8l.25-.43.21-.36A10 10 0 0 0 12 2zM12 16h.01M12 12V8"/></svg>
    ),
    title: 'Gas & Air Quality Monitoring',
    description: 'Real-time detection equipment for hazardous gases (Methane, CO, H2S), providing instant alerts to mitigate underground risks.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-highlight-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"/><circle cx="12" cy="5" r="3"/><path d="M7 11V7M17 11V7"/></svg>
    ),
    title: 'High-Visibility Workwear',
    description: 'Durable, flame-resistant, and reflective apparel tailored for the demanding African climate, increasing visibility in low-light areas.',
  },
];

const PRODUCT_DATA: Product[] = [
  {
    id: 1,
    name: 'M40 High-Density Safety Helmet',
    category: 'Head Protection',
    image: 'https://placehold.co/400x300/003087/FFB81C?text=M40+HELMET',
    description: 'Designed with reinforced ABS polymer for superior impact resistance in underground operations. Features integrated lamp clips and comfort liner.',
    price: 45.99,
    features: ['High-impact ABS shell', '4-point chin strap', 'Adjustable suspension'],
  },
  {
    id: 2,
    name: 'Vortex Gas Detector (Multi-Sensor)',
    category: 'Monitoring',
    image: 'https://placehold.co/400x300/006D77/FFFFFF?text=VORTEX+GAS',
    description: 'Real-time simultaneous detection of CH4, CO, O2, and H2S. Intrinsically safe design suitable for hazardous zones.',
    price: 389.00,
    features: ['4-sensor detection', 'Intrinsically safe (IECEx)', '95dB audible alarm'],
  },
  {
    id: 3,
    name: 'Pro-Fit Fall Arrest Harness',
    category: 'Fall Protection',
    image: 'https://placehold.co/400x300/4A4A4A/FFB81C?text=HARNESS+KIT',
    description: 'Lightweight, durable polyester webbing with quick-connect buckles. Ideal for vertical mobility and confined space rescue.',
    price: 155.50,
    features: ['5-point adjustment', 'D-ring back attachment', 'Flame-resistant material'],
  },
  {
    id: 4,
    name: 'Hi-Viz FR Reflective Vest',
    category: 'Workwear',
    image: 'https://placehold.co/400x300/FFB81C/003087?text=HI-VIZ+VEST',
    description: 'High-visibility orange/yellow with premium reflective tape. Fire-resistant (FR) compliant for smelting and high-heat environments.',
    price: 29.99,
    features: ['Level 2 ANSI/ISEA', 'Aramid fiber stitching', 'Moisture-wicking mesh'],
  },
  {
    id: 5,
    name: 'Cut-Resistant Gloves (Level 5)',
    category: 'Workwear',
    image: 'https://placehold.co/400x300/003087/FFB81C?text=GLOVES',
    description: 'Durable nitrile-coated gloves offering maximum dexterity and ISO Level 5 cut resistance for heavy machinery handling.',
    price: 19.50,
    features: ['Nitrile coating', 'Level 5 cut resistance', 'Oil and chemical grip'],
  },
  {
    id: 6,
    name: 'Digital Noise Dosimeter',
    category: 'Monitoring',
    image: 'https://placehold.co/400x300/006D77/FFFFFF?text=NOISE+METER',
    description: 'Compact device for continuous monitoring of worker sound exposure, ensuring compliance with occupational health standards.',
    price: 210.00,
    features: ['Dose calculation', 'Data logging', 'Rechargeable battery'],
  },
];


// --- UTILITY COMPONENTS ---

// Simple Loading Spinner for the form submission
const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-highlight-yellow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


// --- SUB-COMPONENTS ---

/**
 * Navigation Bar Component
 */
const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-brand-blue shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand (White text on Deep Blue) */}
          <div className="flex-shrink-0">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              Melotwo<span className="text-highlight-yellow text-2xl font-medium">.</span>
            </span>
            <p className="hidden md:block text-xs text-gray-300 mt-0.5">African Mining Safety</p>
          </div>

          {/* Desktop Navigation Links (White text) */}
          <div className="hidden md:flex space-x-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-white hover:text-highlight-yellow transition duration-150 ease-in-out font-medium py-2"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Action Button (Safety Yellow) */}
          <div className="hidden md:block">
            <a href="#contact" className="px-6 py-2 bg-highlight-yellow text-brand-blue font-semibold rounded-full hover:bg-white hover:text-brand-blue transition duration-200 shadow-lg">
              Request Quote
            </a>
          </div>

          {/* Mobile Menu Button (Hamburger) */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-highlight-yellow hover:bg-brand-blue-700 focus:outline-none"
              aria-expanded={isOpen}
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {isOpen && (
        <div className="md:hidden pt-2 pb-3 space-y-1 px-2 transition-all duration-300 ease-in-out bg-white border-t border-gray-100">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-steel-gray hover:bg-gray-200 hover:text-brand-blue transition"
            >
              {item.name}
            </a>
          ))}
          <a href="#contact" className="block w-full mt-4 px-4 py-2 bg-highlight-yellow text-brand-blue text-center font-semibold rounded-lg hover:bg-brand-blue hover:text-white transition duration-200">
            Request Quote
          </a>
        </div>
      )}
    </nav>
  );
};

/**
 * Hero Section Component
 */
const HeroSection: React.FC = () => {
  // Placeholder image URL for safety in action
  const placeholderImage = "https://placehold.co/1200x800/dbeafe/003087?text=Safety+Gear+for+Mining";

  return (
    <header className="bg-white py-16 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
        
        {/* Left Content (Text) */}
        <div className="text-center md:text-left">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-brand-blue leading-tight">
            Certified Safety <br className="hidden sm:inline" /> 
            <span className="text-highlight-yellow block sm:inline">for African Mining</span>
          </h1>
          <p className="mt-6 text-lg text-steel-gray max-w-xl mx-auto md:mx-0">
            Melotwo delivers world-class, certified Protective Personal Equipment (PPE) and innovative safety solutions, tailored to the unique and demanding conditions of the African mining industry.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center md:justify-start gap-4">
            {/* Primary CTA: Request Quote (Safety Yellow) */}
            <a 
              href="#contact" 
              className="px-8 py-3 bg-highlight-yellow text-brand-blue font-bold rounded-full shadow-lg hover:bg-brand-blue hover:text-white transition duration-300 transform hover:scale-105"
            >
              Request Quote
            </a>
            {/* Secondary CTA: Download Catalog */}
            <a 
              href="#products" 
              className="px-8 py-3 text-brand-blue border-2 border-brand-blue font-semibold rounded-full hover:bg-brand-blue hover:text-white transition duration-300 transform hover:scale-105"
            >
              View Products
            </a>
          </div>
        </div>

        {/* Right Content (Image/Graphic) */}
        <div className="mt-12 md:mt-0 relative">
          <img 
            className="w-full h-auto rounded-xl shadow-2xl object-cover transform transition duration-500 hover:shadow-2xl hover:scale-[1.01]"
            src={placeholderImage} 
            alt="Safety gear for the mining industry"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; 
              target.src = "https://placehold.co/1200x800/dbeafe/003087?text=Melotwo+Safety";
            }}
          />
          {/* Certification Badge (Teal with white checkmark) */}
          <div className="absolute bottom-4 left-4 bg-cert-teal text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            ISO Certified & Compliant
          </div>
        </div>
      </div>
    </header>
  );
};

/**
 * Solutions/Features Section Component
 */
const SolutionsSection: React.FC = () => {
  return (
    <section id="solutions" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-brand-blue">
            The Melotwo Advantage: Safety Built for Africa
          </h2>
          <p className="mt-4 text-xl text-steel-gray max-w-3xl mx-auto">
            Our products meet the highest international standards while being engineered to withstand the toughest industrial and environmental demands on the continent.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {SOLUTIONS_DATA.map((solution, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 border-t-4 border-brand-blue"
            >
              <div className="flex items-center justify-start gap-4">
                {/* Product Photos: Yellow highlight on key PPE features -> represented by the icon color */}
                {solution.icon}
                <h3 className="text-xl font-bold text-brand-blue">{solution.title}</h3>
              </div>
              <p className="mt-4 text-steel-gray">{solution.description}</p>
              <a 
                href="#products" 
                className="mt-4 inline-flex items-center text-cert-teal font-semibold hover:text-brand-blue transition"
              >
                View Products
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/**
 * Product Catalog Section
 */
const ProductSection: React.FC = () => {
    const categories = useMemo(() => Array.from(new Set(PRODUCT_DATA.map(p => p.category))), []);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    const filteredProducts = useMemo(() => {
        if (selectedCategory === 'All') {
            return PRODUCT_DATA;
        }
        return PRODUCT_DATA.filter(p => p.category === selectedCategory);
    }, [selectedCategory]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(price);
    };

    return (
        <section id="products" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-brand-blue">
                        Our Certified PPE & Safety Catalogue
                    </h2>
                    <p className="mt-4 text-xl text-steel-gray max-w-3xl mx-auto">
                        Browse our full range of high-quality, internationally compliant products designed for harsh African conditions.
                    </p>
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {['All', ...categories].map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-5 py-2 text-sm font-semibold rounded-full transition duration-200 shadow-md ${
                                selectedCategory === category 
                                    ? 'bg-highlight-yellow text-brand-blue' 
                                    : 'bg-gray-100 text-steel-gray hover:bg-gray-200'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {filteredProducts.map((product) => (
                        <div 
                            key={product.id} 
                            className="bg-gray-50 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 border border-gray-100"
                        >
                            <img 
                                src={product.image} 
                                alt={product.name} 
                                // REVERTED: Changing from h-64 back to h-56 for a more balanced widget size.
                                className="w-full h-56 object-cover border-b-4 border-highlight-yellow" 
                            />
                            <div className="p-6">
                                <span className="text-xs font-medium text-cert-teal uppercase tracking-wider">{product.category}</span>
                                <h3 className="mt-1 text-2xl font-bold text-brand-blue">{product.name}</h3>
                                <p className="mt-3 text-steel-gray text-sm">{product.description}</p>
                                
                                <ul className="mt-4 text-sm space-y-1 text-steel-gray">
                                    {product.features.map((feature, i) => (
                                        <li key={i} className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-highlight-yellow flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200">
                                    <span className="text-3xl font-extrabold text-brand-blue">{formatPrice(product.price)}</span>
                                    <a 
                                        href="#contact" 
                                        className="px-4 py-2 bg-highlight-yellow text-brand-blue text-sm font-bold rounded-full hover:bg-brand-blue hover:text-white transition"
                                    >
                                        Inquire
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/**
 * Contact Form Section Component - Now integrated with Firestore
 */
const ContactSection: React.FC<{ db: Firestore | null; userId: string | null; appId: string }> = ({ db, userId, appId }) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    company: '',
    inquiry: 'quote',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setIsSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check if Firestore is ready
    if (!db || !userId) {
        setError('Database connection is not ready. Please wait a moment and try again.');
        return;
    }

    // Simple validation
    if (!formData.name || !formData.email || !formData.company || !formData.message) {
        setError('Please fill in all required fields (Name, Email, Company, Message).');
        return;
    }

    setIsLoading(true);

    try {
        // Construct the collection path for private user data
        const collectionPath = `artifacts/${appId}/users/${userId}/contact_inquiries`;
        const inquiriesCollection = collection(db, collectionPath);

        // Add the contact form data to the collection
        await addDoc(inquiriesCollection, {
            ...formData,
            submittedAt: new Date().toISOString(), // Use ISO string for universal time
            userId: userId,
        });

        console.log("Inquiry successfully saved to Firestore.");
        setIsSubmitted(true);
        // Clear form data after success
        setFormData({ name: '', email: '', company: '', inquiry: 'quote', message: '' });

    } catch (err) {
        console.error("Error saving document to Firestore: ", err);
        setError('Failed to submit your request. Please check your connection and try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-brand-blue">
            Request a Quote or Consultation
          </h2>
          <p className="mt-4 text-xl text-steel-gray">
            Let's discuss how Melotwo can enhance the safety and compliance of your mining operations.
          </p>
          {userId && (
            <p className="mt-4 text-sm text-gray-500">
                Your user ID is: <code className="bg-gray-200 p-1 rounded font-mono">{userId}</code>
            </p>
          )}
        </div>

        <div className="bg-gray-50 p-8 md:p-12 rounded-xl shadow-2xl border-t-8 border-highlight-yellow">
            
            {/* Form Feedback */}
            {isSubmitted && (
                <div className="mb-6 p-4 bg-cert-teal/10 text-cert-teal border border-cert-teal rounded-lg font-semibold">
                    Thank you! Your inquiry has been received and logged. A Melotwo specialist will contact you shortly.
                </div>
            )}
            {error && (
                <div className="mb-6 p-4 bg-red-100 text-red-700 border border-red-400 rounded-lg font-semibold">
                    Error: {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Form Fields... (unchanged) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-steel-gray mb-1">Full Name *</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue transition duration-150"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-steel-gray mb-1">Work Email *</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue transition duration-150"
                            placeholder="john.doe@mineco.com"
                        />
                    </div>
                </div>

                {/* Company and Inquiry Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="company" className="block text-sm font-medium text-steel-gray mb-1">Company Name *</label>
                        <input
                            type="text"
                            name="company"
                            id="company"
                            value={formData.company}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue transition duration-150"
                            placeholder="MineCo Ltd."
                        />
                    </div>
                    <div>
                        <label htmlFor="inquiry" className="block text-sm font-medium text-steel-gray mb-1">Type of Inquiry</label>
                        <select
                            name="inquiry"
                            id="inquiry"
                            value={formData.inquiry}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-brand-blue focus:border-brand-blue transition duration-150"
                        >
                            <option value="quote">Request a Quote (PPE / Product)</option>
                            <option value="consultation">Safety Consultation Service</option>
                            <option value="partnership">Partnership / Distribution</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                {/* Message */}
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-steel-gray mb-1">Your Message *</label>
                    <textarea
                        name="message"
                        id="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue transition duration-150"
                        placeholder="Please tell us about your requirements, project details, or specific safety concerns..."
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading || !db}
                    className="w-full flex items-center justify-center px-8 py-3 bg-brand-blue text-white font-bold rounded-full shadow-lg hover:bg-brand-blue/90 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <LoadingSpinner />
                            Sending Inquiry...
                        </>
                    ) : (
                        'Submit Request'
                    )}
                </button>
            </form>
        </div>
      </div>
    </section>
  );
};


// --- Main App Component ---

/**
 * The main component that renders the entire application structure.
 */
export const App: React.FC = () => {
    const [db, setDb] = useState<Firestore | null>(null);
    const [auth, setAuth] = useState<Auth | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    // 1. Initialize Firebase and set up Auth
    useEffect(() => {
        if (Object.keys(firebaseConfig).length === 0) {
            console.error("Firebase config is missing.");
            setIsFirebaseLoading(false);
            return;
        }

        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestore);
        setAuth(firebaseAuth);

        // Authenticate the user
        const authenticate = async (authInstance: Auth) => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(authInstance, initialAuthToken);
                } else {
                    await signInAnonymously(authInstance);
                }
            } catch (error) {
                console.error("Firebase Authentication Error:", error);
            }
        };

        authenticate(firebaseAuth);

        // Set up Auth State Listener
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            if (user) {
                // User is signed in, get UID
                setUserId(user.uid);
            } else {
                // User is signed out or anonymous
                setUserId('anonymous-' + crypto.randomUUID()); // Fallback unique ID
            }
            setIsFirebaseLoading(false);
        });

        return () => unsubscribe();
    }, [initialAuthToken, appId, JSON.stringify(firebaseConfig)]);

    if (isFirebaseLoading) {
        return (
             <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="flex items-center text-brand-blue text-lg font-semibold">
                    <LoadingSpinner />
                    Loading Melotwo Platform...
                </div>
            </div>
        );
    }

    return (
      <div className="min-h-screen bg-white font-sans">
        
        <Navbar />
        <main>
          <HeroSection />
          <SolutionsSection />
          
          {/* New Product Catalog Section */}
          <ProductSection />

          {/* Contact Section, now passing Firestore instances */}
          <ContactSection db={db} userId={userId} appId={appId} />

        </main>

        {/* Basic Footer */}
        <footer className="bg-brand-blue text-gray-300 py-10 mt-12">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-highlight-yellow">Melotwo</h4>
              <p className="text-sm">Certified Safety Solutions for the African Mining Industry.</p>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                {NAV_ITEMS.map(item => (
                  <li key={`footer-${item.name}`}>
                    <a href={item.href} className="hover:text-highlight-yellow transition">{item.name}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white mb-3">Contact</h4>
              <p className="text-sm">sales@melotwo.com</p>
              <p className="text-sm">+(27) 10 549 0000</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-bold text-white mb-3">Compliance</h4>
              <p className="text-sm">ISO 45001 Certified</p>
              <p className="text-sm">Local Regulatory Compliant</p>
            </div>
          </div>
          <div className="text-center text-xs mt-8 border-t border-brand-blue-500 pt-4">
              &copy; {new Date().getFullYear()} Melotwo. All rights reserved.
          </div>
        </footer>
      </div>
    );
};

export default App;
