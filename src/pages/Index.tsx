import { useState } from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ReportDialog from '@/components/ReportDialog';
import HeroSection from '@/features/home/sections/HeroSection';
import BrowseByType from '@/features/home/sections/BrowseByType';
import FeaturedListings from '@/features/home/sections/FeaturedListings';
import TrustSection from '@/features/home/sections/TrustSection';
import RecentListings from '@/features/home/sections/RecentListings';
import PopularAreas from '@/features/home/sections/PopularAreas';
import Testimonials from '@/features/home/sections/Testimonials';
import HowItWorks from '@/features/home/sections/HowItWorks';
import LandlordCTA from '@/features/home/sections/LandlordCTA';
import { useHomeFeed } from '@/features/home/useHomeFeed';
import { useFavorites, useToggleFavorite } from '@/features/favorites/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthPrompt } from '@/features/auth/useAuthPrompt';
import InquiryDialog from '@/features/inquiries/InquiryDialog';

export default function Index() {
  const { user } = useAuth();
  const { openAuthPrompt } = useAuthPrompt();
  const { data: feed, isLoading } = useHomeFeed();
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const [reportId, setReportId] = useState<string | null>(null);
  const [inquiryPropertyId, setInquiryPropertyId] = useState<string | null>(null);

  const favSet = favorites ?? new Set<string>();

  const handleToggleFavorite = (propertyId: string) => {
    if (!user) {
      openAuthPrompt('save');
      return;
    }
    toggleFavorite.mutate({ propertyId, isFavorite: favSet.has(propertyId) });
  };

  const handleContact = (propertyId: string) => {
    if (!user) {
      openAuthPrompt('inquire');
      return;
    }
    setInquiryPropertyId(propertyId);
  };

  const handleReport = (propertyId: string) => {
    if (!user) {
      openAuthPrompt('report');
      return;
    }
    setReportId(propertyId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <HeroSection
        feed={feed}
        favorites={favSet}
        onToggleFavorite={handleToggleFavorite}
        onContact={handleContact}
      />

      <BrowseByType />

      <FeaturedListings
        feed={feed}
        loading={isLoading}
        favorites={favSet}
        onToggleFavorite={handleToggleFavorite}
        onContact={handleContact}
        onReport={handleReport}
      />

      <TrustSection />

      <RecentListings
        feed={feed}
        favorites={favSet}
        onToggleFavorite={handleToggleFavorite}
        onContact={handleContact}
        onReport={handleReport}
      />

      <PopularAreas />
      <Testimonials />
      <HowItWorks />
      <LandlordCTA />
      <SiteFooter />

      <ReportDialog
        propertyId={reportId}
        open={!!reportId}
        onOpenChange={(o) => !o && setReportId(null)}
      />
      <InquiryDialog
        propertyId={inquiryPropertyId}
        open={!!inquiryPropertyId}
        onOpenChange={(o) => !o && setInquiryPropertyId(null)}
      />
    </div>
  );
}
