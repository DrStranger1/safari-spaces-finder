import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

type InquiryRow = Database['public']['Tables']['inquiries']['Row'];
type InquiryStatus = Database['public']['Enums']['inquiry_status'];
type PropertyRow = Database['public']['Tables']['properties']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type RenterInquiry = InquiryRow & {
  property: Pick<PropertyRow, 'id' | 'title' | 'district' | 'price'> | null;
  landlord: Pick<ProfileRow, 'full_name' | 'phone'> | null;
};

export type LandlordInquiry = InquiryRow & {
  property: Pick<PropertyRow, 'id' | 'title' | 'district'> | null;
  renter: Pick<ProfileRow, 'full_name' | 'phone'> | null;
};

/** Inquiries the signed-in renter has sent. */
export function useRenterInquiries() {
  const { user } = useAuth();

  return useQuery<RenterInquiry[]>({
    queryKey: ['inquiries', 'renter', user?.id ?? 'anon'],
    enabled: !!user,
    queryFn: async () => {
      const { data: inquiries, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('renter_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      if (!inquiries || inquiries.length === 0) return [];

      const propertyIds = [...new Set(inquiries.map(i => i.property_id))];
      const landlordIds = [...new Set(inquiries.map(i => i.landlord_id))];

      const [{ data: properties }, { data: landlords }] = await Promise.all([
        supabase.from('properties').select('id, title, district, price').in('id', propertyIds),
        supabase.from('profiles').select('user_id, full_name, phone').in('user_id', landlordIds),
      ]);

      const propMap = new Map(properties?.map(p => [p.id, p]) ?? []);
      const landlordMap = new Map(
        landlords?.map(l => [l.user_id, { full_name: l.full_name, phone: l.phone }]) ?? [],
      );

      return inquiries.map(i => ({
        ...i,
        property: propMap.get(i.property_id) ?? null,
        landlord: landlordMap.get(i.landlord_id) ?? null,
      }));
    },
  });
}

/** Inquiries on properties owned by the signed-in landlord. */
export function useLandlordInquiries() {
  const { user } = useAuth();

  return useQuery<LandlordInquiry[]>({
    queryKey: ['inquiries', 'landlord', user?.id ?? 'anon'],
    enabled: !!user,
    queryFn: async () => {
      const { data: inquiries, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('landlord_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      if (!inquiries || inquiries.length === 0) return [];

      const propertyIds = [...new Set(inquiries.map(i => i.property_id))];
      const renterIds = [...new Set(inquiries.map(i => i.renter_id))];

      const [{ data: properties }, { data: renters }] = await Promise.all([
        supabase.from('properties').select('id, title, district').in('id', propertyIds),
        supabase.from('profiles').select('user_id, full_name, phone').in('user_id', renterIds),
      ]);

      const propMap = new Map(properties?.map(p => [p.id, p]) ?? []);
      const renterMap = new Map(
        renters?.map(r => [r.user_id, { full_name: r.full_name, phone: r.phone }]) ?? [],
      );

      return inquiries.map(i => ({
        ...i,
        property: propMap.get(i.property_id) ?? null,
        renter: renterMap.get(i.renter_id) ?? null,
      }));
    },
  });
}

/** Landlord updates inquiry status (new → replied → closed). */
export function useUpdateInquiryStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, { inquiryId: string; status: InquiryStatus }>({
    mutationFn: async ({ inquiryId, status }) => {
      const { error } = await supabase
        .from('inquiries')
        .update({ status })
        .eq('id', inquiryId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['inquiries', 'landlord', user.id] });
      }
    },
  });
}
