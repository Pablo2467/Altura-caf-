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

export interface AdminCategory {
  id: number;
  nameEs: string;
  nameEn: string;
  sortOrder: number;
}

export interface AdminProduct extends Product {
  available: boolean;
  categoryId: number;
  category: { id: number; nameEs: string; nameEn: string };
}

export interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  branchId: number | null;
  createdAt: string;
}

export type RangeKey = 'today' | '7d' | '30d';

export interface DashboardData {
  range: RangeKey;
  revenue: number;
  orders: number;
  avgTicket: number;
  itemsSold: number;
  previous: { revenue: number; orders: number };
  byMethod: { method: PaymentMethod; amount: number; count: number }[];
  topProducts: {
    productId: number;
    nameEs: string;
    nameEn: string;
    quantity: number;
    revenue: number;
  }[];
  byHour: { hour: number; orders: number; revenue: number }[];
  byDay: { date: string; orders: number; revenue: number }[];
}

export interface SaleItem {
  quantity: number;
  unitPrice: number;
  nameEs: string;
  nameEn: string;
}

export interface SaleRecord {
  paymentId: number;
  orderId: number;
  paidAt: string;
  amount: number;
  method: PaymentMethod;
  tableNumber: number;
  waiter: string;
  items: SaleItem[];
}

export interface SalesHistoryResponse {
  total: number;
  page: number;
  pageSize: number;
  items: SaleRecord[];
}