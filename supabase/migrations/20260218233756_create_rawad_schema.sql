/*
  # Rawad - منصة ولاء المشجعين - إنشاء قاعدة البيانات الكاملة

  ## نظرة عامة
  هذا الملف ينشئ قاعدة بيانات كاملة لمنصة Rawad لإدارة حضور المشجعين ونظام النقاط والمكافآت

  ## 1. الجداول الجديدة

  ### user_profiles - ملفات المستخدمين
  - `id` (uuid, primary key) - معرف المستخدم من auth.users
  - `full_name` (text) - الاسم الكامل
  - `phone` (text) - رقم الهاتف
  - `favorite_club_id` (uuid) - النادي المفضل
  - `points` (integer) - إجمالي النقاط الحالية
  - `total_points_earned` (integer) - إجمالي النقاط المكتسبة عبر الزمن
  - `level` (integer) - المستوى الحالي (1-5)
  - `matches_attended` (integer) - عدد المباريات المحضورة
  - `consecutive_matches` (integer) - المباريات المتتالية
  - `referral_code` (text) - كود الإحالة الخاص
  - `referred_by` (uuid) - من أحاله
  - `created_at` (timestamptz) - تاريخ التسجيل

  ### clubs - الأندية
  - `id` (uuid, primary key)
  - `name_ar` (text) - اسم النادي بالعربية
  - `name_en` (text) - اسم النادي بالإنجليزية
  - `logo_url` (text) - رابط الشعار
  - `city` (text) - المدينة
  - `stadium_name` (text) - اسم الملعب
  - `stadium_lat` (decimal) - خط العرض للملعب
  - `stadium_lng` (decimal) - خط الطول للملعب
  - `geofence_radius` (integer) - نطاق السياج الجغرافي بالمتر

  ### matches - المباريات
  - `id` (uuid, primary key)
  - `home_club_id` (uuid) - النادي المضيف
  - `away_club_id` (uuid) - النادي الضيف
  - `match_date` (timestamptz) - تاريخ ووقت المباراة
  - `stadium_lat` (decimal) - موقع الملعب
  - `stadium_lng` (decimal) - موقع الملعب
  - `match_type` (text) - نوع المباراة (regular/derby/final/afc)
  - `status` (text) - حالة المباراة (upcoming/live/finished)
  - `base_points` (integer) - النقاط الأساسية
  - `points_multiplier` (decimal) - مضاعف النقاط
  - `qr_code` (text) - كود QR للمباراة
  - `nfc_tags` (text[]) - معرفات NFC المفعلة

  ### attendance_records - سجلات الحضور
  - `id` (uuid, primary key)
  - `user_id` (uuid) - المستخدم
  - `match_id` (uuid) - المباراة
  - `verification_method` (text) - طريقة الإثبات (geofence/qr/nfc)
  - `check_in_time` (timestamptz) - وقت تسجيل الدخول
  - `check_out_time` (timestamptz) - وقت الخروج
  - `points_earned` (integer) - النقاط المكتسبة
  - `early_arrival_bonus` (boolean) - مكافأة الحضور المبكر
  - `stayed_until_end` (boolean) - البقاء حتى النهاية
  - `lat` (decimal) - موقع التحقق
  - `lng` (decimal) - موقع التحقق
  - `verification_data` (jsonb) - بيانات إضافية للتحقق

  ### points_transactions - معاملات النقاط
  - `id` (uuid, primary key)
  - `user_id` (uuid) - المستخدم
  - `points` (integer) - عدد النقاط (موجب للكسب، سالب للاستبدال)
  - `transaction_type` (text) - نوع المعاملة
  - `reference_id` (uuid) - معرف مرجعي (مباراة، استبدال، إلخ)
  - `description` (text) - وصف المعاملة
  - `created_at` (timestamptz)

  ### partners - الشركاء
  - `id` (uuid, primary key)
  - `name_ar` (text) - اسم الشريك
  - `name_en` (text)
  - `logo_url` (text)
  - `category` (text) - الفئة (restaurant/retail/entertainment/services)
  - `description_ar` (text)
  - `website` (text)
  - `is_active` (boolean)

  ### partner_offers - عروض الشركاء
  - `id` (uuid, primary key)
  - `partner_id` (uuid) - الشريك
  - `title_ar` (text) - عنوان العرض
  - `description_ar` (text) - وصف العرض
  - `points_required` (integer) - النقاط المطلوبة
  - `discount_percentage` (integer) - نسبة الخصم
  - `value_in_sar` (decimal) - القيمة بالريال
  - `category` (text) - الفئة
  - `is_active` (boolean)
  - `valid_from` (timestamptz)
  - `valid_until` (timestamptz)
  - `terms_ar` (text) - الشروط والأحكام
  - `max_redemptions` (integer) - الحد الأقصى للاستبدال
  - `current_redemptions` (integer) - عدد الاستبدالات الحالية

  ### redemptions - عمليات الاستبدال
  - `id` (uuid, primary key)
  - `user_id` (uuid)
  - `offer_id` (uuid)
  - `points_spent` (integer)
  - `redemption_code` (text) - كود الاستبدال
  - `status` (text) - الحالة (pending/used/expired)
  - `redeemed_at` (timestamptz)
  - `used_at` (timestamptz)
  - `expires_at` (timestamptz)

  ### user_referrals - الإحالات
  - `id` (uuid, primary key)
  - `referrer_id` (uuid) - من أحال
  - `referred_id` (uuid) - من تمت إحالته
  - `status` (text) - الحالة (registered/first_match/vip)
  - `points_awarded` (integer) - النقاط الممنوحة
  - `created_at` (timestamptz)

  ## 2. الأمان (RLS)
  - تفعيل RLS على جميع الجداول
  - سياسات محددة لكل جدول تضمن أن المستخدمين يصلون فقط لبياناتهم
  - بعض الجداول للقراءة العامة (clubs, matches, partners, offers)

  ## 3. الفهارس
  - فهارس على الأعمدة المستخدمة بكثرة للاستعلام
  - فهارس على المفاتيح الأجنبية

  ## 4. الدوال المساعدة
  - دالة لحساب المستوى بناءً على النقاط
  - دالة للتحقق من السياج الجغرافي
  - دالة لتوليد كود إحالة فريد
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- 1. CLUBS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  logo_url text,
  city text NOT NULL,
  stadium_name text NOT NULL,
  stadium_lat decimal(10, 8) NOT NULL,
  stadium_lng decimal(11, 8) NOT NULL,
  geofence_radius integer DEFAULT 200,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clubs"
  ON clubs FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 2. USER PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  favorite_club_id uuid REFERENCES clubs(id),
  points integer DEFAULT 0,
  total_points_earned integer DEFAULT 0,
  level integer DEFAULT 1,
  matches_attended integer DEFAULT 0,
  consecutive_matches integer DEFAULT 0,
  referral_code text UNIQUE NOT NULL,
  referred_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 3. MATCHES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_club_id uuid REFERENCES clubs(id) NOT NULL,
  away_club_id uuid REFERENCES clubs(id) NOT NULL,
  match_date timestamptz NOT NULL,
  stadium_lat decimal(10, 8) NOT NULL,
  stadium_lng decimal(11, 8) NOT NULL,
  match_type text DEFAULT 'regular' CHECK (match_type IN ('regular', 'derby', 'final', 'afc')),
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'finished', 'cancelled')),
  base_points integer DEFAULT 100,
  points_multiplier decimal(3, 2) DEFAULT 1.0,
  qr_code text UNIQUE,
  nfc_tags text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches"
  ON matches FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 4. ATTENDANCE RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  match_id uuid REFERENCES matches(id) NOT NULL,
  verification_method text NOT NULL CHECK (verification_method IN ('geofence', 'qr', 'nfc')),
  check_in_time timestamptz DEFAULT now(),
  check_out_time timestamptz,
  points_earned integer DEFAULT 0,
  early_arrival_bonus boolean DEFAULT false,
  stayed_until_end boolean DEFAULT false,
  lat decimal(10, 8),
  lng decimal(11, 8),
  verification_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, match_id)
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attendance"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance"
  ON attendance_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 5. POINTS TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  points integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'match_attendance', 'early_arrival', 'stayed_end', 'consecutive_bonus',
    'season_completion', 'referral', 'daily_login', 'prediction', 'content',
    'redemption', 'admin_adjustment'
  )),
  reference_id uuid,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON points_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. PARTNERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  logo_url text,
  category text NOT NULL CHECK (category IN ('restaurant', 'retail', 'entertainment', 'services')),
  description_ar text,
  website text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active partners"
  ON partners FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- 7. PARTNER OFFERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS partner_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) NOT NULL,
  title_ar text NOT NULL,
  description_ar text NOT NULL,
  points_required integer NOT NULL,
  discount_percentage integer,
  value_in_sar decimal(10, 2),
  category text NOT NULL,
  is_active boolean DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  terms_ar text,
  max_redemptions integer,
  current_redemptions integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE partner_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active offers"
  ON partner_offers FOR SELECT
  TO authenticated
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- ============================================================================
-- 8. REDEMPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  offer_id uuid REFERENCES partner_offers(id) NOT NULL,
  points_spent integer NOT NULL,
  redemption_code text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  redeemed_at timestamptz DEFAULT now(),
  used_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions"
  ON redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions"
  ON redemptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 9. USER REFERRALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users(id) NOT NULL,
  referred_id uuid REFERENCES auth.users(id) NOT NULL,
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'first_match', 'vip')),
  points_awarded integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view referrals they made"
  ON user_referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_favorite_club ON user_profiles(favorite_club_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_match ON attendance_records(match_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM user_profiles WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user level based on total points
CREATE OR REPLACE FUNCTION calculate_user_level(total_points integer)
RETURNS integer AS $$
BEGIN
  IF total_points >= 30000 THEN RETURN 5;
  ELSIF total_points >= 15000 THEN RETURN 4;
  ELSIF total_points >= 5000 THEN RETURN 3;
  ELSIF total_points >= 1000 THEN RETURN 2;
  ELSE RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if location is within geofence
CREATE OR REPLACE FUNCTION is_within_geofence(
  user_lat decimal,
  user_lng decimal,
  stadium_lat decimal,
  stadium_lng decimal,
  radius_meters integer
)
RETURNS boolean AS $$
DECLARE
  distance_meters decimal;
BEGIN
  distance_meters := (
    6371000 * acos(
      cos(radians(stadium_lat)) *
      cos(radians(user_lat)) *
      cos(radians(user_lng) - radians(stadium_lng)) +
      sin(radians(stadium_lat)) *
      sin(radians(user_lat))
    )
  );
  RETURN distance_meters <= radius_meters;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-update user level when points change
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := calculate_user_level(NEW.total_points_earned);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_level
  BEFORE UPDATE OF total_points_earned ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_level();

-- Trigger to auto-generate referral code on user profile creation
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();