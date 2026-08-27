import { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { AdminSignIn } from './AdminSignIn';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { UsersManagement } from './UsersManagement';
import { AdminsManagement } from './AdminsManagement';
import { ClubsManagement } from './ClubsManagement';
import { MatchesManagement } from './MatchesManagement';
import { PartnersManagement } from './PartnersManagement';
import { OffersManagement } from './OffersManagement';
import { AttendanceVerification } from './AttendanceVerification';
import { SettingsPage } from './SettingsPage';

export function AdminApp() {
  const { adminProfile, loading } = useAdmin();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!adminProfile) {
    return <AdminSignIn />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UsersManagement />;
      case 'admins':
        return <AdminsManagement />;
      case 'clubs':
        return <ClubsManagement />;
      case 'matches':
        return <MatchesManagement />;
      case 'partners':
        return <PartnersManagement />;
      case 'offers':
        return <OffersManagement />;
      case 'attendance':
        return <AttendanceVerification />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </AdminLayout>
  );
}
