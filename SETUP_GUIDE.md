# دليل تشغيل المشروع على قاعدة بيانات Supabase خاصة

## 📋 المتطلبات الأساسية

قبل البدء، تأكد من توفر:
- ✅ حساب على [Supabase](https://supabase.com) (مجاني)
- ✅ Node.js (الإصدار 18 أو أحدث)
- ✅ npm أو yarn
- ✅ محرر نصوص (VS Code مُوصى به)
- ✅ Git (اختياري)

---

## 🚀 الخطوات التفصيلية

### 1️⃣ إنشاء مشروع Supabase جديد

1. **افتح موقع Supabase**
   - اذهب إلى: https://supabase.com
   - سجّل دخول أو أنشئ حساب جديد

2. **أنشئ مشروع جديد**
   - اضغط على "New Project"
   - اختر Organization (أو أنشئ واحدة جديدة)
   - أدخل المعلومات:
     - **Name**: rawad-loyalty-platform (أو أي اسم تفضله)
     - **Database Password**: كلمة مرور قوية (احفظها!)
     - **Region**: اختر أقرب منطقة (مثل: Dubai أو Frankfurt)
     - **Pricing Plan**: Free (كافي للبداية)
   - اضغط "Create new project"

3. **انتظر إنشاء المشروع**
   - سيستغرق دقيقتين تقريباً
   - عند الانتهاء، ستظهر لوحة التحكم

---

### 2️⃣ الحصول على معلومات الاتصال

1. **اذهب إلى إعدادات المشروع**
   - من القائمة الجانبية، اضغط على ⚙️ **Settings**
   - ثم اضغط على **API**

2. **انسخ المعلومات التالية:**

   📋 **Project URL**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   📋 **anon public key** (تحت Project API keys)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
   ```

   📋 **service_role key** (استخدمها بحذر - للخادم فقط!)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
   ```

---

### 3️⃣ إعداد المشروع محلياً

1. **نزّل المشروع**
   ```bash
   # إذا كان على GitHub
   git clone [رابط-المشروع]
   cd project-folder

   # أو إذا كان ملف مضغوط
   # فك الضغط وافتح المجلد
   ```

2. **ثبّت التبعيات**
   ```bash
   npm install
   ```

3. **أنشئ ملف البيئة**
   ```bash
   # انسخ ملف المثال
   cp .env.example .env
   ```

4. **عدّل ملف `.env`**

   افتح ملف `.env` وعدّل القيم:

   ```env
   # ضع معلومات مشروعك هنا
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # App Configuration (اتركها كما هي)
   VITE_APP_NAME=رواد - غنائم
   VITE_APP_VERSION=3.0.0
   VITE_DEFAULT_LANGUAGE=ar
   VITE_POINTS_TO_SAR_RATIO=0.015
   ```

---

### 4️⃣ إعداد قاعدة البيانات

الآن نحتاج لتطبيق جميع الـ Migrations لإنشاء الجداول والبيانات.

#### طريقة 1: استخدام واجهة Supabase (الأسهل) ⭐

1. **افتح SQL Editor**
   - من لوحة تحكم Supabase
   - اضغط على 🛢️ **SQL Editor** من القائمة الجانبية

2. **طبّق كل Migration بالترتيب**

   افتح كل ملف في مجلد `supabase/migrations/` بالترتيب الزمني وطبّقه:

   **أ) Migration 1: إنشاء الهيكل الأساسي**
   ```bash
   # افتح الملف:
   supabase/migrations/20260218233756_create_rawad_schema.sql
   ```
   - انسخ محتوى الملف بالكامل
   - الصقه في SQL Editor
   - اضغط **Run** (أو F5)
   - انتظر رسالة "Success"

   **ب) Migration 2: إصلاح RLS**
   ```bash
   # افتح الملف:
   supabase/migrations/20260219211041_fix_rls_policies.sql
   ```
   - نفس الخطوات: انسخ → الصق → Run

   **ج) طبّق باقي الملفات بنفس الطريقة بالترتيب:**
   ```
   20260219213755_fix_points_transactions_rls.sql
   20260222191614_add_region_to_offers.sql
   20260222193323_add_more_saudi_clubs.sql
   20260222193616_update_clubs_real_data.sql
   20260222201001_add_missing_clubs.sql
   20260222201217_add_first_ten_rounds_matches.sql
   20260222201606_add_round_number_to_matches.sql
   20260222203448_add_competition_types.sql
   20260222203522_add_kings_cup_and_roshn_matches_v2.sql
   20260222205457_add_kings_cup_remaining_rounds_complete.sql
   20260222210323_add_admin_system.sql
   20260223192847_add_auto_create_user_profile.sql
   20260223193047_fix_auto_profile_exclude_admins.sql
   20260223193439_reduce_welcome_points_to_1500.sql
   20260223195148_add_admin_access_to_user_profiles.sql
   20260223200031_fix_get_current_admin_function.sql
   20260223200513_fix_admins_rls_infinite_recursion.sql
   20260319001243_remove_sar_value_from_offers.sql
   20260319001459_add_more_roshn_league_matches.sql
   20260322035257_update_points_system_new_structure.sql
   20260322051456_add_achievement_triggers.sql
   20260322052917_update_offers_points_values.sql
   20260322053154_fix_referral_system_data_type_v2.sql
   20260322053545_add_user_personal_qr_codes.sql
   20260322054510_add_nfc_infrastructure.sql
   20260322060755_add_api_football_sync_infrastructure.sql
   ```

   ⚠️ **مهم جداً**: طبّق الملفات بالترتيب الزمني (من الأقدم للأحدث)

#### طريقة 2: استخدام Supabase CLI (للمتقدمين)

```bash
# ثبّت Supabase CLI
npm install -g supabase

# سجّل دخول
supabase login

# اربط المشروع
supabase link --project-ref xxxxxxxxxxxxx

# طبّق جميع الـ Migrations
supabase db push
```

---

### 5️⃣ إنشاء أول حساب أدمن

بعد تطبيق جميع الـ Migrations، نحتاج لإنشاء حساب أدمن:

1. **افتح SQL Editor في Supabase**

2. **نفّذ هذا الكود** (عدّل البريد وكلمة المرور):

```sql
-- أولاً: أنشئ مستخدم في نظام المصادقة
-- اذهب إلى Authentication > Users > Add user
-- أو استخدم واجهة التسجيل في التطبيق ثم عدّل الكود التالي

-- بعد إنشاء المستخدم، أضفه كأدمن
-- عدّل البريد الإلكتروني ليطابق المستخدم الذي أنشأته
INSERT INTO admins (user_id, email, full_name, role, permissions, is_active)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
  'admin@example.com',
  'المسؤول الرئيسي',
  'super_admin',
  '{
    "manage_users": true,
    "manage_matches": true,
    "manage_offers": true,
    "manage_partners": true,
    "verify_attendance": true,
    "manage_admins": true,
    "view_reports": true,
    "adjust_points": true
  }'::jsonb,
  true
);
```

**أو بطريقة أسهل:**

1. سجّل في التطبيق كمستخدم عادي
2. افتح SQL Editor
3. نفّذ هذا الكود (ضع بريدك):

```sql
-- حوّل مستخدم عادي إلى أدمن
INSERT INTO admins (user_id, email, full_name, role, permissions, is_active)
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name',
  'super_admin',
  '{
    "manage_users": true,
    "manage_matches": true,
    "manage_offers": true,
    "manage_partners": true,
    "verify_attendance": true,
    "manage_admins": true,
    "view_reports": true,
    "adjust_points": true
  }'::jsonb,
  true
FROM auth.users
WHERE email = 'بريدك@هنا.com';
```

---

### 6️⃣ تشغيل التطبيق

1. **شغّل خادم التطوير**
   ```bash
   npm run dev
   ```

2. **افتح المتصفح**
   ```
   http://localhost:5173
   ```

3. **جرّب التطبيق**
   - سجّل حساب جديد
   - استكشف الواجهة
   - سجّل دخول للوحة الإدارة من `/admin`

---

## 🔧 إعداد Edge Functions (اختياري)

إذا أردت استخدام الوظائف السحابية (للحضور، المزامنة، إلخ):

### 1. تفعيل Edge Functions

1. **من لوحة تحكم Supabase**
   - اذهب إلى **Edge Functions**

2. **رفع كل Function**

   يدوياً من واجهة Supabase:
   - اضغط "Create Function"
   - الاسم: `verify-attendance`
   - انسخ محتوى `supabase/functions/verify-attendance/index.ts`
   - الصقه واضغط "Deploy"
   - كرر لكل Function

### 2. إضافة أسرار Edge Functions

بعض الوظائف تحتاج متغيرات (مثل API-Football):

1. **اذهب إلى Settings > Edge Functions**
2. **أضف Secrets:**
   ```
   API_FOOTBALL_KEY=your-api-key-here
   API_FOOTBALL_HOST=v3.football.api-sports.io
   ```

---

## 🎯 إعداد API-Football (اختياري)

للمزامنة التلقائية للمباريات:

1. **احصل على API Key**
   - سجّل في https://www.api-football.com/
   - خطة مجانية: 100 طلب/يوم

2. **أضف المفتاح**
   - في Supabase: Settings > Edge Functions > Secrets
   - أضف: `API_FOOTBALL_KEY`

3. **استخدم لوحة المزامنة**
   - سجّل دخول كأدمن
   - اذهب إلى "API Sync"
   - اضغط "Sync Teams" ثم "Sync Matches"

---

## ✅ التحقق من التثبيت

### 1. فحص قاعدة البيانات

```sql
-- تحقق من وجود الجداول
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- يجب أن ترى:
-- admins
-- attendance
-- clubs
-- matches
-- nfc_tags
-- offers
-- partners
-- points_transactions
-- redemptions
-- referrals
-- user_profiles
-- api_sync_logs
```

### 2. فحص البيانات الأساسية

```sql
-- تحقق من وجود الأندية (يجب أن يكون 18 نادي)
SELECT COUNT(*) FROM clubs;

-- تحقق من وجود المباريات
SELECT COUNT(*) FROM matches;

-- تحقق من وجود عروض
SELECT COUNT(*) FROM offers;
```

### 3. فحص التطبيق

- ✅ تسجيل مستخدم جديد يعمل
- ✅ يحصل على 1,500 نقطة ترحيبية
- ✅ يمكن عرض المباريات
- ✅ لوحة الإدارة تعمل
- ✅ يمكن البحث عن الأندية

---

## 🔐 إعدادات الأمان المهمة

### 1. تأمين قاعدة البيانات

تأكد من أن RLS مفعّل على جميع الجداول:

```sql
-- تحقق من حالة RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- يجب أن تكون rowsecurity = true للجميع
```

### 2. إعدادات المصادقة

من لوحة Supabase:
1. اذهب إلى **Authentication > Settings**
2. **Site URL**: ضع رابط موقعك (أو http://localhost:5173 للتطوير)
3. **Redirect URLs**: أضف:
   ```
   http://localhost:5173/**
   https://yourdomain.com/**
   ```

### 3. تعطيل تأكيد البريد (للتطوير فقط)

1. **Authentication > Settings > Email**
2. قم بإيقاف "Enable email confirmations"
3. ⚠️ **للإنتاج**: فعّلها مجدداً!

---

## 📊 إضافة بيانات تجريبية

### أندية (تم إضافتها تلقائياً ✅)
18 نادي سعودي جاهزين

### مباريات (تم إضافتها تلقائياً ✅)
240+ مباراة جاهزة

### إضافة عروض يدوياً

```sql
-- مثال: عرض تذكرة مباراة
INSERT INTO offers (
  title_ar, title_en,
  description_ar, description_en,
  image_url,
  points_required,
  category, tier,
  available_quantity,
  min_level_required,
  valid_from, valid_until,
  is_active,
  redemption_instructions,
  partner_id
) VALUES (
  'تذكرة مباراة VIP',
  'VIP Match Ticket',
  'تذكرة VIP لحضور أي مباراة في دوري روشن',
  'VIP ticket to attend any Roshn League match',
  'https://example.com/ticket.jpg',
  10000,
  'tickets',
  4,
  50,
  3,
  NOW(),
  NOW() + INTERVAL '3 months',
  true,
  'احجز مقعدك من خلال التواصل مع إدارة النادي',
  NULL  -- أو ضع UUID شريك إذا أضفت واحد
);
```

### إضافة شريك

```sql
INSERT INTO partners (
  name_ar, name_en,
  logo_url,
  category,
  description_ar, description_en,
  website,
  contact_email,
  is_active
) VALUES (
  'نادي الهلال',
  'Al Hilal Club',
  'https://example.com/hilal-logo.png',
  'sports',
  'نادي الهلال السعودي',
  'Al Hilal Saudi Club',
  'https://alhilal.sa',
  'info@alhilal.sa',
  true
);
```

---

## 🐛 حل المشاكل الشائعة

### المشكلة 1: "Failed to fetch"

**السبب**: متغيرات البيئة خاطئة

**الحل**:
1. تأكد من ملف `.env`
2. تحقق من الـ VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY
3. أعد تشغيل الخادم: `npm run dev`

### المشكلة 2: "Row Level Security policy violation"

**السبب**: لم يتم تطبيق الـ Migrations بشكل صحيح

**الحل**:
1. تحقق من تطبيق جميع الـ Migrations بالترتيب
2. خصوصاً ملفات `fix_rls_policies`

### المشكلة 3: "User profile not found"

**السبب**: الـ Trigger لإنشاء ملف المستخدم تلقائياً لم يعمل

**الحل**:
```sql
-- أنشئ ملف يدوياً
INSERT INTO user_profiles (id, email, full_name, total_points)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'بريدك@هنا.com'),
  'بريدك@هنا.com',
  'اسمك',
  1500
);
```

### المشكلة 4: لا توجد مباريات

**السبب**: لم يتم تطبيق Migrations البيانات

**الحل**:
- تأكد من تطبيق جميع Migrations التي تبدأ بـ `add_matches`
- خصوصاً: `20260222201217_add_first_ten_rounds_matches.sql`

### المشكلة 5: Edge Functions لا تعمل

**السبب**: لم يتم رفعها أو تفعيلها

**الحل**:
1. تحقق من وجودها في لوحة Supabase
2. تحقق من الأسرار (Secrets) إذا كانت تحتاجها
3. راجع الـ Logs في Supabase

---

## 📱 النشر للإنتاج

### 1. بناء التطبيق

```bash
npm run build
```

### 2. النشر على Netlify

```bash
# ثبّت Netlify CLI
npm install -g netlify-cli

# سجّل دخول
netlify login

# انشر
netlify deploy --prod
```

### 3. النشر على Vercel

```bash
# ثبّت Vercel CLI
npm install -g vercel

# سجّل دخول
vercel login

# انشر
vercel --prod
```

### 4. تحديث متغيرات البيئة

في منصة الاستضافة (Netlify/Vercel):
1. أضف متغيرات البيئة:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. أعد البناء

---

## 📚 موارد إضافية

- 📖 [توثيق Supabase](https://supabase.com/docs)
- 📖 [توثيق React](https://react.dev)
- 📖 [توثيق Vite](https://vitejs.dev)
- 📖 [دليل TypeScript](https://www.typescriptlang.org/docs)
- 📖 [Tailwind CSS](https://tailwindcss.com/docs)

---

## ✨ نصائح مهمة

1. **احفظ معلومات Supabase بأمان**
   - لا تشارك الـ `service_role` key أبداً
   - استخدم `.env` ولا ترفعه على Git

2. **للتطوير المحلي**
   - استخدم `npm run dev`
   - التغييرات تظهر فوراً

3. **للإنتاج**
   - استخدم `npm run build`
   - راجع الأخطاء قبل النشر
   - فعّل تأكيد البريد

4. **النسخ الاحتياطي**
   - من Supabase: Database > Backups
   - احفظ نسخة أسبوعياً على الأقل

5. **المراقبة**
   - راقب استخدام قاعدة البيانات
   - راقب طلبات API
   - راقب Edge Functions

---

## 🎉 مبروك!

الآن لديك نسخة كاملة من منصة رواد تعمل على قاعدة بيانات خاصة بك!

### الخطوات التالية:
- ✅ أضف المزيد من العروض والشركاء
- ✅ خصص التصميم حسب ذوقك
- ✅ فعّل المزامنة مع API-Football
- ✅ انشر التطبيق
- ✅ ابدأ استقبال المستخدمين

---

**💡 محتاج مساعدة؟**

راجع:
- `PROJECT_OVERVIEW.md` - نظرة شاملة على المشروع
- `TECHNICAL_OVERVIEW.md` - التفاصيل التقنية
- `README.md` - البداية السريعة

---

**🌟 بالتوفيق في مشروعك! 🌟**

*آخر تحديث: 22 مارس 2026*
