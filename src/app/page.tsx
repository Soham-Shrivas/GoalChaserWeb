'use client'

import { useState, useEffect, useRef } from 'react'
import { initializeApp } from 'firebase/app'
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged
} from 'firebase/auth'
import type { User as FirebaseUser } from 'firebase/auth'
import { 
  getFirestore, collection, doc, setDoc, getDoc, getDocs,
  query, where, orderBy, limit, updateDoc, deleteDoc, addDoc
} from 'firebase/firestore'

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCnu-o3yuCI48GCwdgz-N3iFJJBeEmOy24",
  authDomain: "goal-chaser-beb0b.firebaseapp.com",
  projectId: "goal-chaser-beb0b",
  storageBucket: "goal-chaser-beb0b.firebasestorage.app",
  messagingSenderId: "943232218026",
  appId: "1:943232218026:web:552042c3d0b01794c271d3"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

type AppUser = {
  id: string
  username: string
  displayName: string
  avatar: string
  bio: string
  totalStudySeconds: number
  role: string
}

type Subject = {
  id: string
  name: string
  color: string
}

type Task = {
  id: string
  text: string
  completed: boolean
  subject: string
  createdAt: number
}

type Session = {
  id: string
  userId: string
  startTime: number
  endTime: number | null
  seconds: number
  subject: string | null
}

type Friend = {
  id: string
  username: string
  displayName: string
  avatar: string
}

type Group = {
  id: string
  name: string
  members: string[]
  createdAt: number
}

export default function GoalChaser() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  
  // Auth form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')

  // Theme
  const [darkMode, setDarkMode] = useState(true)

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'pomodoro'>('stopwatch')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [pomodoroSettings, setPomodoroSettings] = useState({ focus: 25, break: 5, sessions: 4 })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Data state
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [availableFriends, setAvailableFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<Friend[]>([])

  // UI state
  const [activeTab, setActiveTab] = useState('timer')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showAddFriendModal, setShowAddFriendModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)

  // New data inputs
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectColor, setNewSubjectColor] = useState('#8b5cf6')
  const [newTaskText, setNewTaskText] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [friendSearch, setFriendSearch] = useState('')
  const [profileDisplayName, setProfileDisplayName] = useState('')
  const [profileBio, setProfileBio] = useState('')

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false)
  const [allUsers, setAllUsers] = useState<AppUser[]>([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await loadUserData(firebaseUser.uid)
      } else {
        setUser(null)
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  async function loadUserData(uid: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const userData = userDoc.data() as AppUser
        setUser({ ...userData, id: uid })
        setProfileDisplayName(userData.displayName || '')
        setProfileBio(userData.bio || '')
        setIsAdmin(userData.role === 'admin')
        
        // Load user's data
        await loadSubjects(uid)
        await loadTasks(uid)
        await loadSessions(uid)
        await loadFriends(uid)
        await loadGroups(uid)
      } else {
        // Create user profile
        const newUser: AppUser = {
          id: uid,
          username: email.split('@')[0],
          displayName: email.split('@')[0],
          avatar: '',
          bio: '',
          totalStudySeconds: 0,
          role: 'user'
        }
        await setDoc(doc(db, 'users', uid), newUser)
        setUser(newUser)
      }
      setLoading(false)
    } catch (err) {
      console.error('Error loading user:', err)
      setLoading(false)
    }
  }

  async function loadSubjects(userId: string) {
    const snapshot = await getDocs(collection(db, `users/${userId}/subjects`))
    setSubjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subject)))
  }

  async function loadTasks(userId: string) {
    const q = query(collection(db, `users/${userId}/tasks`), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)))
  }

  async function loadSessions(userId: string) {
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', userId),
      orderBy('startTime', 'desc'),
      limit(100)
    )
    const snapshot = await getDocs(q)
    setSessions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Session)))
  }

  async function loadFriends(userId: string) {
    const q = query(collection(db, 'friends'), where('userId', '==', userId))
    const snapshot = await getDocs(q)
    const friendIds = snapshot.docs.map(d => d.data().friendId)
    
    const friendsData: Friend[] = []
    for (const fid of friendIds) {
      const friendDoc = await getDoc(doc(db, 'users', fid))
      if (friendDoc.exists()) {
        friendsData.push({ id: fid, ...friendDoc.data() } as Friend)
      }
    }
    setFriends(friendsData)

    // Load all users for recommendations
    const allUsersSnap = await getDocs(collection(db, 'users'))
    const available = allUsersSnap.docs
      .filter(d => d.id !== userId && !friendIds.includes(d.id))
      .map(d => ({ id: d.id, ...d.data() } as Friend))
    setAvailableFriends(available)
  }

  async function loadGroups(userId: string) {
    const q = query(collection(db, 'groups'), where('members', 'array-contains', userId))
    const snapshot = await getDocs(q)
    setGroups(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Group)))
  }

  async function handleLogin() {
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    }
  }

  async function handleRegister() {
    setError('')
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const newUser: AppUser = {
        id: cred.user.uid,
        username: username || email.split('@')[0],
        displayName: displayName || username || email.split('@')[0],
        avatar: '',
        bio: '',
        totalStudySeconds: 0,
        role: 'user'
      }
      await setDoc(doc(db, 'users', cred.user.uid), newUser)
      setUser(newUser)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    }
  }

  function handleLogout() {
    if (confirm('Logout?')) {
      signOut(auth)
    }
  }

  function startTimer() {
    if (timerRunning) {
      if (timerRef.current) clearInterval(timerRef.current)
      setTimerRunning(false)
      // Save session
      if (user && timerSeconds > 0) {
        saveSession()
      }
    } else {
      setTimerRunning(true)
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1)
      }, 1000)
    }
  }

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerRunning(false)
    setTimerSeconds(0)
  }

  async function saveSession() {
    if (!user || timerSeconds === 0) return
    
    const session: Session = {
      id: '',
      userId: user.id,
      startTime: Date.now() - timerSeconds * 1000,
      endTime: Date.now(),
      seconds: timerSeconds,
      subject: selectedSubject || null
    }
    
    const docRef = await addDoc(collection(db, 'sessions'), session)
    
    // Update user total
    const userRef = doc(db, 'users', user.id)
    await updateDoc(userRef, {
      totalStudySeconds: (user.totalStudySeconds || 0) + timerSeconds
    })
    
    setUser({ ...user, totalStudySeconds: user.totalStudySeconds + timerSeconds })
    await loadSessions(user.id)
  }

  async function addSubject() {
    if (!user || !newSubjectName.trim()) return
    
    const subject: Subject = {
      id: Date.now().toString(),
      name: newSubjectName.trim(),
      color: newSubjectColor
    }
    
    await setDoc(doc(db, `users/${user.id}/subjects`, subject.id), subject)
    setSubjects([...subjects, subject])
    setNewSubjectName('')
    setShowAddSubjectModal(false)
  }

  async function addTask() {
    if (!user || !newTaskText.trim()) return
    
    const task: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      subject: selectedSubject,
      createdAt: Date.now()
    }
    
    await setDoc(doc(db, `users/${user.id}/tasks`, task.id), task)
    setTasks([task, ...tasks])
    setNewTaskText('')
    setShowAddTaskModal(false)
  }

  async function toggleTask(taskId: string) {
    if (!user) return
    
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    await updateDoc(doc(db, `users/${user.id}/tasks`, taskId), {
      completed: !task.completed
    })
    
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t))
  }

  async function deleteTask(taskId: string) {
    if (!user) return
    await deleteDoc(doc(db, `users/${user.id}/tasks`, taskId))
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  async function addFriend(friendId: string) {
    if (!user) return
    
    await setDoc(doc(db, 'friends', `${user.id}_${friendId}`), {
      userId: user.id,
      friendId,
      status: 'pending',
      createdAt: Date.now()
    })
    
    setAvailableFriends(availableFriends.filter(f => f.id !== friendId))
  }

  async function createGroup() {
    if (!user || !newGroupName.trim()) return
    
    const group: Group = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      members: [user.id],
      createdAt: Date.now()
    }
    
    await setDoc(doc(db, 'groups', group.id), group)
    setGroups([...groups, group])
    setNewGroupName('')
    setShowCreateGroupModal(false)
  }

  async function saveProfile() {
    if (!user) return
    
    await updateDoc(doc(db, 'users', user.id), {
      displayName: profileDisplayName,
      bio: profileBio
    })
    
    setUser({ ...user, displayName: profileDisplayName, bio: profileBio })
    setShowProfileModal(false)
  }

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  function getTodayStudyTime() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.getTime()
    
    return sessions
      .filter(s => s.startTime >= todayStart)
      .reduce((acc, s) => acc + s.seconds, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-primary-500 text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-dark-bg' : 'bg-gray-100'}`}>
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-500 mb-2">GoalChaser</h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Track focus. Chase goals.</p>
          </div>
          
          <div className={`p-6 rounded-2xl ${darkMode ? 'bg-dark-card' : 'bg-white shadow-lg'}`}>
            <h2 className="text-xl font-semibold mb-4">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {authMode === 'register' && (
              <>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full mb-3 p-3 rounded-lg bg-dark-surface border border-dark-border focus:border-primary-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full mb-3 p-3 rounded-lg bg-dark-surface border border-dark-border focus:border-primary-500 outline-none"
                />
              </>
            )}
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full mb-3 p-3 rounded-lg bg-dark-surface border border-dark-border focus:border-primary-500 outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full mb-4 p-3 rounded-lg bg-dark-surface border border-dark-border focus:border-primary-500 outline-none"
            />
            
            <button
              onClick={authMode === 'login' ? handleLogin : handleRegister}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 rounded-lg font-semibold transition-colors"
            >
              {authMode === 'login' ? 'Login' : 'Register'}
            </button>
            
            <p className="mt-4 text-center text-gray-400">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-primary-500 hover:underline"
              >
                {authMode === 'login' ? 'Register' : 'Login'}
              </button>
            </p>
          </div>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="mt-6 w-full py-2 text-gray-400 hover:text-white transition-colors"
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark-bg' : 'bg-gray-100'}`}>
      {/* Header */}
      <header className={`flex items-center justify-between p-4 ${darkMode ? 'bg-dark-surface' : 'bg-white shadow'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
            <span className="text-white font-bold">G</span>
          </div>
          <div>
            <h1 className="font-bold text-lg">GoalChaser</h1>
            <p className="text-xs text-gray-400">{user.displayName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-dark-card transition-colors"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setShowProfileModal(true)}
            className="p-2 rounded-lg hover:bg-dark-card transition-colors"
          >
            👤
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
          >
            🚪
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-20 max-w-2xl mx-auto">
        {/* Timer Tab */}
        {activeTab === 'timer' && (
          <div className="space-y-6">
            {/* Today's Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
                <p className="text-xs text-gray-400 mb-1">Today</p>
                <p className="text-xl font-bold text-primary-500">{formatTime(getTodayStudyTime())}</p>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
                <p className="text-xs text-gray-400 mb-1">Tasks</p>
                <p className="text-xl font-bold text-green-500">{tasks.filter(t => t.completed).length}/{tasks.length}</p>
              </div>
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
                <p className="text-xs text-gray-400 mb-1">Total</p>
                <p className="text-xl font-bold text-cyan-500">{formatTime(user.totalStudySeconds || 0)}</p>
              </div>
            </div>

            {/* Subject Selector */}
            <div className="flex gap-2 flex-wrap">
              {subjects.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(selectedSubject === sub.id ? '' : sub.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    selectedSubject === sub.id ? 'ring-2 ring-white' : ''
                  }`}
                  style={{ backgroundColor: sub.color + '40', color: sub.color }}
                >
                  {sub.name}
                </button>
              ))}
              <button
                onClick={() => setShowAddSubjectModal(true)}
                className="px-3 py-1 rounded-full text-sm border border-dashed border-gray-600 text-gray-400 hover:border-gray-400"
              >
                + Subject
              </button>
            </div>

            {/* Timer Display */}
            <div className="relative w-64 h-64 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={darkMode ? '#333' : '#e5e5e5'}
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(timerSeconds % 3600) / 100} 283`}
                  transform="rotate(-90 50 50)"
                  className="transition-all"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-400">{timerMode === 'stopwatch' ? 'STOPWATCH' : 'POMODORO'}</span>
                <span className="text-4xl font-mono font-bold">{formatTime(timerSeconds)}</span>
                <span className="text-xs text-gray-500">{selectedSubject ? subjects.find(s => s.id === selectedSubject)?.name : 'No subject'}</span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={resetTimer}
                className={`p-4 rounded-full ${darkMode ? 'bg-dark-card hover:bg-dark-border' : 'bg-white'}`}
              >
                🔄
              </button>
              <button
                onClick={startTimer}
                className={`p-6 rounded-full ${timerRunning ? 'bg-red-500' : 'bg-primary-500'} text-white text-2xl`}
              >
                {timerRunning ? '⏸️' : '▶️'}
              </button>
              <button
                onClick={() => setTimerMode(timerMode === 'stopwatch' ? 'pomodoro' : 'stopwatch')}
                className={`p-4 rounded-full ${darkMode ? 'bg-dark-card hover:bg-dark-border' : 'bg-white'}`}
              >
                🔄
              </button>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a task..."
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                className="flex-1 p-3 rounded-lg bg-dark-card border border-dark-border"
              />
              <button
                onClick={addTask}
                className="px-4 py-2 bg-primary-500 rounded-lg"
              >
                +
              </button>
            </div>

            <div className="space-y-2">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${darkMode ? 'bg-dark-card' : 'bg-white'}`}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      task.completed ? 'bg-green-500 border-green-500' : 'border-gray-500'
                    }`}
                  >
                    {task.completed && '✓'}
                  </button>
                  <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    {task.text}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    🗑️
                  </button>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-center text-gray-500 py-8">No tasks yet. Add one above!</p>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-xl ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold mb-4">Study Time</h3>
              <div className="space-y-2">
                {['Today', 'This Week', 'This Month'].map((period, i) => {
                  const total = sessions
                    .filter(s => {
                      const now = new Date()
                      if (i === 0) return s.startTime > now.setHours(0, 0, 0, 0)
                      if (i === 1) return s.startTime > now.setDate(now.getDate() - 7)
                      return s.startTime > now.setDate(now.getDate() - 30)
                    })
                    .reduce((acc, s) => acc + s.seconds, 0)
                  return (
                    <div key={period} className="flex justify-between">
                      <span className="text-gray-400">{period}</span>
                      <span className="font-semibold">{formatTime(total)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={`p-6 rounded-xl ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
              <h3 className="text-lg font-semibold mb-4">By Subject</h3>
              {subjects.length === 0 ? (
                <p className="text-gray-500">No subjects yet</p>
              ) : (
                subjects.map(sub => {
                  const total = sessions
                    .filter(s => s.subject === sub.id)
                    .reduce((acc, s) => acc + s.seconds, 0)
                  return (
                    <div key={sub.id} className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span>{sub.name}</span>
                        <span>{formatTime(total)}</span>
                      </div>
                      <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(100, (total / (user.totalStudySeconds || 1)) * 100)}%`, backgroundColor: sub.color }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Friends</h2>
              <button
                onClick={() => setShowAddFriendModal(true)}
                className="px-4 py-2 bg-primary-500 rounded-lg"
              >
                + Add
              </button>
            </div>

            <div className={`p-4 rounded-xl ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
              <h3 className="font-semibold mb-3">Your Friends</h3>
              {friends.length === 0 ? (
                <p className="text-gray-500">No friends yet</p>
              ) : (
                <div className="space-y-2">
                  {friends.map(friend => (
                    <div key={friend.id} className="flex items-center gap-3 p-2">
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                        {friend.avatar ? (
                          <img src={friend.avatar} className="w-full h-full rounded-full" />
                        ) : (
                          <span className="text-white font-bold">{friend.displayName[0]}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{friend.displayName}</p>
                        <p className="text-sm text-gray-400">@{friend.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`p-4 rounded-xl ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
              <h3 className="font-semibold mb-3">People You May Know</h3>
              {availableFriends.length === 0 ? (
                <p className="text-gray-500">No suggestions</p>
              ) : (
                <div className="space-y-2">
                  {availableFriends.slice(0, 5).map(friend => (
                    <div key={friend.id} className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm">
                          {friend.displayName[0]}
                        </div>
                        <span>{friend.displayName}</span>
                      </div>
                      <button
                        onClick={() => addFriend(friend.id)}
                        className="px-3 py-1 bg-primary-500 rounded-full text-sm"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Study Groups</h2>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="px-4 py-2 bg-primary-500 rounded-lg"
              >
                + Create
              </button>
            </div>

            {groups.length === 0 ? (
              <div className={`p-8 text-center rounded-xl ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
                <p className="text-gray-500 mb-4">No groups yet</p>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="px-4 py-2 bg-primary-500 rounded-lg"
                >
                  Create Group
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map(group => (
                  <div
                    key={group.id}
                    className={`p-4 rounded-xl ${darkMode ? 'bg-dark-card' : 'bg-white'}`}
                  >
                    <h3 className="font-semibold">{group.name}</h3>
                    <p className="text-sm text-gray-400">{group.members.length} members</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Admin Panel</h2>
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
              <h3 className="font-semibold mb-3">All Users</h3>
              <div className="space-y-2">
                {allUsers.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-2 border-b border-dark-border">
                    <div>
                      <p className="font-medium">{u.displayName}</p>
                      <p className="text-sm text-gray-400">@{u.username}</p>
                    </div>
                    <span className="text-primary-500">{formatTime(u.totalStudySeconds || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 flex justify-around p-3 ${darkMode ? 'bg-dark-surface' : 'bg-white shadow-lg'}`}>
        {[
          { id: 'timer', icon: '⏱️', label: 'Timer' },
          { id: 'tasks', icon: '✅', label: 'Tasks' },
          { id: 'stats', icon: '📊', label: 'Stats' },
          { id: 'friends', icon: '👥', label: 'Friends' },
          { id: 'groups', icon: '👨‍👩‍👧', label: 'Groups' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 ${activeTab === tab.id ? 'text-primary-500' : 'text-gray-400'}`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center gap-1 ${activeTab === 'admin' ? 'text-primary-500' : 'text-gray-400'}`}
          >
            <span className="text-xl">⚙️</span>
            <span className="text-xs">Admin</span>
          </button>
        )}
      </nav>

      {/* Modals */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className={`p-6 rounded-xl w-full max-w-md ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <input
              type="text"
              placeholder="Display Name"
              value={profileDisplayName}
              onChange={e => setProfileDisplayName(e.target.value)}
              className="w-full mb-3 p-3 rounded-lg bg-dark-surface border border-dark-border"
            />
            <textarea
              placeholder="Bio"
              value={profileBio}
              onChange={e => setProfileBio(e.target.value)}
              className="w-full mb-4 p-3 rounded-lg bg-dark-surface border border-dark-border"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 py-2 rounded-lg bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                className="flex-1 py-2 rounded-lg bg-primary-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className={`p-6 rounded-xl w-full max-w-md ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">Add Subject</h2>
            <input
              type="text"
              placeholder="Subject name"
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              className="w-full mb-4 p-3 rounded-lg bg-dark-surface border border-dark-border"
            />
            <div className="flex gap-2 mb-4">
              {['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899'].map(color => (
                <button
                  key={color}
                  onClick={() => setNewSubjectColor(color)}
                  className={`w-8 h-8 rounded-full ${newSubjectColor === color ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="flex-1 py-2 rounded-lg bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={addSubject}
                className="flex-1 py-2 rounded-lg bg-primary-500"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className={`p-6 rounded-xl w-full max-w-md ${darkMode ? 'bg-dark-card' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">Create Group</h2>
            <input
              type="text"
              placeholder="Group name"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              className="w-full mb-4 p-3 rounded-lg bg-dark-surface border border-dark-border"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="flex-1 py-2 rounded-lg bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                className="flex-1 py-2 rounded-lg bg-primary-500"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}