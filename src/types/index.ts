import { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'admin';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type FundRequestStatus = 'pending' | 'approved' | 'rejected';
export type ProductCategory = 'API' | 'Tools' | 'Subscription';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  walletBalance: number;
  role: UserRole;
  totalSpent: number;
  totalOrders: number;
  createdAt: Timestamp;
  lastLogin: Timestamp;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  stock: 'available' | 'out_of_stock';
  category: ProductCategory;
  discount: number;
  createdAt: Timestamp;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  productId: string;
  productTitle: string;
  price: number;
  status: OrderStatus;
  whatsappNumber: string;
  createdAt: Timestamp;
}

export interface AddFundRequest {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  transactionId: string;
  method: 'bkash' | 'nagad';
  status: FundRequestStatus;
  createdAt: Timestamp;
}

export interface SiteSettings {
  siteName: string;
  welcomeBanner: string;
  bkashNumber: string;
  nagadNumber: string;
  minDeposit: number;
  maxDeposit: number;
  isMaintenance: boolean;
  supportTelegram: string;
  popupAnnouncement: string;
}

export interface Notification {
  id: string;
  userId: string; // 'all' or specific uid
  message: string;
  type: 'info' | 'alert';
  isRead: boolean;
  createdAt: Timestamp;
}
