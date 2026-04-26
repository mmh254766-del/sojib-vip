import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, increment, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AddFundRequest } from '../../types';
import { Check, X, Clock, Landmark, Search, History } from 'lucide-react';
import { formatPrice, cn } from '../../lib/utils';

export default function PaymentManagement() {
  const [requests, setRequests] = useState<AddFundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'addFundRequests'));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as AddFundRequest))
        .sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (req: AddFundRequest) => {
    if (!confirm(`Approve ${formatPrice(req.amount)} for ${req.userEmail}?`)) return;
    
    try {
      // 1. Update Request
      await updateDoc(doc(db, 'addFundRequests', req.id), { status: 'approved' });
      
      // 2. Update User Balance
      await updateDoc(doc(db, 'users', req.userId), {
        walletBalance: increment(req.amount)
      });

      // 3. Optional: Create Notification
      await addDoc(collection(db, 'notifications'), {
        userId: req.userId,
        message: `Your deposit of ${formatPrice(req.amount)} has been approved!`,
        type: 'info',
        isRead: false,
        createdAt: Timestamp.now()
      });

    } catch (err) {
      console.error(err);
      alert('Failed to approve payment.');
    }
  };

  const handleReject = async (reqId: string) => {
    if (!confirm('Reject this payment request?')) return;
    await updateDoc(doc(db, 'addFundRequests', reqId), { status: 'rejected' });
  };

  const filtered = requests.filter(r => 
    r.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pending = filtered.filter(r => r.status === 'pending');
  const other = filtered.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Payment Requests</h1>
        <div className="flex gap-2">
           <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-600">
             {pending.length} Pending
           </div>
        </div>
      </div>

      <div className="relative">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
         <input 
           type="text" 
           placeholder="Search by Transaction ID or Email..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="w-full rounded-2xl border border-slate-100 bg-white py-3.5 pl-12 pr-4 focus:border-blue-600 focus:outline-none shadow-sm"
         />
      </div>

      {/* Pending Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Pending Approvals
        </h2>
        {pending.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 text-slate-400">No pending requests.</div>
        ) : (
          pending.map(req => (
            <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
               <div className="flex items-center gap-4">
                  <div className={cn(
                    "rounded-2xl p-4",
                    req.method === 'bkash' ? "bg-pink-50 text-pink-500" : "bg-orange-50 text-orange-500"
                  )}>
                    <Landmark className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{req.userEmail}</p>
                    <p className="text-xs text-slate-400">TrxID: <span className="font-mono font-bold text-blue-600">{req.transactionId}</span></p>
                  </div>
               </div>
               <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">{formatPrice(req.amount)}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{req.method}</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => handleApprove(req)} className="rounded-xl bg-green-500 p-3 text-white hover:bg-green-600 transition-colors shadow-lg shadow-green-100">
                        <Check className="h-5 w-5" />
                     </button>
                     <button onClick={() => handleReject(req.id)} className="rounded-xl bg-red-50 p-3 text-red-500 hover:bg-red-100 transition-colors">
                        <X className="h-5 w-5" />
                     </button>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      {/* History Section */}
      <div className="space-y-4 pt-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <History className="h-4 w-4" />
          Processed History
        </h2>
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-100">
          <table className="w-full text-left text-sm">
             <thead className="bg-slate-50">
               <tr>
                 <th className="px-6 py-3 font-bold text-slate-500">Email</th>
                 <th className="px-6 py-3 font-bold text-slate-500">Amount</th>
                 <th className="px-6 py-3 font-bold text-slate-500">Method</th>
                 <th className="px-6 py-3 font-bold text-slate-500">Status</th>
                 <th className="px-6 py-3 font-bold text-slate-500">Date</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
               {other.map(req => (
                 <tr key={req.id}>
                   <td className="px-6 py-4 font-medium">{req.userEmail}</td>
                   <td className="px-6 py-4 font-bold">{formatPrice(req.amount)}</td>
                   <td className="px-6 py-4 uppercase text-xs font-bold">{req.method}</td>
                   <td className="px-6 py-4">
                     <span className={cn(
                       "rounded-full px-2 py-1 text-[10px] font-black uppercase",
                       req.status === 'approved' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                     )}>
                       {req.status}
                     </span>
                   </td>
                   <td className="px-6 py-4 text-slate-400 text-xs">
                     {req.createdAt.toDate().toLocaleDateString()}
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
