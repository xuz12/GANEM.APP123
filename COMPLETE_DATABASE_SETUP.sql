/*
  ═══════════════════════════════════════════════════════════════════════════
  إعداد قاعدة بيانات رواد - الإصدار الكامل النهائي
  ═══════════════════════════════════════════════════════════════════════════

  📋 التعليمات:
  1. افتح Supabase Dashboard
  2. اذهب إلى SQL Editor
  3. انسخ هذا الكود كاملاً
  4. شغّله في قاعدة البيانات الجديدة

  ═══════════════════════════════════════════════════════════════════════════
*/

-- تفعيل الإضافات المطلوبة
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- 1. جدول الأندية
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
  api_football_id integer UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view clubs" ON clubs;
CREATE POLICY "Anyone can view clubs"
  ON clubs FOR SELECT
  USING (true);

-- ============================================================================
-- 2. جدول ملفات المستخدمين
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

DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

CREATE POLICY "Users can create their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 3. جدول المباريات
-- ============================================================================
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_club_id uuid REFERENCES clubs(id) NOT NULL,
  away_club_id uuid REFERENCES clubs(id) NOT NULL,
  match_date timestamptz NOT NULL,
  stadium_lat decimal(10, 8) NOT NULL,
  stadium_lng decimal(11, 8) NOT NULL,
  match_type text DEFAULT 'regular' CHECK (match_type IN ('regular', 'derby', 'final', 'afc')),
  competition_type text DEFAULT 'roshn_league' CHECK (competition_type IN ('roshn_league', 'kings_cup', 'super_cup', 'afc_champions')),
  round_number integer,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'finished', 'cancelled')),
  home_score integer,
  away_score integer,
  base_points integer DEFAULT 100,
  points_multiplier decimal(3, 2) DEFAULT 1.0,
  qr_code text UNIQUE,
  nfc_tags text[],
  api_football_id integer UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view matches" ON matches;
CREATE POLICY "Anyone can view matches"
  ON matches FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 4. جدول سجلات الحضور
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  match_id uuid REFERENCES matches(id) NOT NULL,
  verification_method text NOT NULL CHECK (verification_method IN ('geofence', 'qr', 'nfc', 'admin')),
  check_in_time timestamptz DEFAULT now(),
  check_out_time timestamptz,
  points_earned integer DEFAULT 0,
  early_arrival_bonus boolean DEFAULT false,
  stayed_until_end boolean DEFAULT false,
  lat decimal(10, 8),
  lng decimal(11, 8),
  verification_data jsonb DEFAULT '{}'::jsonb,
  verified_by_admin uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, match_id)
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can insert own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Users can update own attendance" ON attendance_records;

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
-- 5. جدول معاملات النقاط
-- ============================================================================
CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  points integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'welcome_bonus', 'match_attendance', 'early_arrival', 'stayed_end',
    'consecutive_bonus', 'season_completion', 'referral', 'referral_first_match',
    'referral_vip', 'daily_login', 'prediction', 'content',
    'redemption', 'admin_adjustment', 'achievement'
  )),
  reference_id uuid,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON points_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON points_transactions;

CREATE POLICY "Users can view own transactions"
  ON points_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON points_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. جدول الشركاء
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

DROP POLICY IF EXISTS "Anyone can view active partners" ON partners;
CREATE POLICY "Anyone can view active partners"
  ON partners FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- 7. جدول عروض الشركاء
-- ============================================================================
CREATE TABLE IF NOT EXISTS partner_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) NOT NULL,
  title_ar text NOT NULL,
  description_ar text NOT NULL,
  points_required integer NOT NULL,
  discount_percentage integer,
  category text NOT NULL,
  region text DEFAULT 'all' CHECK (region IN ('all', 'riyadh', 'jeddah', 'dammam', 'makkah', 'madinah')),
  is_active boolean DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  terms_ar text,
  max_redemptions integer,
  current_redemptions integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE partner_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active offers" ON partner_offers;
CREATE POLICY "Anyone can view active offers"
  ON partner_offers FOR SELECT
  TO authenticated
  USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- ============================================================================
-- 8. جدول عمليات الاستبدال
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

DROP POLICY IF EXISTS "Users can view own redemptions" ON redemptions;
DROP POLICY IF EXISTS "Users can insert own redemptions" ON redemptions;

CREATE POLICY "Users can view own redemptions"
  ON redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions"
  ON redemptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 9. جدول الإحالات
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

DROP POLICY IF EXISTS "Users can view referrals they made" ON user_referrals;
CREATE POLICY "Users can view referrals they made"
  ON user_referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

-- ============================================================================
-- 10. جدول المسؤولين
-- ============================================================================
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions jsonb DEFAULT '{"manage_users": true, "manage_matches": true, "manage_offers": true, "verify_attendance": true}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all admins" ON admins;
DROP POLICY IF EXISTS "Super admins can manage admins" ON admins;

CREATE POLICY "Admins can view all admins"
  ON admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

CREATE POLICY "Super admins can manage admins"
  ON admins FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid()
      AND a.role = 'super_admin'
      AND a.is_active = true
    )
  );

-- ============================================================================
-- 11. جدول الإنجازات
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  achievement_type text NOT NULL CHECK (achievement_type IN (
    'first_match', 'streak_5', 'streak_10', 'season_20',
    'level_2', 'level_3', 'level_4', 'level_5',
    'referrer_bronze', 'referrer_silver', 'referrer_gold'
  )),
  achievement_name_ar text NOT NULL,
  achievement_name_en text NOT NULL,
  points_awarded integer DEFAULT 0,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "System can insert achievements" ON user_achievements;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 12. جدول أكواد QR الشخصية
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  qr_code_data text NOT NULL UNIQUE,
  last_scanned_at timestamptz,
  scan_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_qr_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own QR code" ON user_qr_codes;
DROP POLICY IF EXISTS "System can create QR codes" ON user_qr_codes;

CREATE POLICY "Users can view own QR code"
  ON user_qr_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create QR codes"
  ON user_qr_codes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 13. جدول بطاقات NFC
-- ============================================================================
CREATE TABLE IF NOT EXISTS nfc_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id text NOT NULL UNIQUE,
  user_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'lost', 'damaged')),
  issued_at timestamptz,
  activated_at timestamptz,
  last_used_at timestamptz,
  usage_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nfc_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own NFC tags" ON nfc_tags;
CREATE POLICY "Users can view own NFC tags"
  ON nfc_tags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 14. جدول سجلات المزامنة مع API-Football
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL CHECK (sync_type IN ('teams', 'fixtures', 'live_scores', 'club_logos')),
  status text NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  records_synced integer DEFAULT 0,
  errors jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE api_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view sync logs" ON api_sync_logs;
CREATE POLICY "Admins can view sync logs"
  ON api_sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

-- ============================================================================
-- الفهارس لتحسين الأداء
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_favorite_club ON user_profiles(favorite_club_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_competition ON matches(competition_type);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_match ON attendance_records(match_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_user_qr_codes_data ON user_qr_codes(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_nfc_tags_tag_id ON nfc_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_nfc_tags_user ON nfc_tags(user_id);

-- ============================================================================
-- الدوال المساعدة
-- ============================================================================

-- دالة توليد كود إحالة فريد
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

-- دالة حساب المستوى بناءً على النقاط
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

-- دالة التحقق من السياج الجغرافي
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

-- دالة للحصول على معلومات المسؤول الحالي
CREATE OR REPLACE FUNCTION get_current_admin()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  permissions jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.email, a.full_name, a.role, a.permissions
  FROM admins a
  WHERE a.id = auth.uid() AND a.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- المُحفزات (Triggers)
-- ============================================================================

-- تحديث المستوى تلقائياً عند تغيير النقاط
DROP TRIGGER IF EXISTS trigger_update_user_level ON user_profiles;
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

-- توليد كود إحالة عند إنشاء ملف مستخدم
DROP TRIGGER IF EXISTS trigger_set_referral_code ON user_profiles;
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

-- إنشاء ملف مستخدم تلقائياً عند التسجيل
DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM admins WHERE id = NEW.id) INTO is_admin;

  IF NOT is_admin THEN
    INSERT INTO user_profiles (id, full_name, referral_code, points, total_points_earned)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
      generate_referral_code(),
      1500,
      1500
    );

    INSERT INTO points_transactions (user_id, points, transaction_type, description)
    VALUES (
      NEW.id,
      1500,
      'welcome_bonus',
      'مكافأة الترحيب - نقاط البداية'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_user_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_on_signup();

-- منح إنجاز عند الوصول لمستوى جديد
DROP TRIGGER IF EXISTS trigger_award_level_achievement ON user_profiles;
CREATE OR REPLACE FUNCTION award_level_achievement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.level > OLD.level THEN
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name_ar, achievement_name_en, points_awarded)
    VALUES (
      NEW.id,
      'level_' || NEW.level,
      'وصلت للمستوى ' || NEW.level,
      'Reached Level ' || NEW.level,
      NEW.level * 100
    )
    ON CONFLICT (user_id, achievement_type) DO NOTHING;

    IF NOT EXISTS (
      SELECT 1 FROM points_transactions
      WHERE user_id = NEW.id
      AND transaction_type = 'achievement'
      AND description LIKE '%المستوى ' || NEW.level || '%'
    ) THEN
      INSERT INTO points_transactions (user_id, points, transaction_type, description)
      VALUES (
        NEW.id,
        NEW.level * 100,
        'achievement',
        'مكافأة الوصول للمستوى ' || NEW.level
      );

      UPDATE user_profiles
      SET
        points = points + (NEW.level * 100),
        total_points_earned = total_points_earned + (NEW.level * 100)
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_level_achievement
  AFTER UPDATE OF level ON user_profiles
  FOR EACH ROW
  WHEN (NEW.level > OLD.level)
  EXECUTE FUNCTION award_level_achievement();

-- منح إنجاز الحضور الأول
DROP TRIGGER IF EXISTS trigger_award_first_match_achievement ON attendance_records;
CREATE OR REPLACE FUNCTION award_first_match_achievement()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT matches_attended FROM user_profiles WHERE id = NEW.user_id) = 1 THEN
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name_ar, achievement_name_en, points_awarded)
    VALUES (
      NEW.user_id,
      'first_match',
      'أول مباراة',
      'First Match',
      50
    )
    ON CONFLICT (user_id, achievement_type) DO NOTHING;

    IF NOT EXISTS (
      SELECT 1 FROM points_transactions
      WHERE user_id = NEW.user_id
      AND transaction_type = 'achievement'
      AND description = 'إنجاز: حضور أول مباراة'
    ) THEN
      INSERT INTO points_transactions (user_id, points, transaction_type, description)
      VALUES (
        NEW.user_id,
        50,
        'achievement',
        'إنجاز: حضور أول مباراة'
      );

      UPDATE user_profiles
      SET
        points = points + 50,
        total_points_earned = total_points_earned + 50
      WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_award_first_match_achievement
  AFTER INSERT ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION award_first_match_achievement();

-- إنشاء كود QR شخصي عند إنشاء الملف
DROP TRIGGER IF EXISTS trigger_create_user_qr_code ON user_profiles;
CREATE OR REPLACE FUNCTION create_user_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_qr_codes (user_id, qr_code_data)
  VALUES (
    NEW.id,
    'RAWAD-USER-' || NEW.id || '-' || extract(epoch from now())::text
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_qr_code
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_qr_code();

-- ============================================================================
-- سياسات إضافية للمسؤولين
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
CREATE POLICY "Admins can view all user profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;
CREATE POLICY "Admins can update user profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage matches" ON matches;
CREATE POLICY "Admins can manage matches"
  ON matches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage clubs" ON clubs;
CREATE POLICY "Admins can manage clubs"
  ON clubs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view all attendance records" ON attendance_records;
CREATE POLICY "Admins can view all attendance records"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can insert attendance records" ON attendance_records;
CREATE POLICY "Admins can insert attendance records"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view all points transactions" ON points_transactions;
CREATE POLICY "Admins can view all points transactions"
  ON points_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can insert points transactions" ON points_transactions;
CREATE POLICY "Admins can insert points transactions"
  ON points_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage partners" ON partners;
CREATE POLICY "Admins can manage partners"
  ON partners FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage offers" ON partner_offers;
CREATE POLICY "Admins can manage offers"
  ON partner_offers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view all redemptions" ON redemptions;
CREATE POLICY "Admins can view all redemptions"
  ON redemptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can update redemptions" ON redemptions;
CREATE POLICY "Admins can update redemptions"
  ON redemptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can view all NFC tags" ON nfc_tags;
CREATE POLICY "Admins can view all NFC tags"
  ON nfc_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage NFC tags" ON nfc_tags;
CREATE POLICY "Admins can manage NFC tags"
  ON nfc_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins a
      WHERE a.id = auth.uid() AND a.is_active = true
    )
  );

/*
  ═══════════════════════════════════════════════════════════════════════════
  ✅ انتهى الإعداد!

  الآن قاعدة بياناتك جاهزة مع:
  - 14 جدول كامل
  - نظام النقاط المتقدم
  - نظام الإحالات
  - نظام الإنجازات
  - لوحة التحكم للمسؤولين
  - بطاقات NFC وأكواد QR
  - المزامنة مع API-Football

  اذهب الآن إلى التطبيق وسجل دخولك!
  ═══════════════════════════════════════════════════════════════════════════
*/