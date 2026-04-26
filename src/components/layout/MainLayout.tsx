import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { User } from 'firebase/auth';
import { Home, ShoppingBag, Wallet, User as UserIcon, LogIn, Bell, X } from 'lucide-react';
import { UserProfile, SiteSettings } from '../../types';
import { cn, formatPrice } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface MainLayoutProps {
  user: User | null;
  profile: UserProfile | null;
}

export default function MainLayout({ user, profile }: MainLayoutProps) {
  const location = useLocation();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SiteSettings;
        setSettings(data);
        // Show popup if not dismissed this session
        if (data.popupAnnouncement && !sessionStorage.getItem('announcementDismissed')) {
          setShowPopup(true);
        }
      }
    });
    return () => unsub();
  }, []);

  const dismissPopup = () => {
    setShowPopup(false);
    sessionStorage.setItem('announcementDismissed', 'true');
  };

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Orders', path: '/orders', icon: ShoppingBag },
    { label: 'Wallet', path: '/add-fund', icon: Wallet },
    { label: 'Account', path: '/account', icon: UserIcon },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Announcement Popup */}
      <AnimatePresence>
        {showPopup && settings?.popupAnnouncement && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-sm rounded-[32px] bg-white p-8 text-center shadow-2xl"
             >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                   <Bell className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Announcement</h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {settings.popupAnnouncement}
                </p>
                <button 
                  onClick={dismissPopup}
                  className="mt-8 w-full rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200"
                >
                   Got it
                </button>
                <button onClick={dismissPopup} className="absolute right-4 top-4 rounded-full p-2 text-slate-300 hover:bg-slate-50">
                   <X className="h-6 w-6" />
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-white/80 px-4 backdrop-blur-md">
        <Link to="/" className="text-xl font-bold tracking-tight text-blue-600">
          A.P.I. SHOP
        </Link>
        
        <div className="flex items-center gap-3">
          {profile ? (
            <Link 
              to="/add-fund" 
              className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-100"
            >
              <Wallet className="h-4 w-4" />
              <span>{formatPrice(profile.walletBalance)}</span>
            </Link>
          ) : (
            <Link to="/login" className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mx-auto max-w-lg px-4 pt-6"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t bg-white px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "fill-blue-50/10")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
