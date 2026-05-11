'use client'

import { useState, useEffect, useRef } from 'react'
import { initializeApp } from 'firebase/app'
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged
} from 'firebase/auth'
import { 
  getFirestore, collection, doc, setDoc, getDoc, getDocs,
  query, where, orderBy, limit, updateDoc, deleteDoc, addDoc
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCnu-o3yuCI48GCwdgz-N3iFJJBeEmOy24",
  authDomain: "goal-chaser-beb0b.firebaseapp.com",
  projectId: "goal-chaser-beb0b",
  storageBucket: "goal-chaser-beb0b.firebasestorage.app",
  messagingSenderId: "943232218026",
  appId: "1:943232218026:web:552042c3d0b01794c271d3"
}

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

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#f97316', '#3b82f6']

const ICONS = {
  timer: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
      <path strokeLinecap="round" strokeWidth="2" d="M12 6v6l4 2"/>
    </svg>
  ),
  tasks: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
    </svg>
  ),
  stats: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
    </svg>
  ),
  friends: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
    </svg>
  ),
  groups: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
    </svg>
  ),
  admin: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
      <path strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
  profile: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </svg>
  ),
  theme: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
    </svg>
  ),
  logout: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
    </svg>
  ),
  add: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M12 4v16m8-8H4"/>
    </svg>
  ),
  close: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  ),
  play: (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z"/>
    </svg>
  ),
  pause: (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
    </svg>
  ),
  reset: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M1 4v6h6M23 20v-6h-6"/>
      <path strokeWidth="2" d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
    </svg>
  ),
  trash: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="3" d="M5 13l4 4L19 7"/>
    </svg>
  ),
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
    </svg>
  ),
  send: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
    </svg>
  ),
  link: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
    </svg>
  ),
}

export default function GoalChaser() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')

  const [darkMode, setDarkMode] = useState(true)

  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'pomodoro'>('stopwatch')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [pomodoroSettings, setPomodoroSettings] = useState({ focus: 25, break: 5, sessions: 4 })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [availableFriends, setAvailableFriends] = useState<Friend[]>([])

  const [activeTab, setActiveTab] = useState('timer')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [showAddFriendModal, setShowAddFriendModal] = useState(false)

  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectColor, setNewSubjectColor] = useState('#8b5cf6')
  const [newTaskText, setNewTaskText] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [profileDisplayName, setProfileDisplayName] = useState('')
  const [profileBio, setProfileBio] = useState('')
  const [friendSearch, setFriendSearch] = useState('')

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
        
        await loadSubjects(uid)
        await loadTasks(uid)
        await loadSessions(uid)
        await loadFriends(uid)
        await loadGroups(uid)
      } else {
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
    const q = query(collection(db, 'sessions'), where('userId', '==', userId), limit(100))
    const snapshot = await getDocs(q)
    const allSessions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Session))
    allSessions.sort((a, b) => b.startTime - a.startTime)
    setSessions(allSessions)
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
    
    await addDoc(collection(db, 'sessions'), session)
    
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
    loadFriends(user.id)
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

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-dark)]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] animate-pulse-glow flex items-center justify-center">
            <span className="text-3xl font-bold text-white">G</span>
          </div>
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-dark)] px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-white">G</span>
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-2">GoalChaser</h1>
            <p className="text-[var(--text-secondary)]">Track focus. Chase goals. Grow together.</p>
          </div>
          
          <div className="glass-card p-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              {authMode === 'login' ? 'Welcome Back 👋' : 'Create Account'}
            </h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
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
                  className="input-field mb-4"
                />
                <input
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="input-field mb-4"
                />
              </>
            )}
            
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field mb-4"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-field mb-6"
            />
            
            <button
              onClick={authMode === 'login' ? handleLogin : handleRegister}
              className="btn-gradient w-full"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
            
            <p className="mt-6 text-center text-[var(--text-secondary)]">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-[var(--primary)] font-semibold hover:underline"
              >
                {authMode === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="mt-8 w-full py-3 text-[var(--text-secondary)] hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </div>
    )
  }

  const navItems = [
    { id: 'timer', icon: ICONS.timer, label: 'Timer' },
    { id: 'tasks', icon: ICONS.tasks, label: 'Tasks' },
    { id: 'stats', icon: ICONS.stats, label: 'Stats' },
    { id: 'friends', icon: ICONS.friends, label: 'Friends' },
    { id: 'groups', icon: ICONS.groups, label: 'Groups' },
    ...(isAdmin ? [{ id: 'admin', icon: ICONS.admin, label: 'Admin' }] : []),
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-dark)]">
      {/* Header */}
      <header className="glass-card sticky top-0 z-40 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">G</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">GoalChaser</h1>
              <p className="text-xs text-[var(--text-secondary)]">{user.displayName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="icon-btn">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={() => setShowProfileModal(true)} className="icon-btn">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-sm font-semibold">
                {getInitials(user.displayName)}
              </div>
            </button>
            <button onClick={handleLogout} className="icon-btn text-red-400">
              {ICONS.logout}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 pb-24 max-w-2xl mx-auto">
        {/* Timer Tab */}
        {activeTab === 'timer' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="stat-card text-center">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Today</p>
                <p className="text-xl font-bold text-[var(--primary)]">{formatTime(getTodayStudyTime())}</p>
              </div>
              <div className="stat-card text-center">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Tasks</p>
                <p className="text-xl font-bold text-green-400">{tasks.filter(t => t.completed).length}/{tasks.length}</p>
              </div>
              <div className="stat-card text-center">
                <p className="text-xs text-[var(--text-secondary)] mb-1">Total</p>
                <p className="text-xl font-bold text-[var(--secondary)]">{formatTime(user.totalStudySeconds || 0)}</p>
              </div>
            </div>

            {/* Subject Selector */}
            <div className="flex gap-2 flex-wrap">
              {subjects.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(selectedSubject === sub.id ? '' : sub.id)}
                  className={`subject-chip ${selectedSubject === sub.id ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: sub.color + '30', color: sub.color }}
                >
                  {sub.name}
                </button>
              ))}
              <button
                onClick={() => setShowAddSubjectModal(true)}
                className="subject-chip bg-[var(--border-dark)] text-[var(--text-secondary)] hover:text-white"
              >
                + Add
              </button>
            </div>

            {/* Timer Display */}
            <div className="relative w-64 h-64 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="var(--border-dark)"
                  strokeWidth="4"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min((timerSeconds % 3600) / 36, 283)} 283`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">{timerMode}</span>
                <span className="timer-display gradient-text">{formatTime(timerSeconds)}</span>
                <span className="text-xs text-[var(--text-muted)] mt-2">
                  {selectedSubject ? subjects.find(s => s.id === selectedSubject)?.name : 'No subject'}
                </span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={resetTimer}
                className="p-4 rounded-2xl bg-[var(--card-dark)] hover:bg-[var(--border-dark)] transition-all"
              >
                {ICONS.reset}
              </button>
              <button
                onClick={startTimer}
                className={`p-6 rounded-2xl text-white transition-all ${
                  timerRunning 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30' 
                    : 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] shadow-lg shadow-purple-500/30 animate-pulse-glow'
                }`}
              >
                {timerRunning ? ICONS.pause : ICONS.play}
              </button>
              <button
                onClick={() => setTimerMode(timerMode === 'stopwatch' ? 'pomodoro' : 'stopwatch')}
                className="p-4 rounded-2xl bg-[var(--card-dark)] hover:bg-[var(--border-dark)] transition-all"
              >
                <span className="text-sm">🔄</span>
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
                placeholder="Add a new task..."
                value={newTaskText}
                onChange={e => setNewTaskText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                className="input-field flex-1"
              />
              <button
                onClick={addTask}
                className="px-4 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] rounded-xl text-white"
              >
                {ICONS.add}
              </button>
            </div>

            <div className="space-y-2">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="glass-card flex items-center gap-3 p-4 card-hover"
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      task.completed 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-[var(--border-dark)] hover:border-green-500'
                    }`}
                  >
                    {task.completed && <span className="text-white">{ICONS.check}</span>}
                  </button>
                  <span className={`flex-1 ${task.completed ? 'line-through text-[var(--text-muted)]' : ''}`}>
                    {task.text}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                  >
                    {ICONS.trash}
                  </button>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--card-dark)] flex items-center justify-center">
                    {ICONS.tasks}
                  </div>
                  <p className="text-[var(--text-secondary)]">No tasks yet. Add one above!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Study Time Overview</h3>
              <div className="space-y-4">
                {['Today', 'This Week', 'This Month'].map((period, i) => {
                  const total = sessions
                    .filter(s => {
                      const now = new Date()
                      if (i === 0) return s.startTime > new Date(now.setHours(0,0,0,0)).getTime()
                      if (i === 1) return s.startTime > new Date(now.setDate(now.getDate() - 7)).getTime()
                      return s.startTime > new Date(now.setDate(now.getDate() - 30)).getTime()
                    })
                    .reduce((acc, s) => acc + s.seconds, 0)
                  return (
                    <div key={period} className="flex justify-between items-center p-3 bg-[var(--surface-dark)] rounded-xl">
                      <span className="text-[var(--text-secondary)]">{period}</span>
                      <span className="font-bold gradient-text">{formatTime(total)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">By Subject</h3>
              {subjects.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center py-4">No subjects yet</p>
              ) : (
                <div className="space-y-4">
                  {subjects.map(sub => {
                    const total = sessions
                      .filter(s => s.subject === sub.id)
                      .reduce((acc, s) => acc + s.seconds, 0)
                    const percent = Math.min(100, (total / (user.totalStudySeconds || 1)) * 100)
                    return (
                      <div key={sub.id}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{sub.name}</span>
                          <span className="text-[var(--text-secondary)]">{formatTime(total)}</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${percent}%`, backgroundColor: sub.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
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
                className="px-4 py-2 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] rounded-xl text-white font-medium"
              >
                + Add
              </button>
            </div>

            <div className="glass-card p-4">
              <h3 className="font-semibold mb-3">Your Friends ({friends.length})</h3>
              {friends.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center py-4">No friends yet</p>
              ) : (
                <div className="space-y-2">
                  {friends.map(friend => (
                    <div key={friend.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-semibold">
                        {getInitials(friend.displayName)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{friend.displayName}</p>
                        <p className="text-sm text-[var(--text-secondary)]">@{friend.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card p-4">
              <h3 className="font-semibold mb-3">People You May Know</h3>
              {availableFriends.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center py-4">No suggestions</p>
              ) : (
                <div className="space-y-2">
                  {availableFriends.slice(0, 5).map(friend => (
                    <div key={friend.id} className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-orange)] to-[var(--accent-amber)] flex items-center justify-center text-white text-xs font-semibold">
                          {getInitials(friend.displayName)}
                        </div>
                        <span>{friend.displayName}</span>
                      </div>
                      <button
                        onClick={() => addFriend(friend.id)}
                        className="px-3 py-1 bg-[var(--primary)]/20 text-[var(--primary)] rounded-full text-sm font-medium hover:bg-[var(--primary)]/30"
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
                className="px-4 py-2 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] rounded-xl text-white font-medium"
              >
                + Create
              </button>
            </div>

            {groups.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--card-dark)] flex items-center justify-center text-[var(--text-muted)]">
                  {ICONS.groups}
                </div>
                <p className="text-[var(--text-secondary)] mb-4">No groups yet</p>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] rounded-xl text-white font-medium"
                >
                  Create Group
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map(group => (
                  <div key={group.id} className="glass-card p-4 card-hover">
                    <h3 className="font-semibold text-lg">{group.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{group.members.length} members</p>
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
            <div className="glass-card p-4">
              <h3 className="font-semibold mb-3">All Users ({allUsers.length})</h3>
              <div className="space-y-2">
                {allUsers.map(u => (
                  <div key={u.id} className="flex justify-between items-center p-2 border-b border-[var(--border-dark)]">
                    <div>
                      <p className="font-medium">{u.displayName}</p>
                      <p className="text-sm text-[var(--text-secondary)]">@{u.username}</p>
                    </div>
                    <span className="text-[var(--primary)]">{formatTime(u.totalStudySeconds || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav fixed bottom-0 left-0 right-0">
        <div className="max-w-2xl mx-auto flex justify-around p-2">
          {navItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'text-[var(--primary)] bg-[var(--primary)]/10' 
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modals */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
            <input
              type="text"
              placeholder="Display Name"
              value={profileDisplayName}
              onChange={e => setProfileDisplayName(e.target.value)}
              className="input-field mb-3"
            />
            <textarea
              placeholder="Bio"
              value={profileBio}
              onChange={e => setProfileBio(e.target.value)}
              className="input-field mb-4"
              rows={3}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowProfileModal(false)} className="flex-1 py-3 rounded-xl bg-[var(--border-dark)]">
                Cancel
              </button>
              <button onClick={saveProfile} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddSubjectModal && (
        <div className="modal-overlay" onClick={() => setShowAddSubjectModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Add Subject</h2>
            <input
              type="text"
              placeholder="Subject name"
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              className="input-field mb-4"
            />
            <div className="flex gap-2 mb-4">
              {COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNewSubjectColor(color)}
                  className={`w-8 h-8 rounded-full ${newSubjectColor === color ? 'ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddSubjectModal(false)} className="flex-1 py-3 rounded-xl bg-[var(--border-dark)]">
                Cancel
              </button>
              <button onClick={addSubject} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white">
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateGroupModal && (
        <div className="modal-overlay" onClick={() => setShowCreateGroupModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Create Group</h2>
            <input
              type="text"
              placeholder="Group name"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              className="input-field mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCreateGroupModal(false)} className="flex-1 py-3 rounded-xl bg-[var(--border-dark)]">
                Cancel
              </button>
              <button onClick={createGroup} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}