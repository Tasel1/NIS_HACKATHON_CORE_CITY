-- database/seed.sql
-- Заполнение тестовыми данными

-- === 1. Пользователи (6 штук) ===
INSERT INTO users (email, password_hash, full_name, phone, role, points) VALUES
('ivan@test.com', '$2b$10$W0ZjoAMC9cFgPRTUoad2E.Ido9FMtb1nzZ0PxPY6NCfl1VRaaLaki', 'Ivan Petrov', '+7 900 111-22-33', 'citizen', 120),
('maria@test.com', '$2b$10$W0ZjoAMC9cFgPRTUoad2E.Ido9FMtb1nzZ0PxPY6NCfl1VRaaLaki', 'Maria Ivanova', '+7 900 444-55-66', 'citizen', 80),
('alex@test.com', '$2b$10$W0ZjoAMC9cFgPRTUoad2E.Ido9FMtb1nzZ0PxPY6NCfl1VRaaLaki', 'Alexey Smirnov', '+7 900 777-88-99', 'citizen', 200),
('worker1@test.com', '$2b$10$W0ZjoAMC9cFgPRTUoad2E.Ido9FMtb1nzZ0PxPY6NCfl1VRaaLaki', 'Petr Worker', '+7 911 111-11-11', 'worker', 0),
('worker2@test.com', '$2b$10$W0ZjoAMC9cFgPRTUoad2E.Ido9FMtb1nzZ0PxPY6NCfl1VRaaLaki', 'Olga Master', '+7 922 222-22-22', 'worker', 0),
('admin@test.com', '$2b$10$W0ZjoAMC9cFgPRTUoad2E.Ido9FMtb1nzZ0PxPY6NCfl1VRaaLaki', 'Admin Adminov', '+7 933 333-33-33', 'admin', 0);

-- === 2. Заявки (10 штук) ===
INSERT INTO requests (citizen_id, category, description, lat, lng, address, status, priority, assigned_worker_id) VALUES
(1, 'Roads', 'Broken road', 55.751244, 37.618423, 'St. Abai, 1', 'completed', 'high', 4),
(1, 'Lighting', 'Street light is not working', 55.752244, 37.619423, 'St. Abai, 5', 'assigned', 'medium', 4),
(2, 'Garbage', 'Dump in the yard', 55.753244, 37.620423, 'St. Arbat, 10', 'in_progress', 'high', 5),
(2, 'Greening', 'Cut down tree', 55.754244, 37.621423, 'St. New Arbat, 15', 'pending', 'low', NULL),
(3, 'Sidewalks', 'Broken sidewalk', 55.755244, 37.622423, 'St. Pokrovka, 3', 'assigned', 'medium', 4),
(3, 'Public Transport', 'Broken bus stop', 55.756244, 37.623423, 'St. Mira, 20', 'pending', 'medium', NULL),
(1, 'Water Supply', 'Pipe broken', 55.757244, 37.624423, 'St. Mezhitelskaya, 7', 'in_progress', 'critical', 5),
(2, 'Sewage', 'Smell from manhole', 55.758244, 37.625423, 'St. Pyatnitskaya, 12', 'completed', 'high', 4),
(3, 'Graffiti', 'Picture on wall', 55.759244, 37.626423, 'St. Znamenka, 4', 'pending', 'low', NULL),
(1, 'Security', 'Camera does not work', 55.760244, 37.627423, 'St. Ilinskaya, 8', 'assigned', 'medium', 5);

-- === 3. Фото (15 штук) ===
INSERT INTO photos (request_id, photo_type, file_path, uploaded_by) VALUES
(1, 'problem', '/uploads/requests/1/problem1.jpg', 1),
(1, 'before', '/uploads/requests/1/before1.jpg', 4),
(1, 'after', '/uploads/requests/1/after1.jpg', 4),
(2, 'problem', '/uploads/requests/2/problem1.jpg', 1),
(2, 'before', '/uploads/requests/2/before1.jpg', 4),
(3, 'problem', '/uploads/requests/3/problem1.jpg', 2),
(3, 'after', '/uploads/requests/3/after1.jpg', 5),
(4, 'problem', '/uploads/requests/4/problem1.jpg', 2),
(5, 'problem', '/uploads/requests/5/problem1.jpg', 3),
(5, 'before', '/uploads/requests/5/before1.jpg', 4),
(6, 'problem', '/uploads/requests/6/problem1.jpg', 3),
(7, 'problem', '/uploads/requests/7/problem1.jpg', 1),
(7, 'before', '/uploads/requests/7/before1.jpg', 5),
(8, 'problem', '/uploads/requests/8/problem1.jpg', 2),
(9, 'problem', '/uploads/requests/9/problem1.jpg', 3);

-- === 4. Логи работы (несколько примеров) ===
INSERT INTO work_logs (request_id, worker_id, start_time, end_time, duration_minutes, notes) VALUES
(1, 4, '2025-03-20 09:00:00', '2025-03-20 11:30:00', 150, 'Filled the hole and tamped it down'),
(3, 5, '2025-03-21 14:00:00', '2025-03-21 15:20:00', 80, 'Removed 3 bags of garbage'),
(7, 5, '2025-03-22 10:00:00', '2025-03-22 12:15:00', 135, 'Replaced pipe section, no leaks'),
(8, 4, '2025-03-19 08:30:00', '2025-03-19 09:45:00', 75, 'Check desinfection of manhole');

-- === 5. Уведомления (для примера) ===
INSERT INTO notifications (user_id, request_id, message, type, is_read) VALUES
(1, 1, 'Your request #1 is completed!', 'status_update', TRUE),
(1, 2, 'Request #2 is assigned to a worker', 'assignment', FALSE),
(2, 3, 'Worker has started working on request #3', 'status_update', FALSE),
(4, 2, 'You have been assigned request #2', 'assignment', TRUE);