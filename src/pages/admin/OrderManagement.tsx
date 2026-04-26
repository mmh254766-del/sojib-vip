import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, deleteDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { Search, ShoppingBag, Eye, Trash2, CheckCircle2, XCircle, Clock, Loader2, MessageSquare } from 'lucide-react';
import { formatPrice, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    await updateDoc(doc(db, 'orders', orderId), { status });
    setSelectedOrder(prev => prev ? { ...prev, status: status as any } : null);
  };

  const handleDelete = async (orderId: string) => {
    if (confirm('Delete this order record?')) {
      await deleteDoc(doc(db, 'orders', orderId));
      setSelectedOrder(null);
    }
  };

  const filtered = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.productTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Order Management</h1>
        <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-600">
          {orders.length} Total Orders
        </div>
      </div>

      <div className="relative">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
         <input 
           type="text" 
           placeholder="Search by Order ID, Email, or Product..."
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
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Order ID</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">User</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Product</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Amount</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-blue-600">#{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{order.userEmail.split('@')[0]}</p>
                    <p className="text-[10px] text-slate-400">{order.userEmail}</p>
                  </td>
                  <td className="px-6 py-4 truncate max-w-[150px] font-medium">{order.productTitle}</td>
                  <td className="px-6 py-4 font-bold text-blue-600">{formatPrice(order.price)}</td>
                  <td className="px-6 py-4">
                     <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4">
                     <button 
                       onClick={() => setSelectedOrder(order)}
                       className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors"
                     >
                       <Eye className="h-4 w-4" />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer Placeholder */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center lg:items-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-lg rounded-t-[32px] lg:rounded-[32px] bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Order Details</h2>
                <button onClick={() => setSelectedOrder(null)} className="rounded-full p-2 hover:bg-slate-100">
                   <XCircle className="h-6 w-6 text-slate-300" />
                </button>
              </div>

              <div className="space-y-6">
                 <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                       <span>Product</span>
                       <span>Price</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                       <p className="font-bold text-slate-800">{selectedOrder.productTitle}</p>
                       <p className="text-lg font-black text-blue-600">{formatPrice(selectedOrder.price)}</p>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Customer Info</p>
                    <div className="flex items-center gap-2">
                       <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          {selectedOrder.userEmail[0].toUpperCase()}
                       </div>
                       <div>
                          <p className="text-sm font-bold">{selectedOrder.userEmail}</p>
                          <div className="flex items-center gap-1 text-green-600 font-bold text-xs mt-0.5">
                             <MessageSquare className="h-3 w-3" />
                             <span>{selectedOrder.whatsappNumber}</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Update Status</p>
                    <div className="grid grid-cols-2 gap-3">
                       {['pending', 'processing', 'completed', 'cancelled'].map(s => (
                         <button 
                           key={s}
                           onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                           className={cn(
                             "rounded-xl py-3 px-4 text-xs font-bold capitalize transition-all border-2",
                             selectedOrder.status === s 
                               ? "border-blue-600 bg-blue-50 text-blue-600" 
                               : "border-slate-100 text-slate-500 hover:border-slate-200"
                           )}
                         >
                           {s}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="pt-4 border-t border-slate-50 flex gap-4">
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="flex-1 rounded-2xl bg-slate-900 py-4 font-bold text-white text-sm"
                    >
                      Done
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedOrder.id)}
                      className="rounded-2xl bg-red-50 px-6 py-4 font-bold text-red-500 text-sm hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    pending: { icon: Clock, color: "text-amber-500 bg-amber-50", label: "Pending" },
    processing: { icon: Loader2, color: "text-blue-500 bg-blue-50", label: "Processing" },
    completed: { icon: CheckCircle2, color: "text-green-500 bg-green-50", label: "Completed" },
    cancelled: { icon: XCircle, color: "text-red-500 bg-red-50", label: "Cancelled" },
  };
  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", config.color)}>
      <Icon className={cn("h-3 w-3", status === 'processing' && "animate-spin")} />
      <span>{config.label}</span>
    </div>
  );
}
