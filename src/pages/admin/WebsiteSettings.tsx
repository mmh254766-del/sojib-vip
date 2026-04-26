import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SiteSettings } from '../../types';
import { Save, Globe, Smartphone, Shield, Bell, LifeBuoy } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function WebsiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'A.P.I. SHOP',
    welcomeBanner: 'Welcome to A.P.I. SHOP',
    bkashNumber: '',
    nagadNumber: '',
    minDeposit: 100,
    maxDeposit: 25000,
    isMaintenance: false,
    supportTelegram: '',
    popupAnnouncement: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SiteSettings);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  const sections = [
    { title: 'General Info', icon: Globe, fields: ['siteName', 'welcomeBanner'] },
    { title: 'Payment Numbers', icon: Smartphone, fields: ['bkashNumber', 'nagadNumber'] },
    { title: 'Limits', icon: Shield, fields: ['minDeposit', 'maxDeposit'] },
    { title: 'System', icon: LifeBuoy, fields: ['supportTelegram', 'popupAnnouncement'] },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Website Settings</h1>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
        >
          {saving ? 'Saving...' : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {message && (
        <div className={cn(
          "rounded-xl p-4 text-sm font-bold",
          message.type === 'success' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        )}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
         {/* General */}
         <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
               <div className="flex items-center gap-2 mb-6">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">General Config</h3>
               </div>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Site Name</label>
                     <input 
                       type="text" 
                       value={settings.siteName}
                       onChange={e => setSettings({...settings, siteName: e.target.value})}
                       className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Welcome Banner</label>
                     <textarea 
                       rows={2}
                       value={settings.welcomeBanner}
                       onChange={e => setSettings({...settings, welcomeBanner: e.target.value})}
                       className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                     />
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
               <div className="flex items-center gap-2 mb-6">
                  <Smartphone className="h-5 w-5 text-pink-600" />
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Payment Details</h3>
               </div>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">bKash Number</label>
                     <input 
                       type="text" 
                       value={settings.bkashNumber}
                       onChange={e => setSettings({...settings, bkashNumber: e.target.value})}
                       className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Nagad Number</label>
                     <input 
                       type="text" 
                       value={settings.nagadNumber}
                       onChange={e => setSettings({...settings, nagadNumber: e.target.value})}
                       className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none"
                     />
                  </div>
               </div>
            </div>
         </div>

         {/* Limits & System */}
         <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
               <div className="flex items-center gap-2 mb-6">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Wallet Constraints</h3>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Min Deposit</label>
                     <input 
                       type="number" 
                       value={settings.minDeposit}
                       onChange={e => setSettings({...settings, minDeposit: Number(e.target.value)})}
                       className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Max Deposit</label>
                     <input 
                       type="number" 
                       value={settings.maxDeposit}
                       onChange={e => setSettings({...settings, maxDeposit: Number(e.target.value)})}
                       className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none"
                     />
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
               <div className="flex items-center gap-2 mb-6">
                  <Bell className="h-5 w-5 text-amber-600" />
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Alerts & Maintenance</h3>
               </div>
               <div className="space-y-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Announcement Popup</label>
                     <input 
                       type="text" 
                       value={settings.popupAnnouncement}
                       onChange={e => setSettings({...settings, popupAnnouncement: e.target.value})}
                       className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none"
                       placeholder="Message for all users on login"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Support Telegram Link</label>
                     <input 
                       type="text" 
                       value={settings.supportTelegram}
                       onChange={e => setSettings({...settings, supportTelegram: e.target.value})}
                       className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none"
                     />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                     <span className="text-sm font-bold text-slate-700">Maintenance Mode</span>
                     <button 
                       onClick={() => setSettings({...settings, isMaintenance: !settings.isMaintenance})}
                       className={cn(
                         "h-6 w-11 rounded-full transition-colors relative",
                         settings.isMaintenance ? "bg-red-500" : "bg-slate-200"
                       )}
                     >
                       <div className={cn(
                         "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
                         settings.isMaintenance ? "left-6" : "left-1"
                       )} />
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
