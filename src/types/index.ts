// Sanity types
export interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
}

export interface SanitySlug {
  _type: "slug";
  current: string;
}

export interface Author {
  name: string;
  image?: SanityImage;
  bio?: string;
}

// Blog types
export interface Blog {
  _id: string;
  title: string;
  slug: SanitySlug;
  excerpt: string;
  mainImage: SanityImage;
  body?: unknown[];
  publishedAt: string;
  author?: Author;
}

// Recipe types
export interface Recipe {
  _id: string;
  title: string;
  slug: SanitySlug;
  excerpt: string;
  mainImage: SanityImage;
  body?: unknown[];
  ingredients?: string[];
  instructions?: unknown[];
  cookingTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  categories?: Category[];
}

// Product types
export interface Category {
  _id: string;
  title: string;
  slug: SanitySlug;
  description?: string;
  image?: SanityImage;
}

export interface Product {
  _id: string;
  title: string;
  slug: SanitySlug;
  description: string;
  price: number;
  images: SanityImage[];
  body?: unknown[];
  categories?: Category[];
  inStock: boolean;
}

// Class types
export interface CookingClass {
  _id: string;
  title: string;
  slug: SanitySlug;
  description: string;
  mainImage: SanityImage;
  body?: unknown[];
  classType: string;
  numberOfSessions: number;
  pricePerSession: number;
  fullPrice: number;
  startDate: string;
  schedule?: unknown[];
  spotsAvailable: number;
  instructor?: Author;
}

// Press types
export interface Press {
  _id: string;
  title: string;
  slug: SanitySlug;
  excerpt: string;
  mainImage?: SanityImage;
  body?: unknown[];
  source: string;
  externalUrl?: string;
  publishedAt: string;
}

// Supabase types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
}

export interface Booking {
  id: string;
  user_id: string;
  class_id: string;
  class_title: string;
  payment_type: "per_session" | "full";
  sessions_booked: number;
  total_paid: number;
  status: "confirmed" | "pending" | "cancelled";
  created_at: string;
}

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
}
