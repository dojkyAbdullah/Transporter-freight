-- Run this in Supabase SQL Editor (Dashboard → SQL Editor) if you use migrations elsewhere.
-- Table for storing Web Push subscriptions per user (one row per device/browser).

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Allow authenticated users to manage their own subscriptions only.
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own subscription"
  ON public.push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscription"
  ON public.push_subscriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can read all (for sending from API).
CREATE POLICY "Service role can read all"
  ON public.push_subscriptions FOR SELECT
  TO service_role
  USING (true);

COMMENT ON TABLE public.push_subscriptions IS 'Web Push subscriptions for PWA notifications';
