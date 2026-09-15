import Navbar from '@/components/Navbar';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LandlordDashboard from '@/pages/dashboard/LandlordDashboard';
import RenterDashboard from '@/pages/dashboard/RenterDashboard';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';

export default function Dashboard() {
  const { role, isLoading } = useAuth();

  if (isLoading || !role) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {role === 'landlord' && <LandlordDashboard />}
        {role === 'renter' && <RenterDashboard />}
        {role === 'admin' && <AdminDashboard />}
      </div>
    </div>
  );
}
