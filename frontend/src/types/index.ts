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