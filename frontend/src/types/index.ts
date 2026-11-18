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