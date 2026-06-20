CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','CASHIER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX users_username_idx
ON users(username);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100) UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    cost_price NUMERIC(14,2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(14,2) NOT NULL DEFAULT 0,
    vat_rate NUMERIC(5,2) NOT NULL DEFAULT 13,
    current_stock NUMERIC(14,2) NOT NULL DEFAULT 0,
    reorder_level NUMERIC(14,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX products_sku_idx
ON products(sku);

CREATE INDEX products_barcode_idx
ON products(barcode);

CREATE TABLE counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    fiscal_year_bs VARCHAR(20) NOT NULL,
    invoice_date_ad DATE NOT NULL,
    invoice_date_bs VARCHAR(20) NOT NULL,
    counter_id UUID REFERENCES counters(id),
    cashier_id UUID REFERENCES users(id),
    payment_method VARCHAR(30) NOT NULL,
    subtotal NUMERIC(14,2) NOT NULL,
    vat_amount NUMERIC(14,2) NOT NULL,
    discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX sales_invoice_idx
ON sales(invoice_no);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    qty NUMERIC(14,2) NOT NULL,
    unit_price NUMERIC(14,2) NOT NULL,
    vat_rate NUMERIC(5,2) NOT NULL,
    line_total NUMERIC(14,2) NOT NULL
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    movement_type VARCHAR(20) NOT NULL,
    reference_no VARCHAR(100),
    qty NUMERIC(14,2) NOT NULL,
    balance_after NUMERIC(14,2) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE ird_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(100) NOT NULL,
    immutable_hash TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','CASHIER')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
ALTER TABLE users
ADD COLUMN pin VARCHAR(10) UNIQUE;