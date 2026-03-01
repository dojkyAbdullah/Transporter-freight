-- Add phone number to users for WhatsApp notifications (optional; used when sending new request alerts to transporters)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS phone text;

COMMENT ON COLUMN public.users.phone IS 'Phone number with country code (e.g. 923001234567) for WhatsApp notifications';
