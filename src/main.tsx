import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { Menu, X, ChevronRight, Home, Users, DollarSign, FileText, Mail, MessageSquare, Briefcase, Award, Phone } from 'lucide-react';

// --- Type Definitions ---
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

interface InputProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isTextArea?: boolean;
}

interface StatCardProps {
  Icon: React.ElementType;
  title: string;
  value: string;
  link: string;
}

// --- Utility Components ---

const NavLink: React.FC<NavLinkProps> = ({ href, children, onClick }) => (
  <a
    href={href}
    onClick={onClick}
    className="block md:inline-block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200 font-medium"
  >
    {children}
  </a>
);

const Input: React.FC<InputProps> = ({ id, label, type, placeholder, value, onChange, isTextArea = false }) => (
  <div className="flex flex-col mb-4">
    <label htmlFor={id} className="text-sm font-semibold text-gray-700 mb-1">
      {label}
    </label>
    {isTextArea ? (
      <textarea
        id={id}
        rows={4}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 resize-none"
      />
    ) : (
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
      />
    )}
  </div>
);

const StatCard: React.FC<StatCardProps> = ({ Icon, title, value, link }) => (
  <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 transform hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
    <div className="flex items-center justify-between">
      <div className="p-3 rounded-full bg-amber-100 text-amber-600">
        <Icon className="w-6 h-6" />
      </div>
      <a href={link} className="text-sm font-medium text-amber-600 flex items-center group">
        View More
        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform duration-200" />
      </a>
    </div>
    <div className="mt-4">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  </div>
);


const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [stats, setStats] = useState<DocumentData[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [db, setDb] = useState<any>(null); // Use 'any' for the complex Firestore DB object
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');


  // --- Firebase and Auth Initialization ---
  useEffect(() => {
    try {
      // Access global variables set in main.tsx
      const appId = (window as any).__APP_ID as string;
      const firebaseConfig = (window as any).__FIREBASE_CONFIG as any;
      const initialAuthToken = (window as any).__INITIAL_AUTH_TOKEN as string | null;

      if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
        console.error("Firebase configuration is missing.");
        return;
      }

      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const authInstance = getAuth(app);

      setDb(firestoreDb);

      const authenticate = async () => {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(authInstance, initialAuthToken);
          } else {
            await signInAnonymously(authInstance);
          }
        } catch (error) {
          console.error("Authentication failed:", error);
        }
      };

      const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
        setUser(currentUser);
        setIsAuthReady(true);
      });

      authenticate();
      return () => unsubscribe();

    } catch (error) {
      console.error("Error initializing Firebase:", error);
    }
  }, []);

  // --- Data Fetching: Stats ---
  useEffect(() => {
    if (!db || !isAuthReady) return;

    const fetchStats = async () => {
      try {
        const statsCollectionRef = collection(db, `/artifacts/${(window as any).__APP_ID}/public/data/stats`);
        const statsQuery = query(statsCollectionRef);
        const snapshot = await getDocs(statsQuery);

        const fetchedStats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Use default mock data if Firestore is empty or inaccessible for reading public data
        if (fetchedStats.length === 0) {
           const mockStats = [
              { Icon: Users, title: "Lives Impacted", value: "250K+", link: "#about" },
              { Icon: DollarSign, title: "Industry Savings", value: "$50M+", link: "#about" },
              { Icon: Award, title: "Certified Solutions", value: "12", link: "#solutions" },
            ];
            setStats(mockStats);
            console.log("Using mock data for stats.");
            // OPTIONAL: Seed the database with mock data if authenticated
            if (user) {
              mockStats.forEach(async (stat, index) => {
                await setDoc(doc(db, `/artifacts/${(window as any).__APP_ID}/public/data/stats/${stat.title.replace(/\s/g, '')}`), stat);
              });
            }
        } else {
            setStats(fetchedStats);
        }
      } catch (e) {
        console.error("Error fetching stats:", e);
        // Fallback to mock data if fetch fails
        setStats([
            { Icon: Users, title: "Lives Impacted", value: "250K+", link: "#about" },
            { Icon: DollarSign, title: "Industry Savings", value: "$50M+", link: "#about" },
            { Icon: Award, title: "Certified Solutions", value: "12", link: "#solutions" },
        ]);
      }
    };

    fetchStats();
  }, [db, isAuthReady, user]);


  // --- Event Handlers ---

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm({ ...contactForm, [e.target.id]: e.target.value });
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user) {
        setMessage('Cannot submit form. Authentication or database is not ready.');
        setMessageType('error');
        return;
    }

    try {
        // Use a private collection for submissions, linked to the user
        const submissionsRef = collection(db, `/artifacts/${(window as any).__APP_ID}/users/${user.uid}/contact_submissions`);
        const docRef = doc(submissionsRef); // Auto-generated ID

        await setDoc(docRef, {
            ...contactForm,
            submittedAt: new Date(),
            userId: user.uid,
            userName: user.isAnonymous ? 'Anonymous' : user.uid,
        });

        setMessage('Thank you! Your message has been received.');
        setMessageType('success');
        setContactForm({ name: '', email: '', message: '' });
    } catch (error) {
        console.error("Error submitting contact form:", error);
        setMessage('Submission failed. Please try again.');
        setMessageType('error');
    }
  };


  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMenuOpen(false);
    document.getElementById(targetId.substring(1))?.scrollIntoView({ behavior: 'smooth' });
  };

  const MemoizedStatCards = React.useMemo(() => (
    stats.map((stat) => (
      <StatCard
        key={stat.title}
        Icon={stat.Icon}
        title={stat.title}
        value={stat.value}
        link={stat.link}
      />
    ))
  ), [stats]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <a href="#" className="flex items-center space-x-2">
              <span className="text-3xl font-extrabold text-amber-600">Melotwo</span>
              <span className="text-xs text-gray-500 font-semibold hidden sm:block">
                Certified Safety Solutions
              </span>
            </a>
            <nav className="hidden md:flex space-x-1">
              <NavLink href="#home" onClick={(e) => handleNavLinkClick(e, '#home')}>Home</NavLink>
              <NavLink href="#about" onClick={(e) => handleNavLinkClick(e, '#about')}>About</NavLink>
              <NavLink href="#solutions" onClick={(e) => handleNavLinkClick(e, '#solutions')}>Solutions</NavLink>
              <NavLink href="#contact" onClick={(e) => handleNavLinkClick(e, '#contact')}>Contact</NavLink>
              <div className="py-2 pl-4 text-sm text-gray-500">
                  <span className="font-bold">User:</span> {user?.uid.substring(0, 8)}...
              </div>
            </nav>
            <button
              className="md:hidden p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100 border-t' : 'max-h-0 opacity-0'
          } bg-white`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink href="#home" onClick={(e) => handleNavLinkClick(e, '#home')}>Home</NavLink>
            <NavLink href="#about" onClick={(e) => handleNavLinkClick(e, '#about')}>About</NavLink>
            <NavLink href="#solutions" onClick={(e) => handleNavLinkClick(e, '#solutions')}>Solutions</NavLink>
            <NavLink href="#contact" onClick={(e) => handleNavLinkClick(e, '#contact')}>Contact</NavLink>
            <div className="py-2 pl-3 text-sm text-gray-500">
                <span className="font-bold">User ID:</span> {user?.uid}
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section id="home" className="relative pt-12 pb-24 md:pt-24 md:pb-32 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center">
            {/* Content */}
            <div className="lg:w-1/2 lg:pr-16 text-center lg:text-left">
              <span className="inline-block px-3 py-1 text-sm font-semibold text-amber-600 bg-amber-100 rounded-full mb-4">
                Minimizing Risk, Maximizing Output
              </span>
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                Certified Safety Solutions for African Mining
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg lg:max-w-none mx-auto lg:mx-0">
                Melotwo provides cutting-edge, certified PPE and comprehensive risk management systems tailored to the unique challenges of the African mining and industrial sector.
              </p>
              <div className="flex justify-center lg:justify-start space-x-4">
                <a
                  href="#solutions"
                  onClick={(e) => handleNavLinkClick(e, '#solutions')}
                  className="px-8 py-3 text-lg font-bold text-white bg-amber-600 rounded-xl shadow-lg hover:bg-amber-700 transition-colors duration-300 transform hover:scale-105"
                >
                  Explore Solutions
                </a>
                <a
                  href="#contact"
                  onClick={(e) => handleNavLinkClick(e, '#contact')}
                  className="px-8 py-3 text-lg font-bold text-gray-800 bg-white border border-gray-300 rounded-xl shadow-md hover:bg-gray-50 transition-colors duration-300"
                >
                  Get in Touch
                </a>
              </div>
            </div>

            {/* Image/Illustration Placeholder */}
            <div className="lg:w-1/2 mt-12 lg:mt-0 relative">
              <div className="w-full h-80 bg-gray-200 rounded-3xl shadow-2xl flex items-center justify-center border-4 border-white overflow-hidden">
                <img
                  src={`https://placehold.co/600x400/FFB300/FFFFFF?text=Certified+PPE`}
                  alt="Illustration of certified safety gear"
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = `https://placehold.co/600x400/FFB300/FFFFFF?text=Certified+PPE`)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
              Our Impact in Numbers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {MemoizedStatCards}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-base font-semibold text-amber-600 tracking-wide uppercase">
                Who We Are
              </h2>
              <p className="mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl">
                The Melotwo Difference
              </p>
            </div>

            <div className="mt-16 grid lg:grid-cols-2 gap-16">
              <div className="space-y-8">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-amber-600 text-white shadow-lg">
                      <Briefcase className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Local Expertise, Global Standards</h3>
                    <p className="mt-2 text-base text-gray-600">
                      We understand the specific environmental and regulatory landscape of the African industrial sector. Our solutions are built to meet the most stringent international standards while remaining pragmatic for local operations.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-amber-600 text-white shadow-lg">
                      <Award className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Certified Quality and Durability</h3>
                    <p className="mt-2 text-base text-gray-600">
                      From safety boots to full-body harnesses, every product is rigorously tested and certified. We prioritize durability to ensure longevity in harsh conditions, offering superior value and protection.
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-amber-600 text-white shadow-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Integrated Risk Management</h3>
                    <p className="mt-2 text-base text-gray-600">
                      Safety is more than just gear. We partner with our clients to implement holistic risk assessment and compliance systems, driving a culture of proactive safety across the organization.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:order-first lg:col-span-1 flex items-center justify-center">
                <div className="w-full bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                  <p className="text-lg text-gray-600">
                    To be the leading partner in workplace safety across Africa, setting new benchmarks for protection, compliance, and industrial efficiency. We believe that zero harm is achievable through quality equipment and dedicated training.
                  </p>
                  <p className="mt-4 text-sm text-amber-600 font-semibold">
                    &mdash; Melotwo Leadership Team
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-base font-semibold text-amber-600 tracking-wide uppercase">
                Our Services
              </h2>
              <p className="mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl">
                Certified Products & Systems
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-600 mx-auto">
                We offer a carefully curated range of safety equipment and compliance tools.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-gray-50 rounded-2xl shadow-xl border border-gray-200 transform hover:shadow-2xl transition-all duration-300">
                <Home className="w-8 h-8 text-amber-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Personal Protective Equipment (PPE)</h3>
                <p className="text-gray-600">
                  High-durability safety wear, including respiratory protection, headgear, eye protection, and specialized mining apparel, all certified to international standards.
                </p>
                <a href="#" className="mt-4 inline-flex items-center text-amber-600 font-semibold group">
                  Product Catalogue
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
              <div className="p-6 bg-gray-50 rounded-2xl shadow-xl border border-gray-200 transform hover:shadow-2xl transition-all duration-300">
                <MessageSquare className="w-8 h-8 text-amber-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Compliance and Audit Systems</h3>
                <p className="text-gray-600">
                  Digital tools and consultancy services for real-time safety tracking, incident reporting, and compliance with local and global mining regulations.
                </p>
                <a href="#" className="mt-4 inline-flex items-center text-amber-600 font-semibold group">
                  Learn More
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
              <div className="p-6 bg-gray-50 rounded-2xl shadow-xl border border-gray-200 transform hover:shadow-2xl transition-all duration-300">
                <Users className="w-8 h-8 text-amber-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Bespoke Safety Training</h3>
                <p className="text-gray-600">
                  On-site and virtual training programs focused on best practices for equipment use, hazard identification, and emergency response tailored for African environments.
                </p>
                <a href="#" className="mt-4 inline-flex items-center text-amber-600 font-semibold group">
                  View Courses
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 md:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-base font-semibold text-amber-600 tracking-wide uppercase">
                Connect with Us
              </h2>
              <p className="mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl">
                Start Your Safety Partnership
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100">
              <div className="lg:col-span-2">
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <Input
                    id="name"
                    label="Full Name"
                    type="text"
                    placeholder="Enter your name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                  />
                  <Input
                    id="email"
                    label="Work Email"
                    type="email"
                    placeholder="example@company.com"
                    value={contactForm.email}
                    onChange={handleContactChange}
                  />
                  <Input
                    id="message"
                    label="How can we help?"
                    type="text"
                    placeholder="Tell us about your project or safety needs..."
                    value={contactForm.message}
                    onChange={handleContactChange}
                    isTextArea
                  />
                  <button
                    type="submit"
                    className="w-full px-6 py-3 text-lg font-bold text-white bg-amber-600 rounded-xl shadow-lg hover:bg-amber-700 transition-colors duration-300 transform hover:scale-[1.01]"
                  >
                    Send Message
                  </button>
                  {message && (
                    <div
                      className={`mt-4 p-4 rounded-xl font-semibold ${
                        messageType === 'success'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {message}
                    </div>
                  )}
                </form>
              </div>
              <div className="lg:col-span-1 space-y-6 pt-4 border-t lg:border-t-0 lg:border-l lg:pl-12 border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900">Contact Details</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-gray-500">Email us</p>
                      <a href="mailto:info@melotwo.com" className="font-semibold text-gray-800 hover:text-amber-600 transition-colors">info@melotwo.com</a>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-gray-500">Call us</p>
                      <a href="tel:+27115551234" className="font-semibold text-gray-800 hover:text-amber-600 transition-colors">+27 (11) 555-1234</a>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Home className="w-5 h-5 text-amber-600 mt-1 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-gray-500">Head Office</p>
                      <p className="font-semibold text-gray-800">
                        Sandton, Johannesburg, South Africa
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">Your Session ID:</p>
                    <p className="text-sm font-mono text-gray-900 break-all">{user?.uid || 'Authenticating...'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p className="text-2xl font-extrabold text-white mb-4">Melotwo</p>
          <div className="flex justify-center space-x-6 mb-8">
            <a href="#about" onClick={(e) => handleNavLinkClick(e, '#about')} className="hover:text-amber-600 transition-colors">About Us</a>
            <a href="#solutions" onClick={(e) => handleNavLinkClick(e, '#solutions')} className="hover:text-amber-600 transition-colors">Solutions</a>
            <a href="#contact" onClick={(e) => handleNavLinkClick(e, '#contact')} className="hover:text-amber-600 transition-colors">Get Started</a>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Melotwo Official Website. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
