import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Search, Heart, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Home className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">Pango</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/search" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-sm font-medium">
            <Search className="w-4 h-4" /> Browse
          </Link>
          {user && (
            <>
              <Link to="/favorites" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-sm font-medium">
                <Heart className="w-4 h-4" /> Saved
              </Link>
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-sm font-medium">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign In</Button>
              <Button size="sm" onClick={() => navigate('/signup')}>Get Started</Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4 space-y-3 animate-fade-in">
          <Link to="/search" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>Browse Properties</Link>
          {user && (
            <>
              <Link to="/favorites" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>Saved</Link>
              <Link to="/dashboard" className="block py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>Dashboard</Link>
            </>
          )}
          {user ? (
            <Button variant="ghost" className="w-full justify-start" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => { navigate('/login'); setMobileOpen(false); }}>Sign In</Button>
              <Button className="flex-1" onClick={() => { navigate('/signup'); setMobileOpen(false); }}>Get Started</Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
