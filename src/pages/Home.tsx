import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, SiteSettings } from '../types';
import { ShoppingCart, Zap, Package, Crown } from 'lucide-react';
import { cn, formatPrice } from '../lib/utils';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Products
    const q = query(collection(db, 'products'));
    const unsubProducts = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    // Fetch Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SiteSettings);
      }
    });

    setLoading(false);
    return () => {
      unsubProducts();
      unsubSettings();
    };
  }, []);

  if (loading) return <div className="p-8 text-center">Loading marketplace...</div>;

  const categories = [
    { label: 'API', icon: Zap, color: 'text-yellow-500' },
    { label: 'Tools', icon: Package, color: 'text-blue-500' },
    { label: 'Subscription', icon: Crown, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      {settings?.welcomeBanner && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-blue-600 p-6 text-white shadow-xl shadow-blue-200"
        >
          <h2 className="text-2xl font-bold leading-tight">
            {settings.welcomeBanner}
          </h2>
          <p className="mt-2 text-blue-100 opacity-90">
            Premium APIs and Tools at your fingertips.
          </p>
        </motion.div>
      )}

      {/* Categories */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button 
            key={cat.label}
            className="flex flex-col items-center gap-2 min-w-[80px] rounded-2xl bg-white p-3 shadow-sm border border-slate-100"
          >
            <div className={cn("rounded-xl bg-slate-50 p-2", cat.color)}>
              <cat.icon className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-600">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800">Featured Products</h3>
          <Link to="/products" className="text-xs font-semibold text-blue-600">View All</Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-400">No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 pb-10">
            {products.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white p-2 shadow-sm border border-slate-100 transition-all hover:shadow-md"
    >
      <Link to={`/product/${product.id}`} className="absolute inset-0 z-10" />
      
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
        <img 
          src={product.images?.[0] || 'https://placehold.co/400x400/blue/white?text=Product'} 
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        {product.discount > 0 && (
          <div className="absolute left-2 top-2 rounded-lg bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            -{product.discount}%
          </div>
        )}
        <div className={cn(
          "absolute right-2 top-2 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase",
          product.stock === 'available' ? "bg-green-500 text-white" : "bg-slate-500 text-white"
        )}>
          {product.stock === 'available' ? 'In Stock' : 'Sold Out'}
        </div>
      </div>

      <div className="mt-3 px-1 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
          {product.category}
        </span>
        <h4 className="mt-1 line-clamp-1 text-sm font-bold text-slate-800">
          {product.title}
        </h4>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-base font-black text-blue-600">
            {formatPrice(product.price)}
          </span>
          <div className="rounded-full bg-blue-50 p-1.5 text-blue-600">
            <ShoppingCart className="h-3 w-3" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
