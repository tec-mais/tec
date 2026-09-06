/*
# TEC+ Acessórios - Core Database Schema

Creates the complete schema for an omnichannel e-commerce platform with admin panel.

## Tables Created

1. **profiles** - Extends auth.users with role (ADMIN/PROPRIETARIO/OPERADOR/CLIENTE), legal info (CPF, birth date, phone), ban status
2. **categories** - Product categories (name, slug)
3. **products** - Catalog items (name, slug, price, stock, description, photos, category, active)
4. **banners** - Rotative home slider (image, link, order, active)
5. **coupons** - Discount codes (code, type, value, min_order, payment_method, expires, usage_limit, used_count)
6. **fees** - Store fee configuration (convenience fee, delivery margin) - single row
7. **orders** - Customer orders (status, total, delivery type, payment, customer info, coupon)
8. **order_items** - Line items per order (product snapshot, qty, price)
9. **wishlist_items** - Community product suggestions (title, description, votes)
10. **wishlist_votes** - One vote per user per suggestion
11. **blog_posts** - Native blog articles (title, slug, cover, content, tags, published)
12. **footer_settings** - Institutional texts and social links (single row)
13. **store_settings** - Logo URL and global config (single row)
14. **ai_config** - AI agent personality + knowledge base (single row)
15. **ai_chat_history** - Conversation log for the AI agent widget

## Security (RLS)
- profiles: each user reads/updates own profile; admins read all via service role (edge functions)
- products, categories, banners, blog_posts (published), footer_settings, store_settings: public read (anon+authenticated), staff write
- orders + order_items: customer reads own; staff reads all via edge function
- coupons, fees, ai_config: staff read; admin write
- wishlist: public read, authenticated insert/vote own
- All staff writes are enforced through RLS role checks on profiles.role
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  cpf text,
  birth_date date,
  phone text,
  role text NOT NULL DEFAULT 'CLIENTE' CHECK (role IN ('ADMIN','PROPRIETARIO','OPERADOR','CLIENTE')),
  banned boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON public.profiles;
CREATE POLICY "profiles_select_own_or_staff" ON public.profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO','OPERADOR') AND p.banned = false)
  );

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_staff_write" ON public.categories;
CREATE POLICY "categories_staff_write" ON public.categories FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO') AND p.banned = false)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO') AND p.banned = false)
  );

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  photos text[] DEFAULT '{}',
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);

DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read" ON public.products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "products_staff_write" ON public.products;
CREATE POLICY "products_staff_write" ON public.products FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO') AND p.banned = false)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO') AND p.banned = false)
  );

-- ============ BANNERS ============
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  link_url text,
  title text,
  "order" integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_public_read" ON public.banners;
CREATE POLICY "banners_public_read" ON public.banners FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "banners_admin_write" ON public.banners;
CREATE POLICY "banners_admin_write" ON public.banners FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.banned = false)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.banned = false)
  );

-- ============ COUPONS ============
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'PERCENT' CHECK (type IN ('PERCENT','FIXED')),
  value numeric(10,2) NOT NULL DEFAULT 0,
  min_order numeric(10,2) DEFAULT 0,
  payment_method text CHECK (payment_method IN ('PIX','DINHEIRO','CARTAO',NULL)),
  expires_at timestamptz,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_staff_read" ON public.coupons;
CREATE POLICY "coupons_staff_read" ON public.coupons FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO') AND p.banned = false)
  );

DROP POLICY IF EXISTS "coupons_staff_write" ON public.coupons;
CREATE POLICY "coupons_staff_write" ON public.coupons FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO') AND p.banned = false)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO') AND p.banned = false)
  );

-- ============ FEES (single row) ============
CREATE TABLE IF NOT EXISTS public.fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  convenience_fee numeric(10,2) NOT NULL DEFAULT 0,
  delivery_margin numeric(10,2) NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fees_staff_read" ON public.fees;
CREATE POLICY "fees_staff_read" ON public.fees FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO','OPERADOR') AND p.banned = false)
  );

DROP POLICY IF EXISTS "fees_staff_write" ON public.fees;
CREATE POLICY "fees_staff_write" ON public.fees FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO') AND p.banned = false)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO') AND p.banned = false)
  );

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'AGUARDANDO_FRETE' CHECK (status IN ('AGUARDANDO_FRETE','PAGO','EM_SEPARACAO','ENTREGUE','CANCELADO')),
  total numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  fees numeric(10,2) NOT NULL DEFAULT 0,
  delivery_type text NOT NULL DEFAULT 'MANUAL' CHECK (delivery_type IN ('MANUAL','RETIRAR')),
  payment_method text DEFAULT 'PIX' CHECK (payment_method IN ('PIX','DINHEIRO','CARTAO')),
  coupon_code text,
  customer_name text,
  customer_phone text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

DROP POLICY IF EXISTS "orders_select_own_or_staff" ON public.orders;
CREATE POLICY "orders_select_own_or_staff" ON public.orders FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO','OPERADOR') AND p.banned = false)
  );

DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_staff_update" ON public.orders;
CREATE POLICY "orders_staff_update" ON public.orders FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO','OPERADOR') AND p.banned = false)
  ) WITH CHECK (true);

-- ============ ORDER ITEMS ============
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

DROP POLICY IF EXISTS "order_items_select_own_or_staff" ON public.order_items;
CREATE POLICY "order_items_select_own_or_staff" ON public.order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO','OPERADOR') AND p.banned = false)
  );

DROP POLICY IF EXISTS "order_items_insert_own" ON public.order_items;
CREATE POLICY "order_items_insert_own" ON public.order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

-- ============ WISHLIST (community suggestions) ============
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  votes integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','REVIEW','APPROVED','REJECTED')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_wishlist_votes ON public.wishlist_items(votes DESC);

DROP POLICY IF EXISTS "wishlist_public_read" ON public.wishlist_items;
CREATE POLICY "wishlist_public_read" ON public.wishlist_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "wishlist_insert_own" ON public.wishlist_items;
CREATE POLICY "wishlist_insert_own" ON public.wishlist_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlist_staff_update" ON public.wishlist_items;
CREATE POLICY "wishlist_staff_update" ON public.wishlist_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO') AND p.banned = false)
  ) WITH CHECK (true);

DROP POLICY IF EXISTS "wishlist_delete_own" ON public.wishlist_items;
CREATE POLICY "wishlist_delete_own" ON public.wishlist_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ WISHLIST VOTES ============
CREATE TABLE IF NOT EXISTS public.wishlist_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_item_id uuid NOT NULL REFERENCES public.wishlist_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(wishlist_item_id, user_id)
);
ALTER TABLE public.wishlist_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishlist_votes_select_public" ON public.wishlist_votes;
CREATE POLICY "wishlist_votes_select_public" ON public.wishlist_votes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "wishlist_votes_insert_own" ON public.wishlist_votes;
CREATE POLICY "wishlist_votes_insert_own" ON public.wishlist_votes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishlist_votes_delete_own" ON public.wishlist_votes;
CREATE POLICY "wishlist_votes_delete_own" ON public.wishlist_votes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ BLOG POSTS ============
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  cover_image text,
  content text,
  tags text[] DEFAULT '{}',
  published boolean NOT NULL DEFAULT false,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_blog_published ON public.blog_posts(published);

DROP POLICY IF EXISTS "blog_public_read" ON public.blog_posts;
CREATE POLICY "blog_public_read" ON public.blog_posts FOR SELECT
  TO anon, authenticated USING (published = true OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO') AND p.banned = false
  ));

DROP POLICY IF EXISTS "blog_staff_write" ON public.blog_posts;
CREATE POLICY "blog_staff_write" ON public.blog_posts FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO') AND p.banned = false)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO') AND p.banned = false)
  );

-- ============ FOOTER SETTINGS (single row) ============
CREATE TABLE IF NOT EXISTS public.footer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  about_us text,
  terms_of_use text,
  privacy_policy text,
  social_instagram text,
  social_facebook text,
  social_whatsapp text,
  social_twitter text,
  social_youtube text,
  social_tiktok text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "footer_public_read" ON public.footer_settings;
CREATE POLICY "footer_public_read" ON public.footer_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "footer_admin_write" ON public.footer_settings;
CREATE POLICY "footer_admin_write" ON public.footer_settings FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.banned = false)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.banned = false)
  );

-- ============ STORE SETTINGS (logo, single row) ============
CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  store_name text NOT NULL DEFAULT 'TEC+ Acessórios',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_settings_public_read" ON public.store_settings;
CREATE POLICY "store_settings_public_read" ON public.store_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "store_settings_admin_write" ON public.store_settings;
CREATE POLICY "store_settings_admin_write" ON public.store_settings FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.banned = false)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.banned = false)
  );

-- ============ AI CONFIG (single row) ============
CREATE TABLE IF NOT EXISTS public.ai_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_prompt text NOT NULL DEFAULT 'Você é um assistente virtual da TEC+ Acessórios. Seja prestativo, claro e objetivo.',
  knowledge_base text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_config_staff_read" ON public.ai_config;
CREATE POLICY "ai_config_staff_read" ON public.ai_config FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('ADMIN','PROPRIETARIO','OPERADOR') AND p.banned = false)
  );

DROP POLICY IF EXISTS "ai_config_admin_write" ON public.ai_config;
CREATE POLICY "ai_config_admin_write" ON public.ai_config FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.banned = false)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'ADMIN' AND p.banned = false)
  );

-- ============ AI CHAT HISTORY ============
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ai_chat_user ON public.ai_chat_history(user_id, created_at);

DROP POLICY IF EXISTS "ai_chat_select_own" ON public.ai_chat_history;
CREATE POLICY "ai_chat_select_own" ON public.ai_chat_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_chat_insert_own" ON public.ai_chat_history;
CREATE POLICY "ai_chat_insert_own" ON public.ai_chat_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ai_chat_delete_own" ON public.ai_chat_history;
CREATE POLICY "ai_chat_delete_own" ON public.ai_chat_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ TRIGGER: auto-create profile on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ INITIAL SINGLE-ROW DATA ============
INSERT INTO public.fees (id, convenience_fee, delivery_margin)
SELECT gen_random_uuid(), 0, 0
WHERE NOT EXISTS (SELECT 1 FROM public.fees);

INSERT INTO public.footer_settings (id, about_us, terms_of_use, privacy_policy)
SELECT gen_random_uuid(),
  'A TEC+ Acessórios é uma loja especializada em acessórios mobile e tecnologia, oferecendo produtos de qualidade com atendimento próximo e humanizado.',
  'Ao utilizar nossos serviços, você concorda com nossos termos de uso. Os preços e disponibilidade podem mudar sem aviso prévio.',
  'Respeitamos sua privacidade. Seus dados são utilizados apenas para processamento de pedidos e comunicação relacionada.'
WHERE NOT EXISTS (SELECT 1 FROM public.footer_settings);

INSERT INTO public.store_settings (id, store_name)
SELECT gen_random_uuid(), 'TEC+ Acessórios'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

INSERT INTO public.ai_config (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM public.ai_config);