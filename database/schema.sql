-- database/schema.sql
-- Создание таблиц для проекта Core City

-- Пользователи
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'citizen',
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Заявки
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    citizen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    address TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_worker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Фотографии
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    photo_type VARCHAR(50) NOT NULL CHECK (photo_type IN ('problem', 'before', 'after')),
    file_path TEXT NOT NULL,
    uploaded_by INTEGER NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Логи работы исполнителей
CREATE TABLE IF NOT EXISTS work_logs (
    id SERIAL PRIMARY KEY,
    request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    worker_id INTEGER NOT NULL REFERENCES users(id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Уведомления
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id INTEGER REFERENCES requests(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_citizen_id ON requests(citizen_id);
CREATE INDEX IF NOT EXISTS idx_requests_assigned_worker_id ON requests(assigned_worker_id);