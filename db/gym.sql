-- ============================================
-- IRON GYM Database Schema
-- SQLite Database
-- ============================================

-- Elimina tabelle se esistono (per reset)
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS users;

-- ============================================
-- TABELLA USERS
-- ============================================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'trainer', 'client')),
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELLA CLASSES
-- ============================================
CREATE TABLE classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    trainer_id INTEGER,
    time TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 20,
    day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- TABELLA MEMBERSHIPS
-- ============================================
CREATE TABLE memberships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    plan_type TEXT NOT NULL CHECK(plan_type IN ('basic', 'premium', 'elite')),
    billing_period TEXT NOT NULL CHECK(billing_period IN ('monthly', 'annual')),
    price DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active', 'expired', 'cancelled')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- TABELLA PAYMENTS
-- ============================================
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    membership_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'bank_transfer')),
    payment_status TEXT NOT NULL CHECK(payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE CASCADE
);

-- ============================================
-- TABELLA BOOKINGS
-- ============================================
CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE(user_id, class_id)
);

-- ============================================
-- TABELLA REVIEWS
-- ============================================
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    trainer_id INTEGER,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    comment TEXT NOT NULL,
    review_type TEXT NOT NULL CHECK(review_type IN ('gym', 'trainer')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- INSERIMENTO DATI DI TEST
-- ============================================

-- UTENTI DI TEST
-- Password per tutti: "password123"
-- Hash generato con: crypto.scrypt('password123', salt, 32)

-- Admin
INSERT INTO users (username, hash, salt, role, nome, cognome, email) VALUES 
('admin', 'f8d5e3a2b7c4d9e6f1a8b5c2d7e4f9a6b3c8d5e2f7a4b9c6d3e8f5a2b7c4d9e6', '1234567890abcdef1234567890abcdef', 'admin', 'Mario', 'Rossi', 'admin@irongym.com');

-- Trainers
INSERT INTO users (username, hash, salt, role, nome, cognome, email) VALUES 
('john.trainer', 'f8d5e3a2b7c4d9e6f1a8b5c2d7e4f9a6b3c8d5e2f7a4b9c6d3e8f5a2b7c4d9e6', '1234567890abcdef1234567890abcdef', 'trainer', 'John', 'Smith', 'john@irongym.com'),
('sara.trainer', 'f8d5e3a2b7c4d9e6f1a8b5c2d7e4f9a6b3c8d5e2f7a4b9c6d3e8f5a2b7c4d9e6', '1234567890abcdef1234567890abcdef', 'trainer', 'Sara', 'Johnson', 'sara@irongym.com'),
('mike.trainer', 'f8d5e3a2b7c4d9e6f1a8b5c2d7e4f9a6b3c8d5e2f7a4b9c6d3e8f5a2b7c4d9e6', '1234567890abcdef1234567890abcdef', 'trainer', 'Mike', 'Williams', 'mike@irongym.com');

-- Clients
INSERT INTO users (username, hash, salt, role, nome, cognome, email) VALUES 
('luca.bianchi', 'f8d5e3a2b7c4d9e6f1a8b5c2d7e4f9a6b3c8d5e2f7a4b9c6d3e8f5a2b7c4d9e6', '1234567890abcdef1234567890abcdef', 'client', 'Luca', 'Bianchi', 'luca@test.com'),
('giulia.verdi', 'f8d5e3a2b7c4d9e6f1a8b5c2d7e4f9a6b3c8d5e2f7a4b9c6d3e8f5a2b7c4d9e6', '1234567890abcdef1234567890abcdef', 'client', 'Giulia', 'Verdi', 'giulia@test.com'),
('marco.russo', 'f8d5e3a2b7c4d9e6f1a8b5c2d7e4f9a6b3c8d5e2f7a4b9c6d3e8f5a2b7c4d9e6', '1234567890abcdef1234567890abcdef', 'client', 'Marco', 'Russo', 'marco@test.com'),
('anna.ferrari', 'f8d5e3a2b7c4d9e6f1a8b5c2d7e4f9a6b3c8d5e2f7a4b9c6d3e8f5a2b7c4d9e6', '1234567890abcdef1234567890abcdef', 'client', 'Anna', 'Ferrari', 'anna@test.com'),
('paolo.romano', 'f8d5e3a2b7c4d9e6f1a8b5c2d7e4f9a6b3c8d5e2f7a4b9c6d3e8f5a2b7c4d9e6', '1234567890abcdef1234567890abcdef', 'client', 'Paolo', 'Romano', 'paolo@test.com');

-- CLASSI DI TEST
INSERT INTO classes (name, trainer_id, time, capacity, day_of_week, description) VALUES 
('CrossFit Intensive', 2, '07:00', 15, 'Monday', 'High-intensity functional training for all levels'),
('Yoga Flow', 3, '09:00', 20, 'Monday', 'Relaxing yoga session to start your week'),
('HIIT Cardio', 2, '18:00', 25, 'Monday', 'Burn calories with high-intensity interval training'),

('Strength Training', 4, '08:00', 15, 'Tuesday', 'Build muscle and increase strength'),
('Pilates Core', 3, '10:00', 18, 'Tuesday', 'Core strengthening and flexibility'),
('Boxing Workout', 2, '19:00', 20, 'Tuesday', 'Learn boxing techniques while getting fit'),

('Spin Class', 4, '07:30', 25, 'Wednesday', 'Indoor cycling for endurance and fat burn'),
('Functional Training', 2, '17:00', 20, 'Wednesday', 'Improve everyday movement patterns'),

('Bootcamp', 2, '06:30', 20, 'Thursday', 'Military-style training for maximum results'),
('Yoga Stretch', 3, '11:00', 20, 'Thursday', 'Gentle stretching and relaxation'),
('Power Lifting', 4, '18:30', 12, 'Thursday', 'Advanced weightlifting techniques'),

('Zumba Dance', 3, '10:00', 30, 'Friday', 'Dance your way to fitness'),
('Circuit Training', 2, '17:30', 20, 'Friday', 'Full body workout with varied exercises'),

('Morning Yoga', 3, '08:00', 25, 'Saturday', 'Start your weekend with mindful movement'),
('CrossFit Open', 2, '10:00', 20, 'Saturday', 'Community CrossFit session'),

('Recovery Yoga', 3, '09:00', 20, 'Sunday', 'Gentle recovery and stretching session');

-- PRENOTAZIONI DI TEST
INSERT INTO bookings (user_id, class_id) VALUES 
-- Luca Bianchi bookings
(5, 1), (5, 4), (5, 7),
-- Giulia Verdi bookings
(6, 2), (6, 5), (6, 10),
-- Marco Russo bookings
(7, 3), (7, 6), (7, 9),
-- Anna Ferrari bookings
(8, 1), (8, 2), (8, 12),
-- Paolo Romano bookings
(9, 8), (9, 11), (9, 13);

-- ============================================
-- INDICI per performance
-- ============================================
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_classes_trainer ON classes(trainer_id);
CREATE INDEX idx_classes_day ON classes(day_of_week);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_class ON bookings(class_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_membership ON payments(membership_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_trainer ON reviews(trainer_id);
CREATE INDEX idx_reviews_type ON reviews(review_type);

-- ============================================
-- VERIFICA INSERIMENTO
-- ============================================
SELECT 'Database initialized successfully!' AS message;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_classes FROM classes;
SELECT COUNT(*) AS total_bookings FROM bookings;