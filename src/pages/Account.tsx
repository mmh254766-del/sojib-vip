import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { 
  LogOut, 
  ChevronRight, 
  History, 
  Wallet, 
  Settings, 
  Shield, 
  HelpCircle,
  ShoppingBag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice, cn } from '../lib/utils';

export default function Account({ profile }: { profile: UserProfile | null }) {
  if (!profile) return null;

  const menuItems = [
    { label: 'Order History', icon: ShoppingBag, path: '/orders', color: 'text-blue-500 bg-blue-50' },
    { label: 'Transaction History', icon: History, path: '/add-fund', color: 'text-purple-500 bg-purple-50' },
    { label: 'Wallet Settings', icon: Wallet, path: '/add-fund', color: 'text-green-500 bg-green-50' },
    { label: 'Support & Help', icon: HelpCircle, path: '#', color: 'text-amber-500 bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="flex flex-col items-center bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
        <div className="relative">
          <img 
            src={profile.photoURL || 'https://ui-avatars.com/api/?name=' + profile.displayName} 
            alt={profile.displayName || 'User'} 
            className="h-24 w-24 rounded-full border-4 border-blue-50"
          />
          <div className={cn(
             "absolute bottom-0 right-0 h-6 w-6 rounded-full border-4 border-white flex items-center justify-center text-[10px]",
             profile.role === 'admin' ? "bg-blue-600 text-white" : "bg-green-500 text-white"
          )}>
            {profile.role === 'admin' ? <Shield className="h-3 w-3" /> : '✔'}
          </div>
        </div>
        <h2 className="mt-4 text-xl font-black text-slate-800">{profile.displayName}</h2>
        <p className="text-xs text-slate-400 font-medium">{profile.email}</p>
        
        {profile.role === 'admin' && (
          <Link 
            to="/admin" 
            className="mt-4 rounded-xl bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-lg shadow-blue-200 transition-transform active:scale-95"
          >
            Open Admin Panel
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
         <div className="rounded-3xl bg-blue-600 p-5 text-white shadow-lg shadow-blue-200">
            <p className="text-[10px] font-bold uppercase opacity-80">Wallet Balance</p>
            <p className="mt-1 text-xl font-black">{formatPrice(profile.walletBalance)}</p>
         </div>
         <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold uppercase text-slate-400">Total Spent</p>
            <p className="mt-1 text-xl font-black text-slate-800">{formatPrice(profile.totalSpent)}</p>
         </div>
      </div>

      {/* Menu */}
      <div className="rounded-3xl bg-white overflow-hidden shadow-sm border border-slate-100">
        {menuItems.map((item, i) => (
          <Link 
            key={i} 
            to={item.path}
            className={cn(
              "flex items-center gap-4 p-4 transition-colors hover:bg-slate-50",
              i !== menuItems.length - 1 && "border-b border-slate-50"
            )}
          >
            <div className={cn("rounded-2xl p-2.5", item.color)}>
               <item.icon className="h-5 w-5" />
            </div>
            <span className="flex-1 text-sm font-bold text-slate-700">{item.label}</span>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button 
        onClick={() => signOut(auth)}
        className="w-full flex items-center justify-center gap-3 rounded-2xl bg-red-50 py-4 font-bold text-red-600 hover:bg-red-100 transition-colors"
      >
        <LogOut className="h-5 w-5" />
        <span>Logout Account</span>
      </button>

      <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
        A.P.I. SHOP v1.0.0
      </p>
    </div>
  );
}
