-- ============================================================
-- ROLES MIGRATION: Admin, Inland Executive, Transporter
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- ROLES MIGRATION: Admin, Inland Executive, Transporter
-- Run these in Supabase SQL Editor IN THIS ORDER
-- ============================================================

-- 1) Drop existing role check constraint (so we can change data)
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

-- 2) Migrate existing COMPANY users to INLAND_EXECUTIVE
--    (Must run BEFORE adding new constraint, or constraint will fail)
UPDATE users
SET role = 'INLAND_EXECUTIVE'
WHERE role = 'COMPANY';

-- 3) Add new role check: ADMIN, INLAND_EXECUTIVE, TRANSPORTER
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('ADMIN', 'INLAND_EXECUTIVE', 'TRANSPORTER'));

-- 4) (Optional) Create first Admin user – replace with your auth.users id
-- Get your user id from: Supabase Dashboard → Authentication → Users
-- INSERT INTO users (id, name, email, role, company_name)
-- VALUES (
--   'YOUR-AUTH-USER-UUID-HERE',
--   'Admin User',
--   'admin@yourcompany.com',
--   'ADMIN',
--   NULL
-- )
-- ON CONFLICT (id) DO UPDATE SET role = 'ADMIN';

-- Verify
-- SELECT id, name, email, role FROM users;
