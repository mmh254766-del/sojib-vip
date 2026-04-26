import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types';
import { Plus, Search, Edit2, Trash2, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { formatPrice, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'API',
    stock: 'available',
    discount: '0',
    imageUrls: ['']
  });

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openModal = (prod: Product | null = null) => {
    if (prod) {
      setEditingProduct(prod);
      setFormData({
        title: prod.title,
        description: prod.description,
        price: prod.price.toString(),
        category: prod.category,
        stock: prod.stock,
        discount: prod.discount.toString(),
        imageUrls: prod.images.length > 0 ? prod.images : ['']
      });
    } else {
      setEditingProduct(null);
      setFormData({
        title: '',
        description: '',
        price: '',
        category: 'API',
        stock: 'available',
        discount: '0',
        imageUrls: ['']
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: Number(formData.price),
      discount: Number(formData.discount),
      images: formData.imageUrls.filter(u => u.trim() !== ''),
      createdAt: editingProduct ? editingProduct.createdAt : Timestamp.now()
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data);
      } else {
        await addDoc(collection(db, 'products'), data);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const addImageUrl = () => {
    setFormData({ ...formData, imageUrls: [...formData.imageUrls, ''] });
  };

  const updateImageUrl = (index: number, val: string) => {
    const urls = [...formData.imageUrls];
    urls[index] = val;
    setFormData({ ...formData, imageUrls: urls });
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Product Management</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-slate-100 bg-white py-3.5 pl-12 pr-4 focus:border-blue-600 focus:outline-none shadow-sm"
        />
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Product</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Price</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Stock</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <img src={p.images?.[0] || 'https://placehold.co/40x40'} alt="" className="h-10 w-10 rounded-lg object-cover" />
                       <span className="font-bold text-slate-800">{p.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-600">{formatPrice(p.price)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex rounded-full px-2 py-1 text-[10px] font-black uppercase",
                      p.stock === 'available' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    )}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-500">{p.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <button onClick={() => openModal(p)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit2 className="h-4 w-4" />
                       </button>
                       <button onClick={() => handleDelete(p.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-4 w-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-800">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setModalOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                   <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Title</label>
                      <input 
                        required
                        type="text" 
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Price (BDT)</label>
                      <input 
                        required
                        type="number" 
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                        className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Category</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none"
                      >
                        <option value="API">API</option>
                        <option value="Tools">Tools</option>
                        <option value="Subscription">Subscription</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Stock Status</label>
                      <select 
                        value={formData.stock}
                        onChange={e => setFormData({...formData, stock: e.target.value})}
                        className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none"
                      >
                        <option value="available">Available</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Discount (%)</label>
                      <input 
                        type="number" 
                        value={formData.discount}
                        onChange={e => setFormData({...formData, discount: e.target.value})}
                        className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Description</label>
                   <textarea 
                     required
                     rows={4}
                     value={formData.description}
                     onChange={e => setFormData({...formData, description: e.target.value})}
                     className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none"
                   />
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-400 uppercase">Product Images (URLs)</label>
                      <button type="button" onClick={addImageUrl} className="text-xs font-bold text-blue-600">+ Add URL</button>
                   </div>
                   {formData.imageUrls.map((url, i) => (
                     <div key={i} className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="https://..."
                          value={url}
                          onChange={e => updateImageUrl(i, e.target.value)}
                          className="flex-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-medium focus:bg-white focus:outline-none"
                        />
                     </div>
                   ))}
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
