import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, Timestamp, updateDoc, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, UserProfile } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { ChevronLeft, MessageSquare, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const prodSnap = await getDoc(doc(db, 'products', id));
        if (prodSnap.exists()) {
          setProduct({ id: prodSnap.id, ...prodSnap.data() } as Product);
        }

        if (auth.currentUser) {
          const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userSnap.exists()) {
            setProfile(userSnap.data() as UserProfile);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handlePurchase = async () => {
    if (!product || !auth.currentUser || !profile) {
      navigate('/login');
      return;
    }

    if (profile.walletBalance < product.price) {
      setError('Insufficient wallet balance. Please add funds.');
      return;
    }

    if (!whatsapp.trim()) {
      setError('Please enter your WhatsApp number for delivery.');
      return;
    }

    setPurchasing(true);
    setError(null);

    try {
      // 1. Create Order
      const orderData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        productId: product.id,
        productTitle: product.title,
        price: product.price,
        status: 'pending',
        whatsappNumber: whatsapp,
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(db, 'orders'), orderData);

      // 2. Deduct Balance
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        walletBalance: increment(-product.price),
        totalSpent: increment(product.price),
        totalOrders: increment(1)
      });

      setSuccess(true);
      setTimeout(() => navigate('/orders'), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'orders');
      setError('Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading details...</div>;
  if (!product) return <div className="p-8 text-center text-red-500">Product not found.</div>;

  return (
    <div className="space-y-6 pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      {/* Image Slider (Simple) */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-slate-100 shadow-sm">
        <img 
          src={product.images?.[0] || 'https://placehold.co/800x600/blue/white?text=Product'} 
          alt={product.title}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-blue-600 backdrop-blur-sm">
            {product.category}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">{product.title}</h1>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600">{formatPrice(product.price)}</span>
            {product.discount > 0 && (
               <span className="text-sm font-medium text-slate-400 line-through">
                 {formatPrice(Math.round(product.price * (1 + product.discount/100)))}
               </span>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-blue-50 p-3">
            <Zap className="h-5 w-5 text-blue-600" />
            <div className="text-[10px]">
              <p className="font-bold text-blue-600">Fast Delivery</p>
              <p className="text-blue-400">Under 30 mins</p>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-green-50 p-3">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <div className="text-[10px]">
              <p className="font-bold text-green-600">Secure</p>
              <p className="text-green-400">100% Guaranteed</p>
            </div>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-slate-600">
           <p className="whitespace-pre-wrap">{product.description}</p>
        </div>

        <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-900 leading-relaxed italic">
            ⚠️ <b>Attention:</b> Once purchased, this product is non-refundable. Please check carefully before confirming.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
        <label className="block text-sm font-bold text-slate-700">WhatsApp Number</label>
        <div className="relative">
          <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="e.g. 01700000000"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full rounded-2xl border-2 border-slate-100 py-3.5 pl-12 pr-4 focus:border-blue-600 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Error/Success */}
      {error && <p className="text-center text-sm font-bold text-red-500 bg-red-50 py-3 rounded-2xl">{error}</p>}
      {success && <p className="text-center text-sm font-bold text-green-500 bg-green-50 py-3 rounded-2xl">Purchase Successful! Redirecting...</p>}

      {/* Sticky Button */}
      <div className="fixed bottom-20 left-4 right-4 z-40 max-w-lg mx-auto">
        <button
          onClick={handlePurchase}
          disabled={purchasing || success || product.stock === 'out_of_stock'}
          className={cn(
            "w-full rounded-2xl py-4 font-black shadow-xl transition-all active:scale-95 disabled:opacity-50",
            product.stock === 'available' ? "bg-blue-600 text-white shadow-blue-200" : "bg-slate-400 text-white"
          )}
        >
          {purchasing ? (
            <div className="flex items-center justify-center gap-2">
               <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
               <span>Processing...</span>
            </div>
          ) : product.stock === 'available' ? (
            `Confirm Purchase (${formatPrice(product.price)})`
          ) : (
            'Out of Stock'
          )}
        </button>
      </div>
    </div>
  );
}
