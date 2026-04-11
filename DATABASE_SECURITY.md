# GuruPay Database & Security Improvements

## 🔐 Security Audit & Recommendations

### Current Status
- ✅ Row Level Security (RLS) policies required
- ⚠️ No explicit validation of RLS enforcement
- ⚠️ Sensitive data in plaintext localStorage
- ⚠️ No rate limiting on API requests
- ⚠️ No CSRF protection (check Supabase config)

### Critical Security Tasks

#### 1. Verify & Enable Row Level Security (RLS)
**Status:** ⚠️ REQUIRED - Check Supabase dashboard

```sql
-- Add these policies to your Supabase project
-- Go to: Supabase Dashboard > Authentication > Policies

-- Policy for batches table
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own batches"
  ON batches FOR ALL
  USING (auth.uid() = user_id);

-- Policy for students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own students"
  ON students FOR ALL
  USING (auth.uid() = user_id);

-- Policy for payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own payments"
  ON payments FOR ALL
  USING (auth.uid() = user_id);

-- Policy for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id);
```

**Verification:**
```javascript
// Add this to App.jsx to verify RLS at startup
async function verifyRLS() {
  try {
    // Try to access another user's data (should fail)
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('user_id', 'FAKE_USER_ID');
    
    if (data && data.length > 0) {
      console.error('⚠️  RLS NOT ENFORCED! Users can access other users data!');
      // Show error screen
    } else {
      console.log('✅ RLS is working correctly');
    }
  } catch (error) {
    console.log('✅ RLS is working correctly (got expected error)', error);
  }
}
```

#### 2. Create Database Indexes
**Status:** ⚠️ RECOMMENDED - Add for performance

```sql
-- Indexes for foreign key queries
CREATE INDEX idx_batches_user_id ON batches(user_id);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_batch_id ON students(batch_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_student_id ON payments(student_id);

-- Indexes for time-based queries
CREATE INDEX idx_payments_month ON payments(month);
CREATE INDEX idx_students_joining_date ON students(joining_date);

-- Composite indexes
CREATE INDEX idx_payments_student_month ON payments(student_id, month);
CREATE INDEX idx_students_batch_status ON students(batch_id, status);
```

#### 3. Sensitive Data Protection
**Status:** ⚠️ IMPORTANT

**Current Issue:**
```javascript
// LocalStorage stores unencrypted
localStorage.setItem('profile', JSON.stringify(profile)); // ❌ Not secure!
```

**Recommendation:**
```javascript
// Option 1: Use sessionStorage instead (cleared on browser close)
sessionStorage.setItem('tempProfile', JSON.stringify(profile));

// Option 2: Use Supabase built-in storage
// Supabase handles authentication tokens securely

// Option 3: Encrypt sensitive data
// No credit cards, but GSTIN/UPI ID should be treated carefully
```

**Sensitive fields to protect:**
- UPI ID
- GSTIN (business tax ID)  
- Phone numbers (in batch data)
- Email addresses

**Action Items:**
- [ ] Move profile data to sessionStorage instead of localStorage
- [ ] Remove sensitive data from Redux/Context that persists
- [ ] Add Content Security Policy (CSP) headers

---

## 📊 Database Schema Improvements

### Current Schema
```sql
-- Good: Has user_id foreign key
-- Good: Has timestamps (created_at, updated_at)
-- Missing: Indexes on commonly queried fields
-- Missing: Some constraints for data integrity
```

### Recommended Enhancements

#### Add Constraints
```sql
-- Non-null constraints for required fields
ALTER TABLE batches ALTER COLUMN name SET NOT NULL;
ALTER TABLE batches ALTER COLUMN fee SET DEFAULT 0;
ALTER TABLE batches ALTER COLUMN gst_rate SET DEFAULT 0;

ALTER TABLE students ALTER COLUMN name SET NOT NULL;
ALTER TABLE students ALTER COLUMN phone SET NOT NULL;

ALTER TABLE payments ALTER COLUMN student_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN month SET NOT NULL;
```

#### Add Soft Deletes (Optional)
```sql
-- If you want to keep historical data
ALTER TABLE batches ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE students ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Query only non-deleted records:
SELECT * FROM batches WHERE deleted_at IS NULL AND user_id = auth.uid();
```

#### Add Audit Trail (Advanced)
```sql
-- Track who made changes and when
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create triggers to auto-populate (advanced topic)
```

---

## 🚀 Performance Optimization

### Query Optimization Checklist

#### N+1 Query Problem
**Problem:** Fetching batches, then for each batch fetching students separately

**Current (Bad):**
```javascript
const batches = await fetchBatches(userId);
for (let batch of batches) {
  const students = await fetchStudents(userId, batch.id); // N+1!
}
```

**Better:**
```javascript
// Fetch all at once, group locally
const students = await fetchStudents(userId);
const studentsByBatch = {};
students.forEach(s => {
  if (!studentsByBatch[s.batch_id]) studentsByBatch[s.batch_id] = [];
  studentsByBatch[s.batch_id].push(s);
});
```

#### Pagination (When Data Grows)
```javascript
// Current: Fetches ALL records
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('user_id', userId);

// Better: Paginate when 1000+ records
const page = 1;
const pageSize = 50;
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('user_id', userId)
  .range((page - 1) * pageSize, page * pageSize - 1);
```

#### Caching Strategy
```javascript
// Don't re-fetch data if recently loaded
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

class DataCache {
  constructor() {
    this.cache = {};
    this.timestamps = {};
  }

  isExpired(key) {
    return !this.timestamps[key] || 
           Date.now() - this.timestamps[key] > CACHE_DURATION_MS;
  }

  set(key, data) {
    this.cache[key] = data;
    this.timestamps[key] = Date.now();
  }

  get(key) {
    if (this.isExpired(key)) return null;
    return this.cache[key];
  }
}
```

---

## 🛡️ Error Handling in Database Operations

### Pattern to Follow
```javascript
export async function fetchBatches(userId) {
  if (!userId) {
    console.error('fetchBatches: No userId provided');
    return [];
  }

  try {
    const uuid = toUuid(userId);
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('user_id', uuid)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching batches:', error);
      // Don't throw, return empty so app doesn't crash
      return [];
    }

    return (data || []).map(mapBatchFromDb);
  } catch (err) {
    console.error('Unexpected error in fetchBatches:', err);
    return [];
  }
}
```

### In Components
```javascript
import { useToast } from '../context/ToastContext';

export default function MyComponent() {
  const { showError } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data, error } = await fetchBatches(userId);
        if (error) {
          showError('Failed to load batches');
          return;
        }
        setBatches(data);
      } catch (err) {
        showError('Network error, please try again');
        console.error('Data load error:', err);
      }
    };
    loadData();
  }, [userId]);
}
```

---

## 📈 Data Validation

### Backend (Database) Validation
```sql
-- Prevent negative fees
ALTER TABLE batches ADD CONSTRAINT positive_fee CHECK (fee >= 0);
ALTER TABLE batches ADD CONSTRAINT valid_gst CHECK (gst_rate >= 0 AND gst_rate <= 100);

-- Prevent invalid phone numbers
ALTER TABLE students ADD CONSTRAINT valid_phone CHECK (phone ~ '^[0-9]{10}$');

-- Valid months
ALTER TABLE payments ADD CONSTRAINT valid_month CHECK (month ~ '^\d{4}-\d{2}$');
```

### Frontend (Client) Validation
Already implemented in `src/utils/commonHelpers.js`:
- `isValidEmail(email)`
- `isValidPhone(phone)`
- `isValidGSTIN(gstin)`
- `normalizePhone(phone)`

### Application Logic Validation
```javascript
// Example: Prevent marking payment twice
const { data, error } = await supabase
  .from('payments')
  .select('*')
  .eq('id', paymentId);

if (data && data[0]?.status === 'paid') {
  showError('Payment already marked as paid');
  return;
}
```

---

## 🔄 Backup & Recovery

### Supabase Backup Strategy
1. **Automated Backups:** Supabase takes daily backups automatically
   - Dashboard > Settings > Backups

2. **Manual Export:** Export data regularly
   ```bash
   # Using supabase CLI
   supabase db pull
   ```

3. **Disaster Recovery Plan:**
   - [ ] Document backup location
   - [ ] Test restore process monthly
   - [ ] Have rollback plan

---

## 📋 Database Health Checklist

- [ ] RLS policies are ENABLED and TESTED
- [ ] Indexes created on user_id, batch_id, student_id
- [ ] Constraints on fees (>= 0) and GST (0-100)
- [ ] Phone number validation at database level
- [ ] All tables have created_at/updated_at timestamps
- [ ] Regular backups are enabled
- [ ] Sensitive data removed from localStorage
- [ ] Error handling on all database operations
- [ ] Timeout handling for slow queries
- [ ] Pagination for large datasets

---

## 🚀 When to Scale

### Warning Signs
- Response time > 1 second
- Rows > 100,000 per table
- Users > 1,000
- Storage > 1GB

### Scaling Actions
1. **Add Indexes** - Already listed above
2. **Enable Caching** - See caching pattern
3. **Implement Pagination** - See pagination pattern
4. **Archive Old Data** - Move > 1 year old data to archive table
5. **Database Read Replicas** - Supabase Pro plan feature

---

## 🔗 Useful Resources

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Indexing](https://www.postgresql.org/docs/current/indexes.html)
- [Supabase Best Practices](https://supabase.com/docs/guides/database/postgres/basics)
- [Security Checklist](https://supabase.com/docs/guides/security)

---

**Database Status:** ⚠️ Needs Security Hardening
**Priority:** HIGH - Implement RLS first
**Estimated Time:** 30-60 minutes
