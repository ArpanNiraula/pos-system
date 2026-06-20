CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    role TEXT CHECK(role IN ('ADMIN','CASHIER')),
    password TEXT
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku TEXT UNIQUE,
    name TEXT,
    price NUMERIC,
    stock INT DEFAULT 0
);

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    invoice_no TEXT UNIQUE,
    cashier_id INT,
    subtotal NUMERIC,
    vat NUMERIC,
    total NUMERIC,
    payment_method TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INT REFERENCES sales(id),
    product_id INT,
    qty INT,
    price NUMERIC
);

CREATE TABLE ird_logs (
    id SERIAL PRIMARY KEY,
    invoice_no TEXT,
    hash TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);