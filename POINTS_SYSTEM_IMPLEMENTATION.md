# دليل تطبيق نظام النقاط v3 - GHANEM

## نظرة عامة
تم تحديث نظام النقاط بالكامل ليعكس الجدول الرسمي v3 مع زيادة قيم النقاط وإضافة مكافآت جديدة.

---

## كيفية استخدام النظام

### 1. التحقق من حضور المباراة (NFC)

```typescript
// استدعاء Edge Function للتحقق من الحضور
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/verify-attendance`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: user.id,
      matchId: match.id,
      nfcCode: scannedCode,
    }),
  }
);

const result = await response.json();
// result: { success, pointsEarned, earlyArrivalBonus, totalPoints, matchType }
```

**ما يحدث تلقائياً:**
- ✅ منح نقاط الحضور حسب نوع المباراة (1000-2500)
- ✅ مكافأة الحضور المبكر +200 إذا كان قبل 45 دقيقة
- ✅ تحديث عدد المباريات في user_profiles
- ✅ تفعيل Trigger لحساب مكافآت الإنجازات (3، 5، 10، 20 مباراة)
- ✅ إضافة معاملة في points_transactions

### 2. إضافة نقاط التفاعلات

```typescript
// استدعاء Edge Function لإضافة نقاط التفاعل
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/add-interaction-points`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      actionType: 'prediction', // أو 'referral', 'complete_profile', إلخ
      matchId: match.id, // اختياري
      metadata: { /* بيانات إضافية */ }
    }),
  }
);

const result = await response.json();
// result: { success, pointsEarned, actionType, description }
```

**أنواع التفاعلات المتاحة:**
- `referral` → 300 غنيمة
- `prediction` → 150 غنيمة
- `complete_profile` → 100 غنيمة
- `share_achievement` → 100 غنيمة
- `rate_match` → 50 غنيمة
- `man_of_match_vote` → 100 غنيمة
- `partner_first_visit` → 200 غنيمة
- `partner_spending` → 50 لكل 10 ريال
- `rate_partner` → 50 غنيمة

**منع التكرار:**
- يتحقق النظام من user_id + action_type + match_id + التاريخ
- يرفض بصمت إذا كان مكرراً

### 3. استخدام دوال النقاط في الواجهة

```typescript
import {
  POINTS_CONFIG,
  getLevelInfo,
  calculateAttendancePoints,
  pointsToSAR,
  sarToPoints,
  calculatePartnerPoints
} from '@/utils/pointsSystem';

// الحصول على معلومات المستوى
const levelInfo = getLevelInfo(profile.total_points_earned);
// { name, nameEn, min, max, color, nextLevel, nextPoints }

// حساب نقاط الحضور
const points = calculateAttendancePoints('derby', true);
// derby + early arrival = 1500 + 200 = 1700

// تحويل النقاط إلى ريال
const sar = pointsToSAR(1000); // 15 ريال

// تحويل ريال إلى نقاط
const points = sarToPoints(15); // 1000 غنيمة

// حساب نقاط الإنفاق عند الشريك
const points = calculatePartnerPoints(50); // 250 غنيمة (50/10 * 50)
```

### 4. عرض فئات الاستبدال

```typescript
// الوصول لفئات الاستبدال
POINTS_CONFIG.REDEMPTION_TIERS.forEach(tier => {
  console.log(`${tier.name}: ${tier.points} نقطة = ${tier.value} ريال`);
  // عرض النجوم: '⭐'.repeat(tier.stars)
});
```

### 5. التحقق من المستويات

```typescript
// الوصول لنظام المستويات
POINTS_CONFIG.LEVELS.forEach(level => {
  console.log(`${level.name} (${level.min} - ${level.max})`);
  // استخدام اللون: level.color
});
```

---

## Database Schema

### جدول user_achievements
```sql
CREATE TABLE user_achievements (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  season text DEFAULT '2025-2026',
  attendance_count int DEFAULT 0,
  consecutive_count int DEFAULT 0,
  last_bonus_milestone int DEFAULT 0,
  last_consecutive_match_id uuid,
  last_consecutive_date timestamptz,
  milestone_3_claimed boolean DEFAULT false,
  milestone_5_claimed boolean DEFAULT false,
  milestone_10_claimed boolean DEFAULT false,
  milestone_20_claimed boolean DEFAULT false,
  no_absence_months jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, season)
);
```

### جدول user_interactions
```sql
CREATE TABLE user_interactions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action_type text NOT NULL,
  match_id uuid REFERENCES matches(id),
  partner_id uuid REFERENCES partners(id),
  points_earned int DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  interaction_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
```

### أعمدة جديدة في user_profiles
```sql
ALTER TABLE user_profiles
ADD COLUMN birth_date date,
ADD COLUMN points_expiry_date timestamptz,
ADD COLUMN season_points bigint DEFAULT 0,
ADD COLUMN current_season text DEFAULT '2025-2026';
```

### أعمدة جديدة في matches
```sql
ALTER TABLE matches
ADD COLUMN match_type text DEFAULT 'regular'
  CHECK (match_type IN ('regular', 'derby', 'final', 'afc')),
ADD COLUMN attendance_points int DEFAULT 1000;
```

---

## Database Triggers

### 1. مكافأة الترحيب (500 غنيمة)
```sql
CREATE TRIGGER on_new_user_welcome_bonus
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_welcome_bonus();
```
- يُنفذ تلقائياً عند إنشاء مستخدم جديد
- يمنح 500 غنيمة للمستخدمين غير الإداريين
- ينشئ سجل إنجازات للموسم الحالي

### 2. مكافآت الإنجازات التلقائية
```sql
CREATE TRIGGER on_attendance_achievements
  AFTER INSERT ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION handle_attendance_achievements();
```
- يُنفذ تلقائياً بعد كل حضور
- يحسب المباريات المتتالية والموسمية
- يمنح المكافآت تلقائياً:
  - 3 متتالية → 500 غنيمة
  - 5 في الموسم → 1,000 غنيمة
  - 10 في الموسم → 2,000 غنيمة
  - 20 في الموسم → 3,000 غنيمة

---

## نصائح التطوير

### 1. اختبار النقاط محلياً
```typescript
// إضافة نقاط يدوياً للاختبار (في بيئة التطوير فقط)
await supabase
  .from('points_transactions')
  .insert({
    user_id: userId,
    points: 1000,
    transaction_type: 'test',
    description: 'نقاط اختبار'
  });

await supabase
  .from('user_profiles')
  .update({
    points: profile.points + 1000,
    total_points_earned: profile.total_points_earned + 1000
  })
  .eq('id', userId);
```

### 2. مراقبة المكافآت
```typescript
// الاستعلام عن إنجازات المستخدم
const { data: achievements } = await supabase
  .from('user_achievements')
  .select('*')
  .eq('user_id', userId)
  .eq('season', '2025-2026')
  .single();

console.log('عدد المباريات:', achievements.attendance_count);
console.log('المباريات المتتالية:', achievements.consecutive_count);
console.log('المكافآت المستلمة:', {
  milestone_3: achievements.milestone_3_claimed,
  milestone_5: achievements.milestone_5_claimed,
  milestone_10: achievements.milestone_10_claimed,
  milestone_20: achievements.milestone_20_claimed,
});
```

### 3. تتبع التفاعلات
```typescript
// الاستعلام عن تفاعلات المستخدم
const { data: interactions } = await supabase
  .from('user_interactions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// تجميع النقاط حسب نوع التفاعل
const pointsByType = interactions.reduce((acc, interaction) => {
  acc[interaction.action_type] = (acc[interaction.action_type] || 0) + interaction.points_earned;
  return acc;
}, {});
```

---

## الأسئلة الشائعة

### س: كيف يتم حساب المباريات المتتالية؟
ج: يتم تحديث `consecutive_count` في `user_achievements` بعد كل حضور. إذا انقطع الحضور، يُعاد العداد للصفر (يحتاج لتطوير إضافي لاكتشاف الانقطاع).

### س: ماذا يحدث إذا حاول المستخدم استبدال نفس المكافأة مرتين؟
ج: النظام يتحقق من `user_interactions` ويرفض التكرار بناءً على `user_id + action_type + match_id + date`.

### س: كيف يتم احتساب دعم الوزارة (5 ريال)؟
ج: يتم إضافة معاملة منفصلة نوعها `ministry_support` بقيمة 333 غنيمة (5 ÷ 0.015).

### س: هل نقاط الشركاء لها حد أقصى؟
ج: لا، نقاط الشركاء غير محدودة. كلما زادت الشركات، زادت فرص كسب النقاط.

### س: متى تنتهي صلاحية النقاط؟
ج: في نهاية موسم دوري روشن + 30 يوم. يتم إرسال تنبيهات قبل 30، 14، و3 أيام من الانتهاء (يحتاج لتطوير Cron Jobs).

---

## الخطوات التالية للتطوير

### 1. إضافة Cron Jobs
- مكافأة عيد الميلاد (يومي)
- مكافأة ذكرى التسجيل (يومي)
- تنبيهات انتهاء النقاط (يومي)
- مكافأة عدم الغياب لشهر كامل (شهري)

### 2. تطوير نظام الدعوات
- إنشاء رمز دعوة فريد لكل مستخدم
- تتبع الدعوات الناجحة
- منح 300 غنيمة عند حضور المدعو لأول مباراة

### 3. نظام التوقعات
- إضافة جدول predictions
- مقارنة التوقعات بالنتائج الفعلية
- منح 150 غنيمة للتوقعات الصحيحة

### 4. تكامل NFC
- ربط أجهزة NFC بنظام الحضور
- التحقق من صحة الأكواد
- منع التلاعب والتكرار

### 5. لوحة تحكم الإحصائيات
- إحصائيات الحضور الشهرية
- أكثر المستخدمين نشاطاً
- معدل الاستبدال
- ROI الشركاء

---

## الأمان

### 1. Row Level Security (RLS)
جميع الجداول الجديدة محمية بـ RLS:
- المستخدمون يرون فقط بياناتهم
- الإداريون لديهم وصول كامل
- Service role له صلاحيات كاملة

### 2. منع التلاعب
- التحقق من user_id في Edge Functions
- منع التفاعلات المكررة
- التحقق من صحة match_id و partner_id

### 3. التدقيق
جميع المعاملات مسجلة في `points_transactions` مع:
- user_id
- transaction_type
- points (موجب أو سالب)
- reference_id (match_id أو offer_id)
- description
- timestamp

---

## الدعم الفني

للأسئلة أو المشاكل، راجع:
1. **POINTS_SYSTEM.md**: التوثيق الكامل للنظام
2. **Database Schema**: راجع Migration files في `/supabase/migrations/`
3. **Edge Functions**: الكود في `/supabase/functions/`
4. **Frontend Utils**: راجع `/src/utils/pointsSystem.ts`
