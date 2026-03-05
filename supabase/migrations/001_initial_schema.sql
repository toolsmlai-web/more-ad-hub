-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'business', 'enterprise')),
  link_limit INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Links table
CREATE TABLE public.links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  destination_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  is_custom_slug BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  password_hash TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_clicked_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for fast slug lookup (CRITICAL for redirect performance)
CREATE INDEX idx_links_slug ON public.links(slug) WHERE is_active = TRUE;
CREATE INDEX idx_links_user_id ON public.links(user_id);
CREATE INDEX idx_links_created_at ON public.links(created_at DESC);

-- Clicks table (for detailed analytics)
CREATE TABLE public.clicks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  link_id UUID REFERENCES public.links(id) ON DELETE CASCADE NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT,
  user_agent TEXT
);

-- Indexes for analytics queries
CREATE INDEX idx_clicks_link_id ON public.clicks(link_id);
CREATE INDEX idx_clicks_clicked_at ON public.clicks(clicked_at DESC);
CREATE INDEX idx_clicks_country ON public.clicks(country);
CREATE INDEX idx_clicks_device_type ON public.clicks(device_type);

-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  link_limit INTEGER NOT NULL,
  features JSONB NOT NULL,
  stripe_price_id TEXT
);

-- Insert default plans
INSERT INTO public.subscription_plans (name, price, link_limit, features) VALUES
  ('free', 0, 100, '{"analytics": "basic", "custom_slugs": false, "qr_codes": true, "api_access": false}'),
  ('pro', 1900, 1000, '{"analytics": "advanced", "custom_slugs": true, "qr_codes": true, "api_access": false}'),
  ('business', 4900, 10000, '{"analytics": "advanced", "custom_slugs": true, "qr_codes": true, "api_access": true, "team_access": true}'),
  ('enterprise', 19900, -1, '{"analytics": "advanced", "custom_slugs": true, "qr_codes": true, "api_access": true, "team_access": true, "white_label": true, "sla": true}');

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Links policies
CREATE POLICY "Users can view own links" ON public.links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create links" ON public.links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links" ON public.links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links" ON public.links
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read active links for redirects" ON public.links
  FOR SELECT USING (is_active = TRUE);

-- Clicks policies
CREATE POLICY "Users can view clicks for their links" ON public.clicks
  FOR SELECT USING (
    link_id IN (
      SELECT id FROM public.links WHERE user_id = auth.uid()
    )
  );

-- Function to increment click count
CREATE OR REPLACE FUNCTION increment_click_count(link_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.links 
  SET 
    click_count = click_count + 1,
    last_clicked_at = NOW()
  WHERE id = link_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get link analytics
CREATE OR REPLACE FUNCTION get_link_analytics(link_uuid UUID, days INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  clicks BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(clicked_at) as date,
    COUNT(*) as clicks
  FROM public.clicks
  WHERE 
    link_id = link_uuid 
    AND clicked_at >= NOW() - (days || ' days')::INTERVAL
  GROUP BY DATE(clicked_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON public.links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();