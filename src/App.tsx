import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Students from './pages/Students';
import PPA from './pages/PPA';
import Attendance from './pages/Attendance';
import Planner from './pages/Planner';
import Reports from './pages/Reports';
import Maternal from './pages/Maternal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/students" replace />} />
          <Route path="students" element={<Students />} />
          <Route path="ppa" element={<PPA />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="planner" element={<Planner />} />
          <Route path="reports" element={<Reports />} />
          <Route path="maternal" element={<Maternal />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
