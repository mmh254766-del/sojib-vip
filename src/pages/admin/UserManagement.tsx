import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, deleteDoc, increment, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile } from '../../types';
import { Search, Users, Shield, ShieldCheck, Mail, LogOut, Wallet, MoreVertical, Ban, Trash2, Edit } from 'lucide-react';
import { formatPrice, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editBalance, setEditBalance] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ ...d.data() } as UserProfile)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateBalance = async (type: 'add' | 'deduct') => {
    if (!selectedUser || isNaN(Number(editBalance))) return;
    const amount = type === 'add' ? Number(editBalance) : -Number(editBalance);
    
    await updateDoc(doc(db, 'users', selectedUser.uid), {
      walletBalance: increment(amount)
    });
    setEditBalance('');
    setSelectedUser(prev => prev ? { ...prev, walletBalance: prev.walletBalance + amount } : null);
  };

  const toggleAdmin = async (user: UserProfile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    await updateDoc(doc(db, 'users', user.uid), { role: newRole });
    setSelectedUser(prev => prev ? { ...prev, role: newRole as any } : null);
  };

  const handleDelete = async (uid: string) => {
    if (confirm('Permanently delete this user?')) {
      await deleteDoc(doc(db, 'users', uid));
      setSelectedUser(null);
    }
  };

  const filtered = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-600">
          {users.length} Registered Users
        </div>
      </div>

      <div className="relative">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
         <input 
           type="text" 
           placeholder="Search by Email or Name..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="w-full rounded-2xl border border-slate-100 bg-white py-3.5 pl-12 pr-4 focus:border-blue-600 focus:outline-none shadow-sm"
         />
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">User</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Role</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Balance</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Stats</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(user => (
                <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="" className="h-9 w-9 rounded-full" />
                       <div>
                          <p className="font-bold text-slate-800">{user.displayName || 'Unnamed'}</p>
                          <p className="text-[10px] text-slate-400">{user.email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={cn(
                       "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase",
                       user.role === 'admin' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                     )}>
                       {user.role === 'admin' && <Shield className="h-3 w-3" />}
                       {user.role}
                     </span>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-800">{formatPrice(user.walletBalance)}</td>
                  <td className="px-6 py-4">
                     <div className="text-[10px] text-slate-500">
                        <p>Orders: <span className="font-bold">{user.totalOrders}</span></p>
                        <p>Spent: <span className="font-bold text-blue-600">{formatPrice(user.totalSpent)}</span></p>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <button 
                       onClick={() => setSelectedUser(user)}
                       className="rounded-lg bg-slate-50 p-2 text-slate-600 hover:bg-slate-200 transition-colors"
                     >
                       <Edit className="h-4 w-4" />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl"
            >
              <div className="text-center mb-8">
                 <img src={selectedUser.photoURL || ''} alt="" className="h-20 w-20 rounded-full mx-auto border-4 border-slate-50 shadow-sm" />
                 <h2 className="mt-4 text-xl font-black text-slate-800">{selectedUser.displayName}</h2>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedUser.role}</p>
              </div>

              <div className="space-y-6">
                 {/* Balance Control */}
                 <div className="rounded-2xl bg-slate-50 p-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">Manage Balance</p>
                    <div className="flex gap-4">
                       <input 
                         type="number" 
                         placeholder="Amount"
                         value={editBalance}
                         onChange={e => setEditBalance(e.target.value)}
                         className="flex-1 rounded-xl border-2 border-slate-100 bg-white px-4 py-2 text-sm font-bold focus:border-blue-600 focus:outline-none"
                       />
                       <div className="flex gap-2">
                          <button onClick={() => handleUpdateBalance('add')} className="rounded-xl bg-green-500 px-4 py-2 text-white font-bold">+</button>
                          <button onClick={() => handleUpdateBalance('deduct')} className="rounded-xl bg-red-500 px-4 py-2 text-white font-bold">-</button>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => toggleAdmin(selectedUser)}
                      className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-100 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                       <ShieldCheck className={cn("h-4 w-4", selectedUser.role === 'admin' ? "text-blue-600" : "text-slate-300")} />
                       {selectedUser.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedUser.uid)}
                      className="flex items-center justify-center gap-2 rounded-2xl border-2 border-red-50 py-3 text-xs font-bold text-red-500 hover:bg-red-50"
                    >
                       <Trash2 className="h-4 w-4" />
                       Delete Account
                    </button>
                 </div>

                 <button 
                   onClick={() => setSelectedUser(null)}
                   className="w-full py-4 text-sm font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                 >
                   Close
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
