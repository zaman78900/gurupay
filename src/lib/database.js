import { supabase } from '../supabase';

// Database service for Supabase operations
// All operations are scoped to the authenticated user

const toUuid = (id) => (id ? String(id) : null);

const mapBatchFromDb = (row) => ({
  id: row.id,
  name: row.name,
  subject: row.subject,
  timing: row.timing,
  fee: row.fee ?? 0,
  gstRate: row.gst_rate ?? 0,
  capacity: row.capacity ?? 0,
  color: row.color,
});

const mapBatchToDb = (batch, userId) => ({
  id: batch.id,
  user_id: toUuid(userId),
  name: batch.name,
  subject: batch.subject,
  timing: batch.timing,
  fee: batch.fee ?? 0,
  gst_rate: batch.gstRate ?? 0,
  capacity: batch.capacity ?? 0,
  color: batch.color,
});

const mapStudentFromDb = (row) => ({
  id: row.id,
  rollNumber: row.roll_number ?? '',
  status: row.status ?? 'Active',
  name: row.name,
  phone: row.phone,
  email: row.email ?? '',
  batchId: row.batch_id,
  joiningDate: row.joining_date,
  notes: row.notes ?? '',
  discount: row.discount ?? 0,
});

const mapStudentToDb = (student, userId) => ({
  id: student.id,
  user_id: toUuid(userId),
  roll_number: student.rollNumber ?? '',
  status: student.status ?? 'Active',
  name: student.name,
  phone: student.phone,
  email: student.email ?? null,
  batch_id: student.batchId,
  joining_date: student.joiningDate || null,
  notes: student.notes ?? '',
  discount: student.discount ?? 0,
});

const mapPaymentFromDb = (row) => ({
  id: row.id,
  studentId: row.student_id,
  month: row.month,
  status: row.status ?? 'unpaid',
  amount: row.amount ?? 0,
  paidOn: row.paid_on,
  paidAt: row.paid_at,
  lateFee: row.late_fee ?? 0,
  notes: row.notes ?? '',
  dueDate: row.due_date,
  parentPaymentId: row.parent_payment_id,
  reminderScheduledAt: row.reminder_scheduled_at,
  reminderSent: row.reminder_sent ?? false,
  reminderSentAt: row.reminder_sent_at,
});

const mapPaymentToDb = (payment, userId) => ({
  id: payment.id,
  user_id: toUuid(userId),
  student_id: payment.studentId,
  month: payment.month,
  status: payment.status ?? 'unpaid',
  amount: payment.amount ?? 0,
  paid_on: payment.paidOn || null,
  paid_at: payment.paidAt || null,
  late_fee: payment.lateFee ?? 0,
  notes: payment.notes ?? '',
  due_date: payment.dueDate || null,
  parent_payment_id: payment.parentPaymentId || null,
  reminder_scheduled_at: payment.reminderScheduledAt || null,
  reminder_sent: payment.reminderSent ?? false,
  reminder_sent_at: payment.reminderSentAt || null,
});

const mapProfileFromDb = (row) => {
  if (!row) return null;
  return {
    name: row.name ?? '',
    gstin: row.gstin ?? '',
    address: row.address ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    upiId: row.upi_id ?? '',
  };
};

const mapProfileToDb = (profile) => ({
  name: profile?.name ?? null,
  gstin: profile?.gstin ?? null,
  address: profile?.address ?? null,
  phone: profile?.phone ?? null,
  email: profile?.email ?? null,
  upi_id: profile?.upiId ?? null,
});

export async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  // Ensure user_id is converted to UUID string if needed
  return user?.id ? String(user.id) : null;
}

// ─── BATCHES ─────────────────────────────────────────────────────────────
export async function fetchBatches(userId) {
  if (!userId) return [];
  const uuid = toUuid(userId);
  try {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('user_id', uuid)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching batches:', error?.message || error);
      return [];
    }
    return (data || []).map(mapBatchFromDb);
  } catch (err) {
    console.error('Batches fetch exception:', err?.message);
    return [];
  }
}

export async function createBatch(userId, batch) {
  if (!userId) return { data: null, error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { data, error } = await supabase
    .from('batches')
    .upsert([mapBatchToDb(batch, uuid)], { onConflict: 'id' })
    .select()
    .single();
  
  return { data: data ? mapBatchFromDb(data) : null, error };
}

export async function updateBatch(userId, batch) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { data, error } = await supabase
    .from('batches')
    .update({ ...mapBatchToDb(batch, uuid), updated_at: new Date().toISOString() })
    .eq('id', batch.id)
    .eq('user_id', uuid)
    .select()
    .single();
  
  return { data: data ? mapBatchFromDb(data) : null, error };
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
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', uuid)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching students:', error?.message || error);
      return [];
    }
    return (data || []).map(mapStudentFromDb);
  } catch (err) {
    console.error('Students fetch exception:', err?.message);
    return [];
  }
}

export async function createStudent(userId, student) {
  if (!userId) return { data: null, error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { data, error } = await supabase
    .from('students')
    .upsert([mapStudentToDb(student, uuid)], { onConflict: 'id' })
    .select()
    .single();
  
  return { data: data ? mapStudentFromDb(data) : null, error };
}

export async function updateStudent(userId, student) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { data, error } = await supabase
    .from('students')
    .update({ ...mapStudentToDb(student, uuid), updated_at: new Date().toISOString() })
    .eq('id', student.id)
    .eq('user_id', uuid)
    .select()
    .single();
  
  return { data: data ? mapStudentFromDb(data) : null, error };
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
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', uuid)
      .order('created_at', { ascending: false })
      .limit(2000);  // Limit to prevent massive data transfers
    
    if (error) {
      console.error('Error fetching payments:', error?.message || error);
      return [];
    }
    return (data || []).map(mapPaymentFromDb);
  } catch (err) {
    console.error('Payments fetch exception:', err?.message);
    return [];
  }
}

export async function createPayment(userId, payment) {
  if (!userId) return { data: null, error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { data, error } = await supabase
    .from('payments')
    .upsert([mapPaymentToDb(payment, uuid)], { onConflict: 'id' })
    .select()
    .single();
  
  return { data: data ? mapPaymentFromDb(data) : null, error };
}

export async function updatePayment(userId, payment) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  const { data, error } = await supabase
    .from('payments')
    .update({ ...mapPaymentToDb(payment, uuid), updated_at: new Date().toISOString() })
    .eq('id', payment.id)
    .eq('user_id', uuid)
    .select()
    .single();
  
  return { data: data ? mapPaymentFromDb(data) : null, error };
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

// ─── INSTALLMENTS ──────────────────────────────────────────────────────
const mapInstallmentFromDb = (row) => ({
  id: row.id,
  paymentId: row.payment_id,
  installmentNumber: row.installment_number,
  amount: row.amount ?? 0,
  dueDate: row.due_date,
  status: row.status ?? 'unpaid',
  paidAmount: row.paid_amount ?? 0,
  paidOn: row.paid_on,
  paidAt: row.paid_at,
  notes: row.notes ?? '',
});

const mapInstallmentToDb = (installment, userId) => ({
  id: installment.id,
  user_id: toUuid(userId),
  payment_id: installment.paymentId,
  installment_number: installment.installmentNumber,
  amount: installment.amount ?? 0,
  due_date: installment.dueDate || null,
  status: installment.status ?? 'unpaid',
  paid_amount: installment.paidAmount ?? 0,
  paid_on: installment.paidOn || null,
  paid_at: installment.paidAt || null,
  notes: installment.notes ?? '',
});

export async function fetchInstallments(userId) {
  if (!userId) return [];
  const uuid = toUuid(userId);
  const { data, error } = await supabase
    .from('installments')
    .select('*')
    .eq('user_id', uuid)
    .order('payment_id', { ascending: true });

  if (error) {
    console.error('Error fetching installments:', error);
    return [];
  }
  return (data || []).map(mapInstallmentFromDb);
}

export async function createInstallment(userId, installment) {
  if (!userId) return { data: null, error: 'Not authenticated' };
  const uuid = toUuid(userId);

  const { data, error } = await supabase
    .from('installments')
    .insert([mapInstallmentToDb(installment, uuid)])
    .select()
    .single();

  return { data: data ? mapInstallmentFromDb(data) : null, error };
}

export async function updateInstallment(userId, installment) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);

  const { data, error } = await supabase
    .from('installments')
    .update({ ...mapInstallmentToDb(installment, uuid), updated_at: new Date().toISOString() })
    .eq('id', installment.id)
    .eq('user_id', uuid)
    .select()
    .single();

  return { data: data ? mapInstallmentFromDb(data) : null, error };
}

export async function deleteInstallment(userId, installmentId) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);

  const { error } = await supabase
    .from('installments')
    .delete()
    .eq('id', installmentId)
    .eq('user_id', uuid);

  return { error };
}

// Bulk delete installments by payment ID
export async function deleteInstallmentsByPaymentId(userId, paymentId) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);

  const { error } = await supabase
    .from('installments')
    .delete()
    .eq('payment_id', paymentId)
    .eq('user_id', uuid);

  return { error };
}
export async function fetchProfile(userId) {
  if (!userId) return null;
  const uuid = toUuid(userId);
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uuid)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.warn('Profile fetch error:', error?.message || error);
    }
    return mapProfileFromDb(data || null);
  } catch (err) {
    console.warn('Profile fetch exception:', err?.message);
    return null;
  }
}

export async function saveProfile(userId, profile) {
  if (!userId) return { error: 'Not authenticated' };
  const uuid = toUuid(userId);
  
  // First try to update, if no rows affected, insert
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', uuid)
    .single();
  
  if (existing) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...mapProfileToDb(profile), updated_at: new Date().toISOString() })
      .eq('id', uuid)
      .select()
      .single();
    return { data: data ? mapProfileFromDb(data) : null, error };
  } else {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ ...mapProfileToDb(profile), id: uuid }])
      .select()
      .single();
    return { data: data ? mapProfileFromDb(data) : null, error };
  }
}

// ─── SETTINGS ───────────────────────────────────────────────────────────
export async function fetchSettings(userId) {
  if (!userId) return null;
  const uuid = toUuid(userId);
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', uuid)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.warn('Settings fetch error:', error?.message || error);
    }
    return data || null;
  } catch (err) {
    console.warn('Settings fetch exception:', err?.message);
    return null;
  }
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
      .insert([{ id: uuid, ...settings, user_id: uuid }])
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
