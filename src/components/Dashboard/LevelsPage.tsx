import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, Star, Award, Target, Crown, Zap, Lock, Check } from 'lucide-react';

interface Level {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  icon: any;
  color: string;
  benefits: string[];
  multiplier: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  requirement: number;
  current: number;
  completed: boolean;
}

const levels: Level[] = [
  {
    level: 1,
    name: 'المشجع الجديد',
    minPoints: 0,
    maxPoints: 2999,
    icon: Star,
    color: 'from-gray-400 to-gray-500',
    benefits: ['خصم 20% على أول استبدال', 'الوصول للعروض الأساسية'],
    multiplier: 1.0,
  },
  {
    level: 2,
    name: 'المشجع النشط',
    minPoints: 3000,
    maxPoints: 7999,
    icon: Target,
    color: 'from-blue-400 to-blue-500',
    benefits: ['مضاعف نقاط ×1.2', 'عروض إضافية شهرياً', 'شارة رقمية خاصة'],
    multiplier: 1.2,
  },
  {
    level: 3,
    name: 'المشجع المخلص',
    minPoints: 8000,
    maxPoints: 14999,
    icon: Award,
    color: 'from-green-400 to-green-500',
    benefits: ['مضاعف نقاط ×1.5', 'أولوية في الحجوزات', 'خصم 15% دائم'],
    multiplier: 1.5,
  },
  {
    level: 4,
    name: 'السوبر فان',
    minPoints: 15000,
    maxPoints: 29999,
    icon: Trophy,
    color: 'from-red-400 to-red-500',
    benefits: ['مضاعف نقاط ×2', 'لقاء مع اللاعبين', 'تذكرتين VIP مجانية', 'خصم 25% دائم'],
    multiplier: 2.0,
  },
  {
    level: 5,
    name: 'الأسطورة',
    minPoints: 30000,
    maxPoints: Infinity,
    icon: Crown,
    color: 'from-yellow-400 to-orange-500',
    benefits: ['مضاعف نقاط ×2.5', 'وصول لكل الفعاليات', 'اسم في قاعة المشاهير', 'خصم 35% دائم'],
    multiplier: 2.5,
  },
];

export function LevelsPage() {
  const { profile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (profile) {
      generateAchievements();
    }
  }, [profile]);

  const generateAchievements = () => {
    const achs: Achievement[] = [
      {
        id: 'first_match',
        title: 'المباراة الأولى',
        description: 'حضور أول مباراة',
        icon: Trophy,
        color: 'text-blue-600 bg-blue-100',
        requirement: 1,
        current: profile?.matches_attended || 0,
        completed: (profile?.matches_attended || 0) >= 1,
      },
      {
        id: 'ten_matches',
        title: 'المشجع المخلص',
        description: 'حضور 10 مباريات',
        icon: Award,
        color: 'text-green-600 bg-green-100',
        requirement: 10,
        current: profile?.matches_attended || 0,
        completed: (profile?.matches_attended || 0) >= 10,
      },
      {
        id: 'fifty_matches',
        title: 'المشجع الذهبي',
        description: 'حضور 50 مباراة',
        icon: Star,
        color: 'text-yellow-600 bg-yellow-100',
        requirement: 50,
        current: profile?.matches_attended || 0,
        completed: (profile?.matches_attended || 0) >= 50,
      },
      {
        id: 'consecutive_5',
        title: 'الالتزام المثالي',
        description: 'حضور 5 مباريات متتالية',
        icon: Zap,
        color: 'text-orange-600 bg-orange-100',
        requirement: 5,
        current: profile?.consecutive_matches || 0,
        completed: (profile?.consecutive_matches || 0) >= 5,
      },
      {
        id: 'points_5000',
        title: 'جامع النقاط',
        description: 'كسب 5000 نقطة',
        icon: Target,
        color: 'text-teal-600 bg-teal-100',
        requirement: 5000,
        current: profile?.total_points_earned || 0,
        completed: (profile?.total_points_earned || 0) >= 5000,
      },
      {
        id: 'points_20000',
        title: 'ملك النقاط',
        description: 'كسب 20000 نقطة',
        icon: Crown,
        color: 'text-red-600 bg-red-100',
        requirement: 20000,
        current: profile?.total_points_earned || 0,
        completed: (profile?.total_points_earned || 0) >= 20000,
      },
    ];

    setAchievements(achs);
  };

  const getCurrentLevel = () => {
    const points = profile?.total_points_earned || 0;
    return levels.find(l => points >= l.minPoints && points <= l.maxPoints) || levels[0];
  };

  const getNextLevel = () => {
    const currentLevel = getCurrentLevel();
    return levels.find(l => l.level === currentLevel.level + 1);
  };

  const getProgressToNextLevel = () => {
    const currentLevel = getCurrentLevel();
    const nextLevel = getNextLevel();

    if (!nextLevel) return 100;

    const points = profile?.total_points_earned || 0;
    const progress = ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const progress = getProgressToNextLevel();
  const CurrentIcon = currentLevel.icon;

  return (
    <div className="pb-20 p-4" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">المستويات والإنجازات</h2>

      <div className={`bg-gradient-to-br ${currentLevel.color} rounded-2xl p-6 text-white shadow-xl mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/80 text-sm mb-1">مستواك الحالي</p>
            <h3 className="text-3xl font-bold">{currentLevel.name}</h3>
            <p className="text-white/80 text-sm mt-1">المستوى {currentLevel.level} من 5</p>
          </div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <CurrentIcon className="w-8 h-8" />
          </div>
        </div>

        {nextLevel && (
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/90">التقدم للمستوى التالي</span>
              <span className="text-sm font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-3 mb-2">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-white/80">
              <span>{(profile?.total_points_earned || 0).toLocaleString('ar-SA')} نقطة</span>
              <span>{nextLevel.minPoints.toLocaleString('ar-SA')} نقطة</span>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-sm text-white/80 mb-2">مزايا مستواك:</p>
          <ul className="space-y-1">
            {currentLevel.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center text-sm">
                <Check className="w-4 h-4 ml-2" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h3 className="font-bold text-gray-900 mb-4">جميع المستويات</h3>
      <div className="space-y-3 mb-6">
        {levels.map((level) => {
          const LevelIcon = level.icon;
          const isCurrentLevel = level.level === currentLevel.level;
          const isUnlocked = (profile?.total_points_earned || 0) >= level.minPoints;

          return (
            <div
              key={level.level}
              className={`bg-white rounded-xl p-4 border-2 transition-all ${
                isCurrentLevel
                  ? 'border-green-500 shadow-md'
                  : isUnlocked
                  ? 'border-gray-200'
                  : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 bg-gradient-to-br ${level.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
                  {isUnlocked ? <LevelIcon className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-gray-900">{level.name}</h4>
                    {isCurrentLevel && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        مستواك
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {level.minPoints.toLocaleString('ar-SA')} - {level.maxPoints === Infinity ? '∞' : level.maxPoints.toLocaleString('ar-SA')} نقطة
                  </p>
                  <p className="text-xs text-gray-500 mb-2">مضاعف النقاط: ×{level.multiplier}</p>
                  <ul className="space-y-1">
                    {level.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start text-xs text-gray-600">
                        <span className="text-green-600 ml-1">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="font-bold text-gray-900 mb-4">الإنجازات</h3>
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement) => {
          const AchIcon = achievement.icon;
          const progressPercent = Math.min((achievement.current / achievement.requirement) * 100, 100);

          return (
            <div
              key={achievement.id}
              className={`bg-white rounded-xl p-4 border-2 transition-all ${
                achievement.completed ? 'border-green-200 shadow-sm' : 'border-gray-100'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl ${achievement.color} flex items-center justify-center mx-auto mb-3 relative`}>
                <AchIcon className={`w-6 h-6 ${achievement.color.split(' ')[0]}`} />
                {achievement.completed && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              <h4 className="font-bold text-gray-900 text-sm text-center mb-1">{achievement.title}</h4>
              <p className="text-xs text-gray-600 text-center mb-3">{achievement.description}</p>

              <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                <div
                  className={`${achievement.completed ? 'bg-green-500' : 'bg-blue-500'} rounded-full h-2 transition-all duration-500`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-xs text-center text-gray-500">
                {achievement.current} / {achievement.requirement}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
