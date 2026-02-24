-- ============================================================
-- Transporter allocations when closing a request
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS transporter_allocations jsonb;

-- Structure: array of { "transporter_id": "uuid", "allocated_count": number }
-- Example: [{"transporter_id": "abc-123", "allocated_count": 5}, {"transporter_id": "def-456", "allocated_count": 5}]
