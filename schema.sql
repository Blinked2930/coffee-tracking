-- Schema for Kafe Tracker

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert the 8 hardcoded users with a default PIN (1234) for now
-- These can be modified later in the database
INSERT INTO users (name, pin) VALUES 
  ('Alice', '1234'),
  ('Bob', '1234'),
  ('Charlie', '1234'),
  ('David', '1234'),
  ('Eve', '1234'),
  ('Frank', '1234'),
  ('Grace', '1234'),
  ('Heidi', '1234')
ON CONFLICT (name) DO NOTHING;

-- Create kafes table
CREATE TABLE IF NOT EXISTS kafes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and setup permissive policies for our simple application
-- Since the app relies on a custom PIN frontend login, we allow anon key access.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read users" ON users FOR SELECT USING (true);

ALTER TABLE kafes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon select kafes" ON kafes FOR SELECT USING (true);
CREATE POLICY "Allow anon insert kafes" ON kafes FOR INSERT WITH CHECK (true);
