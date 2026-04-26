import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile } from './types';

// Layouts & Pages
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Orders from './pages/Orders';
import Account from './pages/Account';
import AddFund from './pages/AddFund';
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductManagement from './pages/admin/ProductManagement';
import UserManagement from './pages/admin/UserManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import OrderManagement from './pages/admin/OrderManagement';
import WebsiteSettings from './pages/admin/WebsiteSettings';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Sync/Fetch profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setProfile(userSnap.data() as UserProfile);
        } else {
          // Create new profile
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            walletBalance: 0,
            role: firebaseUser.email === 'carder1.0.00.1.987@gmail.com' ? 'admin' : 'user',
            totalSpent: 0,
            totalOrders: 0,
            createdAt: Timestamp.now(),
            lastLogin: Timestamp.now(),
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <Router>
      <Routes>
        {/* Public / User Routes */}
        <Route element={<MainLayout user={user} profile={profile} />}>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/orders" element={user ? <Orders /> : <Navigate to="/login" />} />
          <Route path="/account" element={user ? <Account profile={profile} /> : <Navigate to="/login" />} />
          <Route path="/add-fund" element={user ? <AddFund profile={profile} /> : <Navigate to="/login" />} />
        </Route>

        {/* Login Page */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={isAdmin ? <AdminLayout profile={profile} /> : <Navigate to="/" />}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="payments" element={<PaymentManagement />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="settings" element={<WebsiteSettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
