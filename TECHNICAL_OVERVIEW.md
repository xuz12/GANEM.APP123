# ملخص تقني شامل للمشروع

## معمارية المشروع (Architecture)

### Frontend Stack
- **React 18.3.1** مع **TypeScript 5.5.3**
- **Vite 5.4.2** كأداة بناء وتطوير
- **Tailwind CSS 3.4.1** لنظام التصميم
- **Lucide React** لمكتبة الأيقونات
- **jsPDF** لتوليد ملفات PDF

### Backend & Database
- **Supabase** كـ BaaS (Backend as a Service)
- **PostgreSQL** كقاعدة بيانات رئيسية
- **Supabase Auth** لإدارة المصادقة والجلسات
- **Supabase Edge Functions** (Deno Runtime) للوظائف من جانب الخادم

---

## هيكلية قاعدة البيانات (Database Schema)

### الجداول الأساسية (9 Tables)

1. **user_profiles** - بيانات المستخدمين الموسعة
   - Foreign Key → `auth.users`
   - Columns: `full_name`, `phone_number`, `favorite_club_id`, `points_balance`, `level`, `referral_code`, `referred_by`

2. **clubs** - بيانات الأندية الرياضية
   - 18 نادي سعودي بالكامل
   - Columns: `name_ar`, `name_en`, `logo_url`, `stadium_name`, `city`, `region`

3. **matches** - المباريات
   - Foreign Keys → `clubs` (home/away)
   - Support: `competition_type` (roshn_league, kings_cup)
   - Columns: `match_date`, `home_club_id`, `away_club_id`, `home_score`, `away_score`, `round_number`

4. **attendance** - سجل الحضور
   - Foreign Keys → `user_profiles`, `matches`, `clubs`
   - Columns: `verification_method` (geofence/qr_code/nfc), `verified_at`, `location_data`

5. **points_transactions** - معاملات النقاط
   - Foreign Key → `user_profiles`
   - Columns: `transaction_type` (earn/redeem), `points_amount`, `description`, `related_attendance_id`, `related_offer_id`

6. **offers** - العروض والمكافآت
   - Foreign Key → `partners`
   - Columns: `title_ar`, `description_ar`, `points_cost`, `stock_quantity`, `valid_from`, `valid_until`, `image_url`, `region`

7. **partners** - الشركاء التجاريين
   - Columns: `name_ar`, `logo_url`, `category`, `contact_email`, `is_active`

8. **referrals** - نظام الإحالات
   - Foreign Keys → `user_profiles` (referrer/referee)
   - Columns: `referrer_id`, `referee_id`, `referrer_points_earned`, `referee_points_earned`, `status`

9. **admins** - المسؤولين
   - Foreign Key → `auth.users`
   - Columns: `email`, `full_name`, `role` (super_admin/admin/moderator), `permissions` (JSONB), `last_login_at`

---

## Row Level Security (RLS) Policies

### نهج الأمان
- **جميع الجداول** محمية بـ RLS
- استخدام `auth.uid()` للتحقق من الهوية
- فصل صلاحيات القراءة/الكتابة/التعديل/الحذف
- سياسات خاصة للمسؤولين مع `get_current_admin()`

### أمثلة على السياسات

```sql
-- Users can read own profile
FOR SELECT TO authenticated
USING (auth.uid() = id)

-- Users can update own profile
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id)

-- Admins have full access
FOR ALL TO authenticated
USING (get_current_admin() IS NOT NULL)
```

---

## Database Functions & Triggers

### Functions
1. **`get_current_admin()`** - استرجاع بيانات الأدمن الحالي
2. **`handle_new_user()`** - إنشاء ملف شخصي تلقائي عند التسجيل
3. **`generate_referral_code()`** - توليد كود إحالة فريد

### Triggers
1. **`on_auth_user_created`** - ينفذ عند إنشاء حساب جديد
   - يتحقق إذا كان المستخدم أدمن (يتخطى)
   - ينشئ `user_profile` تلقائياً
   - يمنح 1500 نقطة ترحيبية

---

## Supabase Edge Functions

### 1. **verify-attendance**
```typescript
// Path: /supabase/functions/verify-attendance/index.ts
- Method: POST
- Auth: Required (JWT)
- Purpose: التحقق من حضور المستخدم للمباراة
- Logic:
  • يتحقق من صحة البيانات
  • يمنع التسجيل المكرر
  • يحسب النقاط المكتسبة
  • يسجل في جدول attendance
  • يضيف معاملة نقاط
  • يحدث رصيد المستخدم
```

### 2. **admin-get-users**
```typescript
// Path: /supabase/functions/admin-get-users/index.ts
- Method: GET
- Auth: Required (Admin)
- Purpose: استرجاع قائمة المستخدمين للأدمن
- Returns: List of users with profiles
```

---

## Frontend Architecture

### Context API (State Management)
1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - إدارة حالة المصادقة
   - `signIn`, `signUp`, `signOut`
   - تتبع `session` و `user`

2. **AdminContext** (`src/contexts/AdminContext.tsx`)
   - إدارة حالة المسؤولين
   - التحقق من الصلاحيات
   - `adminSignIn`, `adminSignOut`

### Component Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── SignIn.tsx          # تسجيل دخول المستخدمين
│   │   └── SignUp.tsx          # تسجيل حساب جديد
│   ├── Dashboard/              # 7 صفحات للمستخدمين
│   │   ├── Dashboard.tsx       # Layout رئيسي
│   │   ├── HomePage.tsx
│   │   ├── AttendancePage.tsx
│   │   ├── PointsHistoryPage.tsx
│   │   ├── RewardsPage.tsx
│   │   ├── LevelsPage.tsx
│   │   ├── ReferralsPage.tsx
│   │   └── ProfilePage.tsx
│   └── Admin/                  # 9 صفحات للأدمن
│       ├── AdminApp.tsx
│       ├── AdminSignIn.tsx
│       ├── AdminDashboard.tsx
│       ├── AdminLayout.tsx
│       ├── UsersManagement.tsx
│       ├── MatchesManagement.tsx
│       ├── ClubsManagement.tsx
│       ├── OffersManagement.tsx
│       ├── PartnersManagement.tsx
│       ├── AttendanceVerification.tsx
│       ├── AdminsManagement.tsx
│       └── SettingsPage.tsx
```

---

## Routing Logic

```typescript
// src/App.tsx
- إذا كان URL يبدأ بـ /admin → AdminApp
- خلاف ذلك → User Dashboard/Auth
```

---

## Security Features

### 1. Authentication
- Email/Password authentication
- JWT-based sessions
- `onAuthStateChange` listener
- Automatic token refresh

### 2. Authorization
- Role-based access (user/admin)
- Permission checks في Frontend
- RLS policies في Backend
- Admin verification function

### 3. Data Validation
- TypeScript types للتحقق من البيانات
- Input sanitization
- Foreign key constraints
- Check constraints في Database

---

## Performance Optimizations

1. **Database Indexes** على:
   - `user_profiles.referral_code`
   - `matches.match_date`
   - `attendance.user_id + match_id`

2. **Vite Build Optimization**
   - Code splitting
   - Tree shaking
   - Asset optimization

3. **React Optimization**
   - Lazy loading للمكونات
   - useMemo/useCallback حيث مطلوب

---

## Environment Variables

```bash
VITE_SUPABASE_URL=          # Supabase project URL
VITE_SUPABASE_ANON_KEY=     # Public anon key
```

---

## Data Flow Example (حضور مباراة)

```
User Action → Frontend Component
    ↓
Supabase Client (verify-attendance Edge Function)
    ↓
Edge Function Logic:
  1. Verify user authentication
  2. Check match exists
  3. Prevent duplicate attendance
  4. Calculate points (base 100 + bonuses)
  5. Insert into attendance table
  6. Create points_transaction record
  7. Update user points_balance
    ↓
Return success/error to Frontend
    ↓
UI Update with new balance
```

---

## Migration System

- **20 migration files** في `/supabase/migrations/`
- تسلسل زمني من `20260218` إلى `20260223`
- كل migration يحتوي على:
  - تعليقات markdown موثقة
  - CREATE TABLE statements
  - ALTER TABLE للتعديلات
  - RLS policies
  - Functions & Triggers
  - Sample data (clubs, matches)

---

## API Patterns

### Client-Side (Supabase JS)
```typescript
// Query example
const { data, error } = await supabase
  .from('user_profiles')
  .select('*, clubs(*)')
  .eq('id', userId)
  .maybeSingle();

// Insert example
const { error } = await supabase
  .from('attendance')
  .insert({ user_id, match_id, verification_method });

// Edge Function call
const response = await fetch(
  `${supabaseUrl}/functions/v1/verify-attendance`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }
);
```

---

## Type Safety

- **Generated types** من Supabase schema في `src/lib/database.types.ts`
- TypeScript strict mode enabled
- Type checking في build process

---

## الخلاصة

هذا المشروع يمثل نموذج production-ready لتطبيق web كامل مع:
- ✅ Authentication & Authorization
- ✅ Complex database schema
- ✅ Real-time capabilities (via Supabase)
- ✅ Serverless functions
- ✅ Admin panel
- ✅ RTL support
- ✅ Security best practices
