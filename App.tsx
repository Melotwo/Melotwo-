import React, { useState, useEffect } from 'react';
import { Truck, Shield, Users, ArrowRight } from 'lucide-react'; // Using Lucide for modern icons

// --- Helper Components ---

// Navigation Bar
const NavBar = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
      <h1 className="text-2xl font-extrabold text-blue-800 tracking-tight">
        Melotwo
      </h1>
      <nav className="hidden md:flex space-x-8">
        {['Solutions', 'Impact', 'About Us', 'Contact'].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase().replace(' ', '-')}`}
            className="text-gray-600 hover:text-blue-600 transition duration-150 font-medium"
          >
            {item}
          </a>
        ))}
      </nav>
      <a
        href="#contact"
        className="hidden md:inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-orange-500 hover:bg-orange-600 transition duration-150"
      >
        Get a Quote
      </a>
    </div>
  </header>
);

// Feature Card Component
interface FeatureProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureProps> = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 border border-gray-100">
    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-500 text-white mb-4">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  // Use a simple state for demonstration, though this is primarily a static page
  const [safetyScore, setSafetyScore] = useState(98);

  useEffect(() => {
    // Basic setup logic here if needed
    console.log("Melotwo App Loaded.");
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <NavBar />

      <main>
        {/* --- 1. Hero Section --- */}
        <section id="hero" className="relative pt-24 pb-20 md:pt-40 md:pb-32 bg-gray-900 overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('https://placehold.co/1920x800/254F7F/FFFFFF?text=Mining+Safety+Image')" }}></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              Certified Safety Solutions <br className="hidden sm:inline" /> for the African Mine
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-10">
              We deliver cutting-edge technology and certified training to ensure zero-harm operations and maximize productivity beneath the surface.
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href="#solutions"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-blue-600 hover:bg-blue-700 transition duration-300 transform hover:scale-105"
              >
                Explore Solutions
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-8 py-3 border border-blue-400 text-base font-medium rounded-full shadow-lg text-blue-100 hover:bg-blue-800 transition duration-300"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </section>

        {/* --- 2. Solutions Section --- */}
        <section id="solutions" className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-4">
              Our Core Safety Pillars
            </h2>
            <p className="text-xl text-gray-500 text-center max-w-3xl mx-auto mb-16">
              Protecting personnel and assets with comprehensive, locally optimized technologies.
            </p>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <FeatureCard
                icon={Shield}
                title="Proximity Detection"
                description="Advanced PDS systems that prevent vehicle-to-vehicle and vehicle-to-pedestrian collisions in confined spaces."
              />
              <FeatureCard
                icon={Users}
                title="Certified Training"
                description="SAQA-aligned safety training programs for operators and management, ensuring compliance and competence."
              />
              <FeatureCard
                icon={Truck}
                title="Asset Monitoring"
                description="Real-time telemetry for mining equipment, predicting failures and ensuring optimal machine health."
              />
            </div>
          </div>
        </section>

        {/* --- 3. Impact/Stats Section --- */}
        <section id="impact" className="py-16 md:py-24 bg-blue-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold mb-12">Melotwo By The Numbers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="p-4">
                <p className="text-5xl font-bold text-orange-400">99.9%</p>
                <p className="mt-2 text-blue-200">System Uptime</p>
              </div>
              <div className="p-4">
                <p className="text-5xl font-bold text-orange-400">20+</p>
                <p className="mt-2 text-blue-200">Mines Secured</p>
              </div>
              <div className="p-4">
                <p className="text-5xl font-bold text-orange-400">75%</p>
                <p className="mt-2 text-blue-200">Reduction in Incidents</p>
              </div>
              <div className="p-4">
                <p className="text-5xl font-bold text-orange-400">{safetyScore}%</p>
                <p className="mt-2 text-blue-200">Average Client Safety Score</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- 4. Contact Section (Call to Action) --- */}
        <section id="contact" className="py-16 md:py-24 bg-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-white p-8 md:p-12 rounded-xl shadow-2xl border border-blue-100">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                Ready to Achieve Zero Harm?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Contact our expert team today for a comprehensive safety audit and a tailored solution plan for your operations.
              </p>
              <form className="max-w-md mx-auto space-y-4">
                <input
                  type="text"
                  placeholder="Your Name / Company"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <input
                  type="email"
                  placeholder="Work Email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <textarea
                  placeholder="Your Message (e.g., 'Need PDS info for 3 sites')"
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-orange-500 hover:bg-orange-600 transition duration-300"
                >
                  Request Consultation <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-2xl font-extrabold text-blue-500 mb-4">Melotwo</p>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Melotwo. All rights reserved. | Certified Safety Solutions.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
