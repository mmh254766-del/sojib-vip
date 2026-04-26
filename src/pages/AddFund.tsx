import { useEffect, useState } from 'react';
import { doc, getDoc, addDoc, collection, Timestamp, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { SiteSettings, UserProfile, AddFundRequest, FundRequestStatus } from '../types';
import { Wallet, Smartphone, Landmark, AlertCircle, History, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn, formatPrice } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function AddFund({ profile }: { profile: UserProfile | null }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [history, setHistory] = useState<AddFundRequest[]>([]);
  const [method, setMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [amount, setAmount] = useState('');
  const [tid, setTid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  useEffect(() => {
    // Fetch Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) setSettings(docSnap.data() as SiteSettings);
    });

    // Fetch History
    if (auth.currentUser) {
       const unsubHistory = onSnapshot(collection(db, 'addFundRequests'), (snap) => {
         const items = snap.docs
           .map(doc => ({ id: doc.id, ...doc.data() } as AddFundRequest))
           .filter(req => req.userId === auth.currentUser?.uid)
           .sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
         setHistory(items);
       });
       return () => { unsubSettings(); unsubHistory(); };
    }

    return () => unsubSettings();
  }, []);

  const handleSubmit = async () => {
    if (!auth.currentUser || !settings) return;
    
    setError(null);
    const numAmount = Number(amount);

    if (numAmount < settings.minDeposit) {
      setError(`Minimum deposit is ${formatPrice(settings.minDeposit)}`);
      return;
    }
    if (numAmount > settings.maxDeposit) {
      setError(`Maximum deposit is ${formatPrice(settings.maxDeposit)}`);
      return;
    }
    if (!tid.trim() || tid.length < 8) {
      setError('Please enter a valid Transaction ID.');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'addFundRequests'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        amount: numAmount,
        transactionId: tid,
        method: method,
        status: 'pending',
        createdAt: Timestamp.now(),
      });
      setSuccess(true);
      setAmount('');
      setTid('');
      setTimeout(() => {
        setSuccess(false);
        setActiveTab('history');
      }, 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'addFundRequests');
      setError('Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">My Wallet</h1>
        <div className="rounded-2xl bg-white p-1 shadow-sm border border-slate-100 flex">
           <button 
             onClick={() => setActiveTab('form')}
             className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", activeTab === 'form' ? "bg-blue-600 text-white" : "text-slate-500")}
           >
             Add Fund
           </button>
           <button 
             onClick={() => setActiveTab('history')}
             className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", activeTab === 'history' ? "bg-blue-600 text-white" : "text-slate-500")}
           >
             History
           </button>
        </div>
      </div>

      {profile && (
        <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-200">
           <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Current Balance</p>
           <h2 className="mt-1 text-4xl font-black">{formatPrice(profile.walletBalance)}</h2>
           <div className="mt-6 flex gap-4">
              <div className="flex-1 rounded-2xl bg-white/10 p-4 border border-white/10">
                 <p className="text-[10px] text-slate-400 font-bold uppercase">Total Spent</p>
                 <p className="text-lg font-black">{formatPrice(profile.totalSpent)}</p>
              </div>
              <div className="flex-1 rounded-2xl bg-white/10 p-4 border border-white/10">
                 <p className="text-[10px] text-slate-400 font-bold uppercase">Total Orders</p>
                 <p className="text-lg font-black">{profile.totalOrders}</p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'form' ? (
        <div className="space-y-6">
          {/* Method Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setMethod('bkash')}
              className={cn(
                "flex flex-col items-center gap-3 rounded-3xl border-2 p-5 transition-all text-center",
                method === 'bkash' ? "border-blue-600 bg-blue-50/50" : "border-slate-100 bg-white"
              )}
            >
              <div className="rounded-2xl bg-pink-500 p-3 text-white">
                 <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">bKash</p>
                <p className="text-[10px] text-slate-500">Send Money</p>
              </div>
            </button>
            <button 
              onClick={() => setMethod('nagad')}
              className={cn(
                "flex flex-col items-center gap-3 rounded-3xl border-2 p-5 transition-all text-center",
                method === 'nagad' ? "border-blue-600 bg-blue-50/50" : "border-slate-100 bg-white"
              )}
            >
              <div className="rounded-2xl bg-orange-500 p-3 text-white">
                 <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold">Nagad</p>
                <p className="text-[10px] text-slate-500">Send Money</p>
              </div>
            </button>
          </div>

          {/* Instructions */}
          <div className="rounded-3xl bg-blue-50 p-6 border border-blue-100">
             <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Instructions</h3>
             <p className="mt-3 text-sm text-slate-600 leading-relaxed">
               Please Send Money to the following number via your App or USSD:
             </p>
             <div className="mt-4 rounded-2xl bg-white p-4 flex items-center justify-between shadow-sm">
                <span className="text-lg font-black tracking-widest text-slate-800">
                  {method === 'bkash' ? settings?.bkashNumber || 'ADMIN_BKASH' : settings?.nagadNumber || 'ADMIN_NAGAD'}
                </span>
                <span className="text-[10px] font-bold uppercase text-blue-600">Personal</span>
             </div>
             <p className="mt-4 text-xs text-slate-400 italic">
               * After sending, copy the Transaction ID and paste it below.
             </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Amount (BDT)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-100 py-3.5 px-4 focus:border-blue-600 focus:outline-none font-bold text-lg"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Min: {formatPrice(settings?.minDeposit || 0)} | Max: {formatPrice(settings?.maxDeposit || 0)}
                </p>
             </div>
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Transaction ID</label>
                <input 
                  type="text" 
                  placeholder="Paste TrxID here"
                  value={tid}
                  onChange={(e) => setTid(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-100 py-3.5 px-4 focus:border-blue-600 focus:outline-none font-mono"
                />
             </div>
          </div>

          {error && <p className="text-center text-sm font-bold text-red-500 bg-red-50 py-3 rounded-2xl">{error}</p>}
          {success && <p className="text-center text-sm font-bold text-green-500 bg-green-50 py-3 rounded-2xl">Request Submitted Successfully!</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting || success}
            className="w-full rounded-2xl bg-blue-600 py-4 font-black shadow-xl shadow-blue-200 text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No deposit history found.</div>
          ) : (
            history.map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-3xl bg-white p-5 border border-slate-100">
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "rounded-2xl p-3",
                     req.method === 'bkash' ? "bg-pink-50 text-pink-500" : "bg-orange-50 text-orange-500"
                   )}>
                     <Landmark className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-800">{formatPrice(req.amount)}</p>
                     <p className="text-[10px] text-slate-400 font-mono">{req.transactionId}</p>
                   </div>
                </div>
                <div className="text-right">
                   <StatusBadge status={req.status} />
                   <p className="mt-1 text-[10px] text-slate-400">
                     {req.createdAt.toDate().toLocaleDateString()}
                   </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: FundRequestStatus }) {
  const configs = {
    pending: { icon: Clock, color: "text-amber-500 bg-amber-50", label: "Pending" },
    approved: { icon: CheckCircle2, color: "text-green-500 bg-green-50", label: "Approved" },
    rejected: { icon: XCircle, color: "text-red-500 bg-red-50", label: "Rejected" },
  };
  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", config.color)}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
}
