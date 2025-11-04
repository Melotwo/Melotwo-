import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';

// --- Global Variable Declarations (REQUIRED) ---
// These variables are provided by the hosting environment as strings.
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string;

// Define a type for the application's main state data
interface Task {
  id: string;
  text: string;
  completed: boolean;
}

// The main application component
const App: React.FC = () => {
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskText, setNewTaskText] = useState('');

  // 1. INITIALIZATION: Firebase Setup and Authentication
  useEffect(() => {
    // Safely retrieve and parse environment variables
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    
    let firebaseConfig = null;
    try {
        // *** CRITICAL STEP: Use JSON.parse() on the string config ***
        if (typeof __firebase_config !== 'undefined') {
            firebaseConfig = JSON.parse(__firebase_config);
            console.log("Firebase config parsed successfully.");
        } else {
            console.error("Error: __firebase_config not defined.");
            return;
        }
    } catch (e) {
        console.error("Error parsing __firebase_config:", e);
        return;
    }

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const userAuth = getAuth(app);
    
    // Store instances
    setDb(firestore);
    setAuth(userAuth);

    // Set up Authentication listener
    const unsubscribeAuth = onAuthStateChanged(userAuth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserId(currentUser.uid);
      } else {
        // If not authenticated, attempt to sign in using the provided token or anonymously
        try {
          if (typeof __initial_auth_token !== 'undefined') {
            await signInWithCustomToken(userAuth, __initial_auth_token);
            console.log("Signed in with custom token.");
          } else {
            const anonymousUser = await signInAnonymously(userAuth);
            setUser(anonymousUser.user);
            setUserId(anonymousUser.user.uid);
            console.log("Signed in anonymously.");
          }
        } catch (error) {
          console.error("Authentication failed:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []); // Run only once on mount

  // 2. DATA FETCHING: Real-time Listener for Tasks
  useEffect(() => {
    if (!db || !userId) return;

    // Define the path for the user's private collection
    const tasksCollectionPath = `/artifacts/${__app_id}/users/${userId}/tasks`;
    const tasksRef = collection(db, tasksCollectionPath);
    
    // Set up real-time listener using onSnapshot
    const q = query(tasksRef);

    const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const fetchedTasks: Task[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedTasks.push({
          id: doc.id,
          text: data.text || 'Untitled Task',
          completed: !!data.completed,
        } as Task);
      });
      // Sort tasks: incomplete first, then completed
      fetchedTasks.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
      setTasks(fetchedTasks);
      console.log(`Fetched ${fetchedTasks.length} tasks for user ${userId}.`);
    }, (error) => {
        console.error("Error listening to tasks:", error);
    });

    // Cleanup the listener when the component unmounts or userId changes
    return () => unsubscribeSnapshot();
  }, [db, userId]); 

  // Handlers for Firestore Operations
  const handleAddTask = async () => {
    if (!db || !userId || newTaskText.trim() === '') return;

    try {
        const tasksCollectionPath = `/artifacts/${__app_id}/users/${userId}/tasks`;
        const newTaskRef = doc(collection(db, tasksCollectionPath)); // Create a new doc reference for ID
        
        await setDoc(newTaskRef, {
            text: newTaskText.trim(),
            completed: false,
            createdAt: new Date().toISOString(),
        });

        setNewTaskText('');
        console.log("Task added successfully.");
    } catch (error) {
        console.error("Error adding task:", error);
    }
  };

  const handleToggleTask = async (task: Task) => {
    if (!db || !userId) return;

    try {
        const tasksCollectionPath = `/artifacts/${__app_id}/users/${userId}/tasks`;
        const taskDocRef = doc(db, tasksCollectionPath, task.id);
        
        await setDoc(taskDocRef, { 
            completed: !task.completed 
        }, { merge: true }); // Use merge to update only the 'completed' field
        
        console.log(`Task ${task.id} toggled.`);
    } catch (error) {
        console.error("Error toggling task:", error);
    }
  };


  // Render Loading and UI
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl font-semibold text-indigo-600">Loading application and authenticating...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <h1 className="text-4xl font-extrabold text-indigo-600 mb-2">My Todo List</h1>
        <p className="text-sm text-gray-500 mb-6">User ID: <span className="font-mono text-xs bg-gray-200 p-1 rounded">{userId || 'N/A'}</span></p>

        {/* New Task Input */}
        <div className="flex space-x-3 mb-8">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
          />
          <button
            onClick={handleAddTask}
            disabled={newTaskText.trim() === ''}
            className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition duration-300 ease-in-out shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Task
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-center text-gray-500 p-4 border-2 border-dashed border-gray-300 rounded-lg">No tasks yet! Add one above.</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-4 rounded-xl shadow-md cursor-pointer transition duration-200 ${
                  task.completed ? 'bg-green-50 border-l-4 border-green-400 opacity-70' : 'bg-white hover:shadow-lg'
                }`}
                onClick={() => handleToggleTask(task)}
              >
                <span
                  className={`text-lg transition ${
                    task.completed ? 'line-through text-gray-500 italic' : 'text-gray-800 font-medium'
                  }`}
                >
                  {task.text}
                </span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                    task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                }`}>
                    {task.completed && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
