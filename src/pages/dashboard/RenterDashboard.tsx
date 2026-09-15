import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Heart, Inbox, History, Sparkles,
} from 'lucide-react';
import RenterInquiriesList from '@/features/inquiries/sections/RenterInquiriesList';
import PropertyListGrid from '@/features/listings/PropertyListGrid';
import ReportDialog from '@/components/ReportDialog';
import InquiryDialog from '@/features/inquiries/InquiryDialog';
import { useSavedListings } from '@/features/favorites/useSavedListings';
import { useFavorites, useToggleFavorite } from '@/features/favorites/useFavorites';
import { useRecentlyViewed } from '@/features/views/useRecentlyViewed';
import { useRecommendations } from '@/features/listings/useRecommendations';

export default function RenterDashboard() {
  const navigate = useNavigate();

  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const favSet = favorites ?? new Set<string>();

  const { data: saved, isLoading: savedLoading } = useSavedListings();
  const { data: recent, isLoading: recentLoading } = useRecentlyViewed();
  const { data: recs, isLoading: recsLoading } = useRecommendations();

  const [reportId, setReportId] = useState<string | null>(null);
  const [inquiryPropertyId, setInquiryPropertyId] = useState<string | null>(null);

  const handleToggleFavorite = (propertyId: string) =>
    toggleFavorite.mutate({ propertyId, isFavorite: favSet.has(propertyId) });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl md:text-3xl font-bold">My dashboard</h1>

      <Tabs defaultValue="saved" className="w-full">
        <TabsList className="grid grid-cols-4 sm:inline-flex">
          <TabsTrigger value="saved" className="flex items-center gap-1.5">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Saved</span>
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-1.5">
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">Recently viewed</span>
          </TabsTrigger>
          <TabsTrigger value="inquiries" className="flex items-center gap-1.5">
            <Inbox className="w-4 h-4" />
            <span className="hidden sm:inline">My inquiries</span>
          </TabsTrigger>
          <TabsTrigger value="recommended" className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">For you</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-4">
          <PropertyListGrid
            items={saved}
            isLoading={savedLoading}
            favorites={favSet}
            onToggleFavorite={handleToggleFavorite}
            onContact={setInquiryPropertyId}
            onReport={setReportId}
            emptyState={
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No saved properties yet. Tap the heart on any listing.
                  </p>
                  <Button onClick={() => navigate('/search')}>Browse properties</Button>
                </CardContent>
              </Card>
            }
          />
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          <PropertyListGrid
            items={recent}
            isLoading={recentLoading}
            favorites={favSet}
            onToggleFavorite={handleToggleFavorite}
            onContact={setInquiryPropertyId}
            onReport={setReportId}
            emptyState={
              <Card>
                <CardContent className="py-12 text-center">
                  <History className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Listings you view will show up here.
                  </p>
                  <Button onClick={() => navigate('/search')}>Browse properties</Button>
                </CardContent>
              </Card>
            }
          />
        </TabsContent>

        <TabsContent value="inquiries" className="mt-4">
          <RenterInquiriesList />
        </TabsContent>

        <TabsContent value="recommended" className="mt-4">
          <PropertyListGrid
            items={recs}
            isLoading={recsLoading}
            favorites={favSet}
            onToggleFavorite={handleToggleFavorite}
            onContact={setInquiryPropertyId}
            onReport={setReportId}
            emptyState={
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Save a few listings and we'll suggest more like them.
                  </p>
                  <Button onClick={() => navigate('/search')}>Browse properties</Button>
                </CardContent>
              </Card>
            }
          />
        </TabsContent>
      </Tabs>

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
