-- Delete existing admin user if exists
DELETE FROM admin_users WHERE email = 'admin@fit4sale.com';

-- Insert new admin user with bcrypt hash for password: fit4sale123
-- Hash generated: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvQOm (this is the bcrypt hash for "fit4sale123")
INSERT INTO admin_users (email, password_hash, created_at)
VALUES (
  'admin@fit4sale.com',
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36gZvQOm',
  NOW()
);

-- Verify insert
SELECT id, email FROM admin_users WHERE email = 'admin@fit4sale.com';
