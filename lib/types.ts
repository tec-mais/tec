export type UserRole = 'ADMIN' | 'PROPRIETARIO' | 'OPERADOR' | 'CLIENTE';

export type OrderStatus = 'AGUARDANDO_FRETE' | 'PAGO' | 'EM_SEPARACAO' | 'ENTREGUE' | 'CANCELADO';

export type DeliveryType = 'MANUAL' | 'RETIRAR';

export type PaymentMethod = 'PIX' | 'DINHEIRO' | 'CARTAO';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  cpf: string | null;
  birth_date: string | null;
  phone: string | null;
  role: UserRole;
  banned: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  photos: string[];
  category_id: string | null;
  active: boolean;
  created_at: string;
  category?: Category;
}

export interface Banner {
  id: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
  order: number;
  active: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  min_order: number;
  payment_method: PaymentMethod | null;
  expires_at: string | null;
  usage_limit: number | null;
  used_count: number;
  active: boolean;
  created_at: string;
}

export interface Fees {
  id: string;
  convenience_fee: number;
  delivery_margin: number;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  total: number;
  subtotal: number;
  discount: number;
  fees: number;
  delivery_type: DeliveryType;
  payment_method: PaymentMethod;
  coupon_code: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  votes: number;
  status: 'OPEN' | 'REVIEW' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  content: string | null;
  tags: string[];
  published: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FooterSettings {
  id: string;
  about_us: string | null;
  terms_of_use: string | null;
  privacy_policy: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_whatsapp: string | null;
  social_twitter: string | null;
  social_youtube: string | null;
  social_tiktok: string | null;
  updated_at: string;
}

export interface StoreSettings {
  id: string;
  logo_url: string | null;
  store_name: string;
  updated_at: string;
}

export interface AIConfig {
  id: string;
  system_prompt: string;
  knowledge_base: string | null;
  updated_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
