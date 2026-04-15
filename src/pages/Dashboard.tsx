import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Users, Shield, Loader2, Trash2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Property = Database['public']['Tables']['properties']['Row'];

export default function Dashboard() {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin state
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [unverifiedLandlords, setUnverifiedLandlords] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !user) navigate('/login');
  }, [user, isLoading]);

  useEffect(() => {
    if (!user || !role) return;
    const fetch = async () => {
      if (role === 'landlord') {
        const { data } = await supabase.from('properties').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
        setProperties(data || []);
      }
      if (role === 'admin') {
        const [{ data: pending }, { data: landlords }] = await Promise.all([
          supabase.from('properties').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
          supabase.from('profiles').select('*').eq('is_verified', false),
        ]);
        setPendingProperties(pending || []);
        // Filter landlords from unverified profiles
        if (landlords) {
          const roleChecks = await Promise.all(
            landlords.map(async (p) => {
              const { data } = await supabase.from('user_roles').select('role').eq('user_id', p.user_id).eq('role', 'landlord').maybeSingle();
              return data ? p : null;
            })
          );
          setUnverifiedLandlords(roleChecks.filter(Boolean));
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user, role]);

  const approveProperty = async (id: string) => {
    await supabase.from('properties').update({ status: 'active' }).eq('id', id);
    setPendingProperties(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Property approved' });
  };

  const verifyLandlord = async (userId: string) => {
    await supabase.from('profiles').update({ is_verified: true }).eq('user_id', userId);
    setUnverifiedLandlords(prev => prev.filter(l => l.user_id !== userId));
    toast({ title: 'Landlord verified' });
  };

  const deleteProperty = async (id: string) => {
    await supabase.from('properties').delete().eq('id', id);
    setProperties(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Property deleted' });
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            {role === 'admin' ? 'Admin Dashboard' : role === 'landlord' ? 'My Listings' : 'My Dashboard'}
          </h1>
          {role === 'landlord' && (
            <Button onClick={() => navigate('/dashboard/new-listing')}>
              <Plus className="w-4 h-4 mr-2" /> Add Listing
            </Button>
          )}
        </div>

        {/* LANDLORD VIEW */}
        {role === 'landlord' && (
          <div className="space-y-4">
            {properties.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">You haven't listed any properties yet.</p>
                  <Button onClick={() => navigate('/dashboard/new-listing')}><Plus className="w-4 h-4 mr-2" /> Create Your First Listing</Button>
                </CardContent>
              </Card>
            ) : (
              properties.map(p => (
                <Card key={p.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <Link to={`/property/${p.id}`} className="font-semibold hover:text-primary">{p.title}</Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={p.status === 'active' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'}>{p.status}</Badge>
                        <span className="text-sm text-muted-foreground">{p.district}</span>
                        <span className="text-sm font-medium text-primary">TZS {new Intl.NumberFormat('en-TZ').format(p.price)}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteProperty(p.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* RENTER VIEW */}
        {role === 'renter' && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Browse properties and save your favorites!</p>
              <Button onClick={() => navigate('/search')}>Browse Properties</Button>
            </CardContent>
          </Card>
        )}

        {/* ADMIN VIEW */}
        {role === 'admin' && (
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Pending Landlord Verification ({unverifiedLandlords.length})
              </h2>
              {unverifiedLandlords.length === 0 ? (
                <p className="text-muted-foreground text-sm">No landlords waiting for verification.</p>
              ) : (
                <div className="space-y-3">
                  {unverifiedLandlords.map((l: any) => (
                    <Card key={l.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{l.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{l.phone || 'No phone'}</p>
                        </div>
                        <Button size="sm" onClick={() => verifyLandlord(l.user_id)}>Verify</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Pending Properties ({pendingProperties.length})
              </h2>
              {pendingProperties.length === 0 ? (
                <p className="text-muted-foreground text-sm">No properties awaiting approval.</p>
              ) : (
                <div className="space-y-3">
                  {pendingProperties.map(p => (
                    <Card key={p.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{p.title}</p>
                          <p className="text-sm text-muted-foreground">{p.district} — TZS {new Intl.NumberFormat('en-TZ').format(p.price)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approveProperty(p.id)}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={async () => {
                            await supabase.from('properties').update({ status: 'rejected' }).eq('id', p.id);
                            setPendingProperties(prev => prev.filter(x => x.id !== p.id));
                          }}>Reject</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
