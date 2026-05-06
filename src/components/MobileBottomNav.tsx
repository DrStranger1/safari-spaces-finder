import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, MessageCircle, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const items = [
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/favorites', icon: Heart, label: 'Saved' },
    { to: 'https://wa.me/255000000000', icon: MessageCircle, label: 'WhatsApp', external: true },
    { to: user ? '/dashboard' : '/login', icon: User, label: user ? 'Profile' : 'Sign In' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.1)]">
      <div className="grid grid-cols-4 h-16">
        {items.map(({ to, icon: Icon, label, external }) => {
          const active = !external && pathname === to;
          const cls = `flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
            active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`;
          if (external) {
            return (
              <a key={label} href={to} target="_blank" rel="noopener noreferrer" className={cls}>
                <Icon className="w-5 h-5" />
                {label}
              </a>
            );
          }
          return (
            <Link key={label} to={to} className={cls}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
