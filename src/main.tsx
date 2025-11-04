import React from 'react';

// Icons from lucide-react (used for clean, modern look)
import { ShieldCheck, HardHat, Bolt, Users, Mail, Phone, MapPin, Menu, X, ChevronRight } from 'lucide-react';

// Define the main content sections
const features = [
  {
    icon: HardHat,
    title: "Certified Safety Gear",
    description: "Providing rugged and certified personal protective equipment (PPE) specifically designed for the demanding African mining environment.",
  },
  {
    icon: Bolt,
    title: "Smart Monitoring Systems",
    description: "Real-time environmental and personnel monitoring systems to detect hazards and prevent accidents proactively.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Auditing",
    description: "Expert consultancy to ensure full compliance with international safety standards and local mining regulations.",
  },
  {
    icon: Users,
    title: "Training & Capacity Building",
    description: "On-site and digital training programs for mine workers and management focused on best-practice safety protocols.",
  },
];

// Reusable Button Component
const PrimaryButton = ({ children, className = '' }) => (
  <button
    className={`bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-yellow-400 transition duration-300 ease-in-out transform hover:scale-[1.02] ${className}`}
  >
    {children}
  </button>
);

// Navigation Link Component
const NavLink = ({ href, children, onClick }) => (
  <a
    href={href}
    onClick={onClick}
    className="text-gray-200 hover:text-yellow-500 transition duration-200 px-3 py-2 text-lg font-medium"
  >
    {children}
  </a>
);

// Header/Navigation Component
const Header = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'Solutions', href: '#solutions' },
    { name: 'About Us', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-gray-900 shadow-xl border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            {/* Logo/Brand Name */}
            <a href="#home" className="text-3xl font-extrabold text-white tracking-wider">
              MELO<span className="text-yellow-500">TWO</span>
            </a>
          </div>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4">
            {navItems.map(item => (
              <NavLink key={item.name} href={item.href}>{item.name}</NavLink>
            ))}
          </nav>
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-500"
              aria-expanded={isOpen ? 'true' : 'false'}
              aria-label="Toggle navigation"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 shadow-lg border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col">
            {navItems.map(item => (
              <NavLink key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                {item.name}
              </NavLink>
            ))}
            <PrimaryButton className="w-full mt-4">Get a Quote</PrimaryButton>
          </div>
        </div>
      )}
    </header>
  );
};

// Hero Section Component
const Hero = () => (
  <section id="home" className="bg-gray-900 text-white min-h-[calc(100vh-80px)] flex items-center pt-20 pb-10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          <span className="block text-yellow-500">Certified Safety,</span>
          <span className="block mt-2">Uplifting African Mining.</span>
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
          We provide cutting-edge, certified safety solutions and technology, enabling mining operations across Africa to achieve **zero harm** and sustainable productivity.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <PrimaryButton>
            Explore Our Solutions
          </PrimaryButton>
          <a
            href="#contact"
            className="inline-flex items-center justify-center font-bold py-3 px-8 rounded-xl text-yellow-500 border-2 border-yellow-500 hover:bg-yellow-500 hover:text-gray-900 transition duration-300"
          >
            Contact a Specialist
            <ChevronRight className="w-5 h-5 ml-1" />
          </a>
        </div>
      </div>
    </div>
  </section>
);

// Features/Solutions Section Component
const Solutions = () => (
  <section id="solutions" className="py-20 bg-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-base text-yellow-500 font-semibold tracking-wide uppercase">Our Core Offering</h2>
        <p className="mt-2 text-4xl font-extrabold text-white sm:text-5xl">
          Comprehensive Safety Solutions for the Mine
        </p>
        <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto">
          From essential protective gear to advanced monitoring technology, our solutions are engineered for reliability in the harshest conditions.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div key={feature.title} className="p-6 bg-gray-900 rounded-xl shadow-2xl transition duration-500 transform hover:scale-[1.03] hover:shadow-yellow-500/20 group">
            <feature.icon className="h-10 w-10 text-yellow-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-yellow-500 transition duration-300">{feature.title}</h3>
            <p className="text-gray-400">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// About Us Section Component
const AboutUs = () => (
  <section id="about" className="py-20 bg-gray-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
        <div className="lg:col-span-1">
          <h2 className="text-base text-yellow-500 font-semibold tracking-wide uppercase">Who We Are</h2>
          <p className="mt-2 text-4xl font-extrabold text-white sm:text-5xl">
            Pioneers in African Mining Safety
          </p>
          <p className="mt-6 text-lg text-gray-300">
            Melotwo was founded on the principle that every miner deserves to return home safely. We transitioned from a basic service provider to a technology-driven solutions house, committed to addressing the unique safety challenges faced by the African mining sector. Our approach combines rigorous certification with deep regional understanding.
          </p>
          <p className="mt-4 text-lg text-gray-300 font-semibold border-l-4 border-yellow-500 pl-4">
            Our mission is simple: to make African mines the safest in the world through innovation and uncompromising quality.
          </p>
          <div className="mt-8">
            <PrimaryButton className="text-sm">
              View Our Certifications
            </PrimaryButton>
          </div>
        </div>
        <div className="mt-10 lg:mt-0 lg:col-span-1">
          {/* Placeholder for an image or a compelling safety stat */}
          <div className="p-8 bg-gray-800 rounded-xl shadow-2xl text-center">
            <p className="text-6xl font-extrabold text-yellow-500">99.9%</p>
            <p className="mt-2 text-2xl text-white">Equipment Reliability Rate</p>
            <p className="mt-4 text-gray-400">Our commitment to quality ensures equipment longevity and performance in harsh mining conditions.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Contact Section Component
const Contact = () => (
  <section id="contact" className="py-20 bg-gray-700">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-base text-yellow-300 font-semibold tracking-wide uppercase">Get in Touch</h2>
        <p className="mt-2 text-4xl font-extrabold text-white sm:text-5xl">
          Connect with a Safety Specialist
        </p>
        <p className="mt-4 text-xl text-gray-200 max-w-3xl mx-auto">
          We are ready to discuss your specific needs and tailor a solution for your site. Reach out today.
        </p>
      </div>

      <div className="mt-12 lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Contact Info */}
        <div className="lg:col-span-1 space-y-8 p-6 bg-gray-800 rounded-xl shadow-2xl mb-8 lg:mb-0">
          <ContactDetail
            icon={MapPin}
            title="Office Location"
            value="Melotwo Headquarters, Africa"
            link="#"
          />
          <ContactDetail
            icon={Phone}
            title="Call Us"
            value="+27 679461487 (South Africa)"
            link="tel:+27679461487
          />
          <ContactDetail
            icon={Mail}
            title="Email Us"
            value="info@melotwo.com"
            link="mailto:info@melotwo.com"
          />
        </div>

        {/* Contact Form Placeholder */}
        <div className="lg:col-span-2 p-8 bg-gray-900 rounded-xl shadow-2xl">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField id="name" label="Full Name" type="text" placeholder="Your Name" />
              <InputField id="email" label="Work Email" type="email" placeholder="example@minecorp.com" />
            </div>
            <InputField id="company" label="Company / Mine Site" type="text" placeholder="MineCorp Group" />
            <div className="col-span-2">
              <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                Your Inquiry
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="w-full bg-gray-700 text-white border-gray-600 rounded-lg shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-3"
                placeholder="Tell us about your safety needs..."
              />
            </div>
            <PrimaryButton className="w-full">
              Send Message
            </PrimaryButton>
          </form>
        </div>
      </div>
    </div>
  </section>
);

// Reusable Contact Detail Component
const ContactDetail = ({ icon: Icon, title, value, link }) => (
  <div className="flex items-start space-x-4">
    <Icon className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
    <div>
      <h4 className="text-lg font-bold text-white">{title}</h4>
      <a
        href={link}
        className="text-gray-300 hover:text-yellow-500 transition duration-200 block text-base"
      >
        {value}
      </a>
    </div>
  </div>
);

// Reusable Input Field Component
const InputField = ({ id, label, type, placeholder }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
      {label}
    </label>
    <input
      type={type}
      name={id}
      id={id}
      className="w-full bg-gray-700 text-white border-gray-600 rounded-lg shadow-sm focus:border-yellow-500 focus:ring-yellow-500 p-3"
      placeholder={placeholder}
    />
  </div>
);

// Footer Component
const Footer = () => (
  <footer className="bg-gray-900 border-t border-gray-700">
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
      <div className="flex justify-center space-x-4 mb-4">
        <NavLink href="#solutions">Solutions</NavLink>
        <NavLink href="#about">About</NavLink>
        <NavLink href="#contact">Contact</NavLink>
      </div>
      <p className="text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Melotwo. All rights reserved. | Certified Safety Solutions for the African Mining Industry.
      </p>
      <p className="text-gray-500 text-xs mt-1">
        Built with React and Tailwind CSS.
      </p>
    </div>
  </footer>
);


// Main App Component
const App = () => {
  // Sets the default font and background for the whole page
  return (
    <div className="min-h-screen bg-gray-900 font-['Inter'] antialiased">
      <Header />
      <main>
        <Hero />
        <Solutions />
        <AboutUs />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default App;
