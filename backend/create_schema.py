from supabase import create_client, Client

def create_schema():
    supabase_url = "https://uxxdeugjmphlayhkvhkjc.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4eGRldWdqbXBobGF5aGt2a2hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDk2NTU1OCwiZXhwIjoyMDgwNTQxNTU4fQ.A3UJK-H3VJe6NVZnaO7fYiCjck8WADmquriNrw0V-C0"

    supabase: Client = create_client(supabase_url, supabase_key)

    schema_sql = """
-- Supabase Schema for Etho Parts

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'buyer', 'seller')),
    business_name TEXT,
    address TEXT,
    enabled_payment_methods JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    brand TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('new', 'used', 'refurbished')),
    stock INTEGER NOT NULL DEFAULT 1,
    images JSONB DEFAULT '[]'::jsonb,
    compatible_cars JSONB DEFAULT '[]'::jsonb,
    specifications JSONB,
    seller_id UUID REFERENCES users(id),
    avg_rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    instructions TEXT,
    logo_url TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seller payment methods table
CREATE TABLE IF NOT EXISTS seller_payment_methods (
    id UUID PRIMARY KEY,
    seller_id UUID REFERENCES users(id),
    payment_method_id UUID REFERENCES payment_methods(id),
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    buyer_id UUID REFERENCES users(id),
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    payment_method_id UUID REFERENCES seller_payment_methods(id),
    payment_method_name TEXT,
    seller_payment_details JSONB,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'pending_verification', 'completed', 'failed', 'refunded')),
    order_status TEXT NOT NULL CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    tracking_info JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    user_id UUID REFERENCES users(id),
    transaction_ref TEXT NOT NULL,
    receipt_image TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending_review', 'confirmed', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    user_id UUID REFERENCES users(id),
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    order_number TEXT NOT NULL,
    seller_id UUID REFERENCES users(id),
    sale_amount DECIMAL(10,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(3,2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'pending_verification', 'paid', 'overdue')),
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- Commission payments table
CREATE TABLE IF NOT EXISTS commission_payments (
    id UUID PRIMARY KEY,
    commission_id UUID REFERENCES commissions(id),
    seller_id UUID REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    transaction_ref TEXT NOT NULL,
    receipt_image TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending_review', 'confirmed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    payment_method_id UUID REFERENCES payment_methods(id),
    account_name TEXT,
    account_number TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_commissions_seller_id ON commissions(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payment_methods_seller_id ON seller_payment_methods(seller_id);
"""

    try:
        # Execute the SQL
        result = supabase.rpc('exec_sql', {'query': schema_sql}).execute()
        print("Schema created successfully!")
        print(result)
    except Exception as e:
        print(f"Error creating schema: {e}")

if __name__ == "__main__":
    create_schema()