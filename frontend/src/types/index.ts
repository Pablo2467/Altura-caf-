export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  imageUrl: string | null;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface Product {
  id: number;
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  price: number;
  imageUrl: string | null;
}

export interface Category {
  id: number;
  nameEs: string;
  nameEn: string;
  sortOrder: number;
  products: Product[];
}

export type Role = 'ADMIN' | 'WAITER' | 'BARISTA';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  branchId: number | null;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export type TableStatus = 'AVAILABLE' | 'OCCUPIED';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

export interface TableSummary {
  id: number;
  number: number;
  status: TableStatus;
  orderId: number | null;
  orderStatus: OrderStatus | null;
  total: number;
  openedAt: string | null;
}

export interface OrderItemDetail {
  id: number;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  product: Product;
}

export interface OrderDetail {
  id: number;
  status: OrderStatus;
  notes: string | null;
  items: OrderItemDetail[];
}

export interface TableOrderResponse {
  table: { id: number; number: number; status: TableStatus };
  order: OrderDetail | null;
  total: number;
}

export interface BaristaOrderItem {
  id: number;
  quantity: number;
  notes: string | null;
  product: { nameEs: string; nameEn: string };
}

export interface BaristaOrder {
  id: number;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  table: { number: number };
  waiter: { name: string };
  items: BaristaOrderItem[];
}