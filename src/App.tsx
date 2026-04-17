import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Students from './pages/Students';
import PPA from './pages/PPA';
import Attendance from './pages/Attendance';
import Planner from './pages/Planner';
import Reports from './pages/Reports';
import Maternal from './pages/Maternal';
import AdminPanel from './pages/AdminPanel';
import ActivationModal from './components/ActivationModal';
import { Loader2 } from 'lucide-react';

const ADMIN_EMAIL = 'monetizacionreymonfr2@gmail.com';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        
        // Listen to User Profile in Firestore
        const userRef = doc(db, 'users', authUser.uid);
        
        const unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            // Create profile if missing
            const newProfile = {
              email: authUser.email,
              isActive: authUser.email === ADMIN_EMAIL, // Admin is auto-active
              role: authUser.email === ADMIN_EMAIL ? 'admin' : 'teacher',
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          }
          setIsLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isAdmin = profile?.role === 'admin' || user?.email === ADMIN_EMAIL;
  
  // Subscription check: Must be active AND not expired (if teacher)
  const isSubscriptionValid = () => {
    if (isAdmin) return true;
    if (!profile?.isActive) return false;
    if (!profile?.expiresAt) return true; // Legacy or manual active without specific expiration
    
    try {
      // Check if expired - handle both Timestamp and Date
      let expirationDate: Date;
      if (profile.expiresAt?.toDate) {
        expirationDate = profile.expiresAt.toDate();
      } else if (profile.expiresAt instanceof Date) {
        expirationDate = profile.expiresAt;
      } else if (profile.expiresAt?.seconds) {
        expirationDate = new Date(profile.expiresAt.seconds * 1000);
      } else {
        expirationDate = new Date(profile.expiresAt);
      }

      if (isNaN(expirationDate.getTime())) return true;
      return new Date() < expirationDate;
    } catch (e) {
      console.error("Error checking subscription validity:", e);
      return true; // Default to active if error in parsing
    }
  };

  const isActive = isSubscriptionValid();

  return (
    <BrowserRouter>
      {user && !isActive && <ActivationModal userId={user.uid} email={user.email} />}
      <Routes>
        <Route path="/" element={<Layout isAdmin={isAdmin} />}>
          <Route index element={<Navigate to="/students" replace />} />
          <Route path="students" element={<Students />} />
          <Route path="ppa" element={<PPA />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="planner" element={<Planner />} />
          <Route path="reports" element={<Reports />} />
          <Route path="maternal" element={<Maternal />} />
          {isAdmin && <Route path="admin" element={<AdminPanel />} />}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
