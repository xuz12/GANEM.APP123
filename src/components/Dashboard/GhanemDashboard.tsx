import { useState } from 'react';
import { GhanemHomePage } from './GhanemHomePage';
import { GhanemMatchesPage } from './GhanemMatchesPage';
import { GhanemOffersPage } from './GhanemOffersPage';
import { GhanemAccountPage } from './GhanemAccountPage';
import { Home, Trophy, Gift, User } from 'lucide-react';

export function GhanemDashboard() {
  const [activeTab, setActiveTab] = useState<'home' | 'matches' | 'offers' | 'account'>('home');

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <GhanemHomePage />;
      case 'matches':
        return <GhanemMatchesPage />;
      case 'offers':
        return <GhanemOffersPage />;
      case 'account':
        return <GhanemAccountPage />;
      default:
        return <GhanemHomePage />;
    }
  };

  const tabs = [
    { id: 'home' as const, label: 'الرئيسية', icon: Home },
    { id: 'matches' as const, label: 'المباريات', icon: Trophy },
    { id: 'offers' as const, label: 'العروض', icon: Gift },
    { id: 'account' as const, label: 'حسابي', icon: User },
  ];

  return (
    /* ✅ تحديث الخلفية للون الداكن المعتمد في الهوية #003837 */
    <div className="max-w-md mx-auto bg-[#003837] min-h-screen relative" dir="rtl">
      <div className="pb-20">
        {renderPage()}
      </div>

      {/* ✅ تحديث شريط التنقل السفلي بألوان الهوية الجديدة */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#002625]/95 backdrop-blur-md border-t border-white/5 shadow-2xl max-w-md mx-auto z-50">
        <div className="grid grid-cols-4 h-20">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center transition-all duration-300 relative ${
                  isActive
                    ? 'text-[#05E59F]' // اللون الأخضر المتوهج الجديد
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {/* إشارة علوية للتبويب النشط */}
                {isActive && (
                  <div className="absolute top-0 w-8 h-1 bg-[#05E59F] rounded-b-full shadow-[0_2px_10px_rgba(5,229,159,0.5)]" />
                )}
                
                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-[2.5] scale-110' : 'stroke-[2]'}`} />
                <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}