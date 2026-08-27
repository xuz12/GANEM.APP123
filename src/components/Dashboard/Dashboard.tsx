import { useState } from 'react';
import { Home, Trophy, Gift, User } from 'lucide-react';
import { HomePage } from './HomePage';
import { AttendancePage } from './AttendancePage';
import { RewardsPage } from './RewardsPage';
import { ProfilePage } from './ProfilePage';

type Tab = 'home' | 'attendance' | 'rewards' | 'profile';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'attendance':
        return <AttendancePage />;
      case 'rewards':
        return <RewardsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  const navItems = [
    { id: 'home' as Tab, icon: Home, label: 'الرئيسية' },
    { id: 'attendance' as Tab, icon: Trophy, label: 'الحضور' },
    { id: 'rewards' as Tab, icon: Gift, label: 'المكافآت' },
    { id: 'profile' as Tab, icon: User, label: 'حسابي' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {renderContent()}

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center justify-center py-3 transition-colors ${
                      isActive
                        ? 'text-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 mb-1 ${
                        isActive ? 'text-green-600' : 'text-gray-500'
                      }`}
                    />
                    <span className="text-xs font-medium">{item.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 w-16 h-1 bg-green-600 rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
