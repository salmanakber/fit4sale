-- This script sets up admin users with bcrypt hashed passwords
-- To generate bcrypt hashes, run this Node.js code:
-- const bcrypt = require('bcryptjs');
-- const password = 'fit4sale123';
-- bcrypt.hash(password, 10).then(hash => console.log(hash));

-- Delete existing admin users (if any)
DELETE FROM admin_users;

-- Insert admin user with bcrypt hash for password: fit4sale123
-- Hash: $2a$10$5S/Y0d.8.VqUGZqN0L7XieyBqWd4EaGJpNJwkZxfVKHqXcvHJMlhK
INSERT INTO admin_users (email, password_hash)
VALUES ('admin@fit4sale.com', '$2a$10$5S/Y0d.8.VqUGZqN0L7XieyBqWd4EaGJpNJwkZxfVKHqXcvHJMlhK')
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash;
