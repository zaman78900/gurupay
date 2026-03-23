import { supabase } from '../supabase';

// Database service for Supabase operations
// All operations are scoped to the authenticated user

export async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  // Ensure user_id is converted to UUID string if needed
  return user?.id ? String(user.id) : null;
}

// Helper to ensure user_id is UUID string
const toUuid = (id) => id ? String(id) : null;

// ─── BATCHES ─────────────────────────────────────────────────────────────
export async function fetchBatches(userId) {
  if (!userId) return [];
  const uuid = toUuid(userId);
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('user_id', uuid)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching batches:', error);
    return [];
  }
  return data || [];
}

export async function createBatch(userId, batch) {
  if (!userId) return { data: null, error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { data, error } = await supabase
    .from('batches')
    .insert([{ ...batch, user_id: uuid }])
    .select()
    .single();
  
  return { data, error };
}

export async function updateBatch(userId, batch) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { data, error } = await supabase
    .from('batches')
    .update(batch)
    .eq('id', batch.id)
    .eq('user_id', uuid)
    .select()
    .single();
  
  return { data, error };
}

export async function deleteBatch(userId, batchId) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { error } = await supabase
    .from('batches')
    .delete()
    .eq('id', batchId)
    .eq('user_id', uuid);
  
  return { error };
}

// ─── STUDENTS ────────────────────────────────────────────────────────────
export async function fetchStudents(userId) {
  if (!userId) return [];
  const uuid = toUuid(userId);
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', uuid)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }
  return data || [];
}

export async function createStudent(userId, student) {
  if (!userId) return { data: null, error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { data, error } = await supabase
    .from('students')
    .insert([{ ...student, user_id: uuid }])
    .select()
    .single();
  
  return { data, error };
}

export async function updateStudent(userId, student) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { data, error } = await supabase
    .from('students')
    .update(student)
    .eq('id', student.id)
    .eq('user_id', uuid)
    .select()
    .single();
  
  return { data, error };
}

export async function deleteStudent(userId, studentId) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId)
    .eq('user_id', uuid);
  
  return { error };
}

// ─── PAYMENTS ───────────────────────────────────────────────────────────
export async function fetchPayments(userId) {
  if (!userId) return [];
  const uuid = toUuid(userId);
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', uuid)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
  return data || [];
}

export async function createPayment(userId, payment) {
  if (!userId) return { data: null, error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { data, error } = await supabase
    .from('payments')
    .insert([{ ...payment, user_id: uuid }])
    .select()
    .single();
  
  return { data, error };
}

export async function updatePayment(userId, payment) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { data, error } = await supabase
    .from('payments')
    .update(payment)
    .eq('id', payment.id)
    .eq('user_id', uuid)
    .select()
    .single();
  
  return { data, error };
}

export async function deletePayment(userId, paymentId) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId)
    .eq('user_id', uuid);
  
  return { error };
}

// ─── PROFILE ────────────────────────────────────────────────────────────
export async function fetchProfile(userId) {
  if (!userId) return null;
  const uuid = toUuid(userId);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', uuid)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching profile:', error);
  }
  return data || null;
}

export async function saveProfile(userId, profile) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  // First try to update, if no rows affected, insert
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', uuid)
    .single();
  
  if (existing) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...profile, updated_at: new Date().toISOString() })
      .eq('user_id', uuid)
      .select()
      .single();
    return { data, error };
  } else {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ ...profile, user_id: uuid }])
      .select()
      .single();
    return { data, error };
  }
}

// ─── SETTINGS ───────────────────────────────────────────────────────────
export async function fetchSettings(userId) {
  if (!userId) return null;
  const uuid = toUuid(userId);
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', uuid)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching settings:', error);
  }
  return data || null;
}

export async function saveSettings(userId, settings) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { data: existing } = await supabase
    .from('settings')
    .select('id')
    .eq('user_id', uuid)
    .single();
  
  if (existing) {
    const { data, error } = await supabase
      .from('settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('user_id', uuid)
      .select()
      .single();
    return { data, error };
  } else {
    const { data, error } = await supabase
      .from('settings')
      .insert([{ ...settings, user_id: uuid }])
      .select()
      .single();
    return { data, error };
  }
}

// ─── UTILITY FUNCTIONS ─────────────────────────────────────────────────
// Initialize database tables (run this once in Supabase SQL editor)
export const CREATE_TABLES_SQL = `
-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  gstin TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  upi_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE POLICY "Users can select their own batches" ON batches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own batches" ON batches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own batches" ON batches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own batches" ON batches FOR DELETE USING (auth.uid() = user_id);

-- Create policies for students
CREATE POLICY "Users can select their own students" ON students FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own students" ON students FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own students" ON students FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own students" ON students FOR DELETE USING (auth.uid() = user_id);

-- Create policies for payments
CREATE POLICY "Users can select their own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payments" ON payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payments" ON payments FOR DELETE USING (auth.uid() = user_id);

-- Create policies for profiles
CREATE POLICY "Users can select their own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- Create policies for settings
CREATE POLICY "Users can select their own settings" ON settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON settings FOR DELETE USING (auth.uid() = user_id);
`;

export default {
  fetchBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  fetchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  fetchPayments,
  createPayment,
  updatePayment,
  deletePayment,
  fetchProfile,
  saveProfile,
  fetchSettings,
  saveSettings,
};
