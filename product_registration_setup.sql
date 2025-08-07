-- Product Registration System Database Setup
-- Execute these queries in your database to create all required tables

-- Step 1: Drop existing tables if they exist (to ensure clean setup)
DROP TABLE IF EXISTS electronics, vehicles, jewellery, gadgets CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Step 2: Create the main products table (matching shared/schema.ts)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('electronics', 'vehicles', 'jewellery', 'gadgets')),
    purchase_date TIMESTAMP NOT NULL,
    registration_date TIMESTAMP,
    warranty_years INTEGER,
    warranty_expiry_date TIMESTAMP,
    total_cost DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    user_id INTEGER NOT NULL
);

-- Step 3: Create the electronics details table
CREATE TABLE electronics (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 4: Create the vehicles details table
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    model VARCHAR(100),
    registration_number VARCHAR(50),
    car_type VARCHAR(50),
    color VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 5: Create the jewellery details table
CREATE TABLE jewellery (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50),
    gold_rate DECIMAL(10,2),
    gold_cost DECIMAL(12,2),
    making_cost DECIMAL(12,2),
    cgst DECIMAL(5,2),
    igst DECIMAL(5,2),
    vat DECIMAL(5,2),
    total_weight DECIMAL(10,3),
    stone_weight DECIMAL(10,3),
    diamond_weight DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 6: Create the gadgets details table
CREATE TABLE gadgets (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 7: Create indexes for better performance
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_warranty_expiry ON products(warranty_expiry_date);
CREATE INDEX idx_electronics_product_id ON electronics(product_id);
CREATE INDEX idx_vehicles_product_id ON vehicles(product_id);
CREATE INDEX idx_jewellery_product_id ON jewellery(product_id);
CREATE INDEX idx_gadgets_product_id ON gadgets(product_id);

-- Step 8: Verify tables were created successfully
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('products', 'electronics', 'vehicles', 'jewellery', 'gadgets')
ORDER BY tablename;