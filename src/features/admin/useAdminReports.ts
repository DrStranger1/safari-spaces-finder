import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Report = Database['public']['Tables']['reports']['Row'];

export interface ReportedProperty {
  propertyId: string;
  title: string;
  district: string;
  status: Database['public']['Enums']['property_status'];
  reportCount: number;
  reports: Report[];
}

const reportsKey = ['admin', 'reports'] as const;

/** Groups raw reports by property so admins triage at the listing level. */
export function useAdminReports() {
  return useQuery<ReportedProperty[]>({
    queryKey: reportsKey,
    queryFn: async () => {
      const { data: reports, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      if (!reports || reports.length === 0) return [];

      const propIds = [...new Set(reports.map(r => r.property_id))];
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, district, status, report_count')
        .in('id', propIds);
      const propMap = new Map(properties?.map(p => [p.id, p]) ?? []);

      const grouped = new Map<string, ReportedProperty>();
      for (const r of reports) {
        const meta = propMap.get(r.property_id);
        if (!meta) continue;
        const existing = grouped.get(r.property_id);
        if (existing) {
          existing.reports.push(r);
        } else {
          grouped.set(r.property_id, {
            propertyId: meta.id,
            title: meta.title,
            district: meta.district,
            status: meta.status,
            reportCount: meta.report_count,
            reports: [r],
          });
        }
      }
      return [...grouped.values()].sort((a, b) => b.reports.length - a.reports.length);
    },
  });
}

export function useDismissReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation<void, Error, string>({
    mutationFn: async (reportId) => {
      const { error } = await supabase.from('reports').delete().eq('id', reportId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: 'Report dismissed' });
      queryClient.invalidateQueries({ queryKey: reportsKey });
    },
  });
}

export function useDeactivateListing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation<void, Error, string>({
    mutationFn: async (propertyId) => {
      const { error } = await supabase
        .from('properties')
        .update({ status: 'inactive' })
        .eq('id', propertyId);
      if (error) throw new Error(error.message);
      await supabase.from('reports').delete().eq('property_id', propertyId);
    },
    onSuccess: () => {
      toast({ title: 'Listing deactivated', description: 'All open reports cleared.' });
      queryClient.invalidateQueries({ queryKey: reportsKey });
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
    },
  });
}
