CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    status VARCHAR(20) DEFAULT 'AVAILABLE'
);

CREATE TABLE restaurant_tables (
    id SERIAL PRIMARY KEY,
    table_number VARCHAR(20) UNIQUE NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    status VARCHAR(20) DEFAULT 'AVAILABLE'
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    table_id INTEGER REFERENCES restaurant_tables(id),
    status VARCHAR(20) DEFAULT 'OPEN',
    total_amount NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(12,2) NOT NULL
);

INSERT INTO categories (name) VALUES
('Món chính'),
('Đồ uống'),
('Khai vị'),
('Tráng miệng');

INSERT INTO menu_items
(name, price, description, category_id, status)
VALUES
('Phở bò', 60000, 'Phở bò truyền thống', 1, 'AVAILABLE'),
('Cơm rang', 50000, 'Cơm rang thập cẩm', 1, 'AVAILABLE'),
('Gà chiên', 90000, 'Gà chiên giòn', 1, 'AVAILABLE'),
('Coca Cola', 20000, 'Nước ngọt', 2, 'AVAILABLE'),
('Nem rán', 45000, 'Nem rán truyền thống', 3, 'AVAILABLE');

INSERT INTO restaurant_tables
(table_number, capacity, status)
VALUES
('Bàn 01', 4, 'AVAILABLE'),
('Bàn 02', 4, 'OCCUPIED'),
('Bàn 03', 6, 'AVAILABLE'),
('Bàn 04', 6, 'AVAILABLE'),
('Bàn 05', 8, 'AVAILABLE');

INSERT INTO orders
(table_id, status, total_amount)
VALUES
(1, 'PAID', 250000),
(2, 'PAID', 320000),
(3, 'OPEN', 180000);
