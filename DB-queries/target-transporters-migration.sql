-- ============================================================
-- Target transporters: send request to selected transporters only
-- Run in Supabase SQL Editor
-- ============================================================
-- When null or empty array = request is visible to ALL transporters.
-- When non-empty = only these transporter ids can see and bid on the request.
-- Stored as JSON array of UUID strings: ["uuid1", "uuid2"]

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS target_transporter_ids jsonb;
