-- Script to create the first admin user
-- Replace the email and password hash with actual values
-- To generate a bcrypt password hash, you can use an online tool or Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('your-password', 10);

-- INSERT INTO admin_users (email, password_hash)
-- VALUES ('admin@fit4sale.com', '$2a$10$...');  -- Replace with bcrypt hash

-- For testing purposes, you can temporarily create an admin with a known password:
-- Password: fit4sale123
INSERT INTO admin_users (email, password_hash)
VALUES ('admin@fit4sale.com', '$2a$10$5S/Y0d.8.VqUGZqN0L7XieyBqWd4EaGJpNJwkZxfVKHqXcvHJMlhK')
ON CONFLICT (email) DO NOTHING;
