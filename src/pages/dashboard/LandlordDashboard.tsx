import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { Plus, Building2, Inbox, ShieldCheck, BarChart3 } from 'lucide-react';
import LandlordListingsTab from '@/features/landlord/sections/LandlordListingsTab';
import LandlordInquiriesList from '@/features/inquiries/sections/LandlordInquiriesList';
import VerificationTab from '@/features/verification/VerificationTab';
import PerformanceTab from '@/features/landlord/sections/PerformanceTab';

export default function LandlordDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl md:text-3xl font-bold">Landlord dashboard</h1>
        <Button onClick={() => navigate('/dashboard/new-listing')}>
          <Plus className="w-4 h-4 mr-2" /> Add listing
        </Button>
      </div>

      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid grid-cols-4 sm:inline-flex">
          <TabsTrigger value="listings" className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Listings</span>
          </TabsTrigger>
          <TabsTrigger value="inquiries" className="flex items-center gap-1.5">
            <Inbox className="w-4 h-4" />
            <span className="hidden sm:inline">Inquiries</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Verification</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-4">
          <LandlordListingsTab />
        </TabsContent>
        <TabsContent value="inquiries" className="mt-4">
          <LandlordInquiriesList />
        </TabsContent>
        <TabsContent value="performance" className="mt-4">
          <PerformanceTab />
        </TabsContent>
        <TabsContent value="verification" className="mt-4">
          <VerificationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
