import { createContext, ReactNode, useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Flag, Building2, ShieldCheck, LogIn } from 'lucide-react';

export type AuthIntent =
  | 'save'        // favorite a listing
  | 'inquire'     // submit an inquiry
  | 'contact'     // message a landlord
  | 'report'      // report a listing
  | 'list'        // post a property
  | 'generic';

interface AuthPromptOptions {
  /** Where to send the user after they finish auth. Defaults to current pathname+search. */
  redirectTo?: string;
}

interface AuthPromptContextValue {
  openAuthPrompt: (intent: AuthIntent, options?: AuthPromptOptions) => void;
}

export const AuthPromptContext = createContext<AuthPromptContextValue | undefined>(undefined);

const INTENT_COPY: Record<AuthIntent, { title: string; description: string; icon: typeof Heart }> = {
  save: {
    title: 'Sign in to save listings',
    description: 'Keep track of properties you love. Create a free account or sign in to add this to your favorites.',
    icon: Heart,
  },
  inquire: {
    title: 'Sign in to send an inquiry',
    description: 'We need to know who is reaching out so landlords can reply with confidence. Sign in or create a free account to continue.',
    icon: MessageCircle,
  },
  contact: {
    title: 'Sign in to message this landlord',
    description: 'Pango protects renters and landlords by keeping conversations tied to verified accounts. Sign in or create a free account to continue.',
    icon: MessageCircle,
  },
  report: {
    title: 'Sign in to report this listing',
    description: 'Reports help keep Pango safe. Sign in or create a free account so we can follow up on your report.',
    icon: Flag,
  },
  list: {
    title: 'Sign in to list your property',
    description: 'Create a free landlord account in less than a minute. List your property, reach verified renters, no broker fees.',
    icon: Building2,
  },
  generic: {
    title: 'Sign in to continue',
    description: 'This action requires a Pango account. Sign in or create one — it only takes a moment.',
    icon: ShieldCheck,
  },
};

export default function AuthPromptProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [intent, setIntent] = useState<AuthIntent | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  const openAuthPrompt = useCallback<AuthPromptContextValue['openAuthPrompt']>(
    (nextIntent, options) => {
      const fallback = `${location.pathname}${location.search}`;
      setRedirectTo(options?.redirectTo ?? fallback);
      setIntent(nextIntent);
    },
    [location.pathname, location.search],
  );

  const close = () => setIntent(null);

  const go = (to: '/login' | '/signup') => {
    const target = redirectTo ?? '/';
    const role = intent === 'list' ? '&role=landlord' : '';
    const search = `?redirect=${encodeURIComponent(target)}${to === '/signup' ? role : ''}`;
    setIntent(null);
    navigate(`${to}${search}`, { state: { from: { pathname: target } } });
  };

  const copy = intent ? INTENT_COPY[intent] : null;
  const Icon = copy?.icon ?? LogIn;

  return (
    <AuthPromptContext.Provider value={{ openAuthPrompt }}>
      {children}
      <Dialog open={!!intent} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-center font-display text-xl">
              {copy?.title}
            </DialogTitle>
            <DialogDescription className="text-center">
              {copy?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2 pt-2">
            <Button className="w-full" onClick={() => go('/login')}>
              Sign in
            </Button>
            <Button variant="outline" className="w-full" onClick={() => go('/signup')}>
              Create a free account
            </Button>
            <button
              type="button"
              onClick={close}
              className="text-xs text-muted-foreground hover:text-foreground mt-1"
            >
              Not now
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthPromptContext.Provider>
  );
}
