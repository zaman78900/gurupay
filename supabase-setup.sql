-- FeeSync – Smart Fee Management Supabase Database Setup
-- Run this SQL in your Supabase project's SQL Editor

-- Create batches table (user_id is UUID to match auth.users)
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  timing TEXT,
  fee INTEGER DEFAULT 0,
  gst_rate INTEGER DEFAULT 0,
  capacity INTEGER DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roll_number TEXT,
  status TEXT DEFAULT 'Active',
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  batch_id TEXT REFERENCES batches(id) ON DELETE SET NULL,
  joining_date DATE,
  notes TEXT,
  discount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  status TEXT DEFAULT 'unpaid',
  amount INTEGER DEFAULT 0,
  paid_on DATE,
  paid_at TIMESTAMPTZ,
  late_fee INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table (auth profile + optional business profile fields)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  gstin TEXT,
  address TEXT,
  email TEXT,
  upi_id TEXT
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  enable_gst BOOLEAN DEFAULT true,
  enable_discounts BOOLEAN DEFAULT true,
  enable_late_fees BOOLEAN DEFAULT true,
  enable_whatsapp BOOLEAN DEFAULT true,
  csv_export BOOLEAN DEFAULT true,
  compact_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for batches
DROP POLICY IF EXISTS "Users can select their own batches" ON batches;
DROP POLICY IF EXISTS "Users can insert their own batches" ON batches;
DROP POLICY IF EXISTS "Users can update their own batches" ON batches;
DROP POLICY IF EXISTS "Users can delete their own batches" ON batches;

CREATE POLICY "Users can select their own batches" ON batches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own batches" ON batches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own batches" ON batches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own batches" ON batches FOR DELETE USING (auth.uid() = user_id);

-- Create policies for students
DROP POLICY IF EXISTS "Users can select their own students" ON students;
DROP POLICY IF EXISTS "Users can insert their own students" ON students;
DROP POLICY IF EXISTS "Users can update their own students" ON students;
DROP POLICY IF EXISTS "Users can delete their own students" ON students;

CREATE POLICY "Users can select their own students" ON students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own students" ON students FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own students" ON students FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own students" ON students FOR DELETE USING (auth.uid() = user_id);

-- Create policies for payments
DROP POLICY IF EXISTS "Users can select their own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON payments;

CREATE POLICY "Users can select their own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payments" ON payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payments" ON payments FOR DELETE USING (auth.uid() = user_id);

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can select their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;

CREATE POLICY "Users can select their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Create policies for settings
DROP POLICY IF EXISTS "Users can select their own settings" ON settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON settings;

CREATE POLICY "Users can select their own settings" ON settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON settings FOR DELETE USING (auth.uid() = user_id);
