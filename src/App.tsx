import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, setDoc, query, orderBy, deleteDoc } from 'firebase/firestore'; 
import { Home, LayoutDashboard, Settings, LogOut, ArrowUpRight, Plus, Users, Menu, X, CheckCircle, Clock, ListPlus, Link } from 'lucide-react';

// --- Global Variables and Configuration ---
// These variables are injected by the environment and declared in src/global.d.ts
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : '';

// --- Type Definitions for Strict TypeScript ---
interface NavItemProps {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
}

interface FeatureCardProps {
  Icon: React.ElementType;
  title: string;
  value: string;
  link: string;
}

interface InputFieldProps {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email';
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ProjectData {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  priority: 'High' | 'Medium' | 'Low';
  ownerId: string;
  createdAt: number;
}

// --- Firebase Initialization and Auth Logic (Moved to top-level for context) ---
let app: any;
let db: any;
let auth: any;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

// --- Utility Functions ---

/**
 * Creates a firestore path for public data shared across all users in this app.
 * @param collectionName The name of the collection (e.g., 'projects').
 * @returns The full Firestore path.
 */
const getPublicCollectionPath = (collectionName: string) => {
  return `artifacts/${appId}/public/data/${collectionName}`;
};

/**
 * Converts a Firestore timestamp or date string into a readable format.
 * @param dateString The date string (e.g., '2025-12-31').
 * @returns A formatted date string.
 */
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateString; // Return original if parsing fails
  }
};


// --- Component Definitions ---

// Reusable Navigation Link Component
const NavItem: React.FC<NavItemProps> = ({ href, children, onClick, isActive }) => {
  const baseClasses = "flex items-center space-x-3 p-3 text-sm font-medium rounded-xl transition-all duration-200";
  const activeClasses = isActive
    ? "bg-indigo-600 text-white shadow-lg"
    : "text-indigo-200 hover:bg-indigo-700 hover:text-white";

  return (
    <a href={href} onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
      {children}
    </a>
  );
};

// Reusable Input Field Component
const InputField: React.FC<InputFieldProps> = ({ id, label, type, placeholder, value, onChange }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm"
    />
  </div>
);

// Reusable Feature Card Component
const FeatureCard: React.FC<FeatureCardProps> = ({ Icon, title, value, link }) => (
  <div className="bg-white p-6 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
    <div className="flex items-center justify-between">
      <Icon className="w-8 h-8 text-indigo-500" />
      <a href={link} className="text-sm font-semibold text-indigo-500 hover:text-indigo-700 transition flex items-center">
        View All
        <ArrowUpRight className="w-4 h-4 ml-1" />
      </a>
    </div>
    <div className="mt-4">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  </div>
);

// --- Main Project List/Display Component ---
const ProjectList: React.FC<{ projects: ProjectData[]; userId: string | null; db: any }> = ({ projects, userId, db }) => {
  
  const handleDelete = async (projectId: string) => {
    if (!db || !userId) return;
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      try {
        const docRef = doc(db, getPublicCollectionPath('projects'), projectId);
        await deleteDoc(docRef);
        console.log(`Project ${projectId} deleted successfully.`);
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  const sortedProjects = projects.sort((a, b) => b.createdAt - a.createdAt);

  if (sortedProjects.length === 0) {
    return (
      <div className="text-center p-10 bg-white rounded-2xl shadow-lg mt-6">
        <p className="text-gray-500 text-lg">No projects found. Use the "Add New Project" section to start!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {sortedProjects.map((project) => (
        <div key={project.id} className="bg-white p-6 rounded-2xl shadow-xl border-l-4 border-indigo-500 hover:shadow-2xl transition duration-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold text-gray-800 truncate pr-2" title={project.name}>{project.name}</h3>
            {project.ownerId === userId && (
              <button
                onClick={() => handleDelete(project.id)}
                className="text-red-500 hover:text-red-700 transition duration-150 p-1 rounded-full hover:bg-red-50"
                aria-label={`Delete project ${project.name}`}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-700">
              <Clock className="w-4 h-4 mr-2 text-indigo-500" />
              <span className="font-medium">Due:</span> {formatDate(project.dueDate)}
            </div>
            <div className="flex items-center text-gray-700">
              <Users className="w-4 h-4 mr-2 text-indigo-500" />
              <span className="font-medium">Owner ID:</span> <span className="text-xs ml-1 bg-gray-100 px-2 py-0.5 rounded-full font-mono">{project.ownerId}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                project.status === 'Completed' ? 'bg-green-100 text-green-700' :
                project.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}
            >
              {project.status}
            </span>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                project.priority === 'High' ? 'bg-red-100 text-red-700' :
                project.priority === 'Medium' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-700'
              }`}
            >
              {project.priority}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};


// --- New Project Form Component ---
const NewProjectForm: React.FC<{ db: any; userId: string | null }> = ({ db, userId }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'In Progress' | 'Completed' | 'Pending'>('Pending');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dueDate || !db || !userId) {
      setMessage('Please fill in Name and Due Date.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const projectsCollection = collection(db, getPublicCollectionPath('projects'));
      // Using setDoc with a generated ID to create the document
      const newDocRef = doc(projectsCollection);
      
      const newProject: Omit<ProjectData, 'id'> = {
        name,
        description,
        dueDate,
        status,
        priority,
        ownerId: userId,
        createdAt: Date.now(),
      };
      
      await setDoc(newDocRef, newProject);

      setMessage(`Project "${name}" added successfully!`);
      setName('');
      setDescription('');
      setDueDate('');
      setStatus('Pending');
      setPriority('Medium');
    } catch (error) {
      console.error('Error adding project:', error);
      setMessage('Failed to add project. Check console for details.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <ListPlus className="w-6 h-6 mr-3 text-indigo-500" />
        Add New Project
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            id="projectName"
            label="Project Name"
            type="text"
            placeholder="e.g., Q4 Marketing Campaign"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="mb-4">
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="A brief overview of the project goals."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'In Progress' | 'Completed' | 'Pending')}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm bg-white"
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'High' | 'Medium' | 'Low')}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-sm bg-white"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center mt-4"
        >
          {loading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <Plus className="w-5 h-5 mr-2" />
          )}
          {loading ? 'Adding Project...' : 'Create Project'}
        </button>
        {message && (
          <p className={`mt-3 text-center text-sm font-medium ${message.includes('Error') || message.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};


// --- Main Application Component ---
const App: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const userId = currentUser?.uid || 'anonymous';
  
  // --- Firebase Authentication & Setup ---
  useEffect(() => {
    if (!auth || !db) {
      console.error("Firebase services are not initialized.");
      return;
    }

    const signIn = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Authentication failed:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      }
      setIsAuthReady(true);
    });

    signIn();

    return () => unsubscribe();
  }, []);

  // --- Firestore Realtime Data Listener ---
  useEffect(() => {
    if (!db || !isAuthReady) return;

    // Listen to the public 'projects' collection
    const projectsRef = collection(db, getPublicCollectionPath('projects'));
    // Order by creation time (descending)
    const projectsQuery = query(projectsRef, orderBy('createdAt', 'desc'));

    // Setup real-time listener
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData: ProjectData[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProjectData));
      setProjects(projectsData);
    }, (error) => {
      console.error("Error fetching projects:", error);
    });

    // Cleanup listener on component unmount
    return () => {
      unsubscribeProjects();
    };
  }, [db, isAuthReady]); // Re-run when db or auth readiness changes

  // Compute stats for dashboard
  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const pendingProjects = projects.filter(p => p.status === 'Pending').length;
  const highPriorityProjects = projects.filter(p => p.priority === 'High').length;

  // --- Render Content based on activePage ---
  const renderContent = () => {
    if (!isAuthReady) {
      return (
        <div className="flex justify-center items-center h-full min-h-[400px]">
          <div className="text-indigo-600 text-lg font-semibold flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting to Database...
          </div>
        </div>
      );
    }
    
    switch (activePage) {
      case 'dashboard':
        return (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard Icon={LayoutDashboard} title="Total Projects" value={String(totalProjects)} link="#projects" />
              <FeatureCard Icon={CheckCircle} title="Completed" value={String(completedProjects)} link="#projects" />
              <FeatureCard Icon={Clock} title="Pending" value={String(pendingProjects)} link="#projects" />
              <FeatureCard Icon={ArrowUpRight} title="High Priority" value={String(highPriorityProjects)} link="#projects" />
            </div>
            
            <section id="projects" className="mt-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">All Projects ({totalProjects})</h2>
              <ProjectList projects={projects} userId={userId} db={db} />
            </section>

            <NewProjectForm db={db} userId={userId} />
          </>
        );
      case 'settings':
        return (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">User Information</h2>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Status:</span> {currentUser ? 'Authenticated' : 'Anonymous'}
              </p>
              <p className="text-gray-600 mb-4">
                <span className="font-medium">Your User ID:</span> <code className="bg-gray-100 p-1 rounded-md text-sm font-mono break-all">{userId}</code>
              </p>
              <p className="text-sm text-gray-500">
                This ID is used to track ownership of the projects you create. Share it if you need others to know which projects are yours.
              </p>
            </div>
          </>
        );
      default:
        return <div>Page Not Found</div>;
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: Home, page: 'dashboard' },
    { name: 'Settings', icon: Settings, page: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      <style>{`
        /* Custom scrollbar for better aesthetics */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-thumb {
          background-color: #a78bfa;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-track {
          background-color: #f3f4f6;
        }
      `}</style>
      
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 right-4 z-50 p-2 bg-indigo-600 text-white rounded-full lg:hidden shadow-lg"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div className="lg:flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 lg:static lg:w-64 bg-indigo-800 transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:flex-shrink-0 flex flex-col p-6 shadow-2xl`}>
          <div className="flex-shrink-0 flex items-center mb-10 border-b border-indigo-700 pb-4">
            <Link className="w-6 h-6 text-indigo-300 mr-3" />
            <h2 className="text-2xl font-extrabold text-white">ProjectFlow</h2>
          </div>
          
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <NavItem
                key={item.page}
                href={`#${item.page}`}
                onClick={() => { setActivePage(item.page); setIsMenuOpen(false); }}
                isActive={activePage === item.page}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavItem>
            ))}
          </nav>

          <div className="mt-8 pt-4 border-t border-indigo-700">
            <div className="flex items-center space-x-3 text-sm font-medium text-indigo-200">
              <LogOut className="w-5 h-5" />
              <span>Signed in as:</span>
            </div>
            <p className="text-sm text-white mt-1 font-mono break-all">{userId}</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 lg:ml-64 pt-20 lg:pt-10 transition-all duration-300 ease-in-out">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
