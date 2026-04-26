import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Order } from '../types';
import { cn, formatPrice } from '../lib/utils';
import { Clock, CheckCircle2, XCircle, Loader2, Package, Search } from 'lucide-react';
import { motion } from 'motion/react';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter(o => 
    o.productTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">My Orders</h1>
        <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-600">
           {orders.length} Total
        </div>
      </div>

      {/* Search */}
      <div className="relative">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
         <input 
           type="text" 
           placeholder="Search orders..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="w-full rounded-2xl border border-slate-100 bg-white py-3.5 pl-12 pr-4 focus:border-blue-600 focus:outline-none shadow-sm"
         />
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center border-2 border-dashed border-slate-200">
             <Package className="mx-auto h-12 w-12 text-slate-200" />
             <p className="mt-4 text-slate-400 font-medium">No orders found.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="group overflow-hidden rounded-3xl bg-white p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                     <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 line-clamp-1">{order.productTitle}</h3>
                    <p className="text-[10px] text-slate-400">Order ID: {order.id.slice(0, 8)}</p>
                  </div>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                <div className="text-[10px]">
                   <p className="font-bold text-slate-400 uppercase tracking-wider">Purchased On</p>
                   <p className="font-medium text-slate-600">{order.createdAt.toDate().toLocaleString()}</p>
                </div>
                <p className="text-lg font-black text-blue-600">
                  {formatPrice(order.price)}
                </p>
              </div>

              {order.status === 'pending' && (
                <div className="mt-4 rounded-2xl bg-amber-50 p-3 flex items-center gap-2 text-[10px] font-bold text-amber-600">
                   <Clock className="h-3 w-3" />
                   <span>Processing may take up to 30 mins.</span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
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
