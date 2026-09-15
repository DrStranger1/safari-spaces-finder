import { Home } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Home className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold">Pango</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 Pango. Making renting simple in Dar es Salaam.
        </p>
      </div>
    </footer>
  );
}
