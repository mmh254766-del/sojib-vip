import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, getDocs, addDoc, Timestamp, setDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, AddFundRequest, UserProfile } from '../../types';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Clock, 
  TrendingUp,
  ArrowUpRight,
  Database,
  Activity
} from 'lucide-react';
import { formatPrice, cn } from '../../lib/utils';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    todaySales: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const items = ordersSnap.docs.map(d => d.data() as Order);

      // Aggregate chart data (last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0,0,0,0);
        return {
          date: d.toLocaleDateString('en-US', { weekday: 'short' }),
          millis: d.getTime(),
          sales: 0
        };
      });

      items.filter(o => o.status === 'completed').forEach(o => {
        const oDate = new Date(o.createdAt.toMillis());
        oDate.setHours(0,0,0,0);
        const day = last7Days.find(d => d.millis === oDate.getTime());
        if (day) day.sales += o.price;
      });

      setChartData(last7Days);

      const totalRevenue = items
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.price, 0);

      const today = new Date().setHours(0,0,0,0);
      const todaySales = items
        .filter(o => o.createdAt.toMillis() >= today && o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.price, 0);

      setStats({
        totalUsers: usersSnap.size,
        totalOrders: ordersSnap.size,
        totalRevenue,
        pendingPayments: 0, // Will be updated by another listener
        todaySales
      });
    };

    fetchData();

    const unsubFunds = onSnapshot(query(collection(db, 'addFundRequests'), where('status', '==', 'pending')), (snap) => {
      setStats(prev => ({ ...prev, pendingPayments: snap.size }));
    });

    return () => unsubFunds();
  }, [seeding]);

  const handleSeedData = async () => {
    if (!confirm('This will add example products and settings. Continue?')) return;
    setSeeding(true);
    try {
      // 1. Settings
      await setDoc(doc(db, 'settings', 'global'), {
        siteName: 'A.P.I. SHOP',
        welcomeBanner: 'Welcome to the #1 API Marketplace in Bangladesh! 🚀',
        bkashNumber: '01712345678',
        nagadNumber: '01912345678',
        minDeposit: 100,
        maxDeposit: 50000,
        isMaintenance: false,
        supportTelegram: 'https://t.me/example',
        popupAnnouncement: 'Ramadan Special Offer! Get 10% Extra Balance on bKash Deposits! 🌙'
      });

      // 2. Products
      const products = [
        {
          title: 'Premium SMS API v4',
          description: 'High-speed SMS API for OTP and Notifications. Supports all local operators.',
          price: 500,
          category: 'API',
          stock: 'available',
          discount: 10,
          images: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'],
          createdAt: Timestamp.now()
        },
        {
          title: 'Netflix Premium (1 Month)',
          description: 'UHD 4K Screen, Shared profile. No VPN needed.',
          price: 150,
          category: 'Subscription',
          stock: 'available',
          discount: 0,
          images: ['https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800'],
          createdAt: Timestamp.now()
        },
        {
          title: 'SEO Tools Pack',
          description: 'Ahrefs, Semrush, and Canva Pro included for 30 days.',
          price: 1200,
          category: 'Tools',
          stock: 'available',
          discount: 5,
          images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800'],
          createdAt: Timestamp.now()
        }
      ];

      for (const p of products) {
        await addDoc(collection(db, 'products'), p);
      }
      alert('Seed data added successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to seed data.');
    } finally {
      setSeeding(false);
    }
  };

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: "Today's Sales", value: formatPrice(stats.todaySales), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="text-sm text-slate-500">Welcome back, Admin.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSeedData}
            disabled={seeding}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
          >
            <Database className="h-4 w-4" />
            {seeding ? 'Seeding...' : 'Seed Data'}
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm border border-slate-100 hover:bg-slate-50">
            <Activity className="h-4 w-4" />
            Realtime Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100"
          >
            <div className={cn("inline-flex rounded-xl p-3 mb-4", card.bg, card.color)}>
              <card.icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">{card.value}</h3>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-green-600">
               <ArrowUpRight className="h-3 w-3" />
               <span>+12.5%</span>
               <span className="text-slate-400 font-normal">from last month</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
         {/* Sales Chart */}
         <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100 min-h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Sales Analytics (7 Days)</h3>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      tickFormatter={(value) => `৳${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                      formatter={(value: any) => [formatPrice(value), 'Sales']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="#2563eb" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                    />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Recent Orders Placeholder */}
         <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Orders</h3>
            <div className="space-y-4">
               {[1, 2, 3].map((item) => (
                 <div key={item} className="flex items-center justify-between py-2 border-b last:border-0 border-slate-50">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-full bg-slate-100" />
                       <div>
                          <p className="text-sm font-bold">New Purchase</p>
                          <p className="text-xs text-slate-400">2 minutes ago</p>
                       </div>
                    </div>
                    <p className="text-sm font-bold text-blue-600">৳500</p>
                 </div>
               ))}
            </div>
            <button className="mt-6 w-full py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
              View All Orders
            </button>
         </div>
      </div>
    </div>
  );
}
