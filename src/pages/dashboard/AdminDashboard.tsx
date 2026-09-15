import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { Building2, ShieldCheck, Flag } from 'lucide-react';
import PendingPropertiesTab from '@/features/admin/sections/PendingPropertiesTab';
import VerificationQueueTab from '@/features/admin/sections/VerificationQueueTab';
import ReportsQueueTab from '@/features/admin/sections/ReportsQueueTab';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl md:text-3xl font-bold">Admin dashboard</h1>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="pending" className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Pending properties</span>
            <span className="sm:hidden">Pending</span>
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Verification</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1.5">
            <Flag className="w-4 h-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <PendingPropertiesTab />
        </TabsContent>
        <TabsContent value="verification" className="mt-4">
          <VerificationQueueTab />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <ReportsQueueTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
