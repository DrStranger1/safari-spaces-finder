import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function LandlordCTA() {
  const navigate = useNavigate();
  return (
    <section className="container mx-auto px-4 pb-16">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-[hsl(15_90%_48%)] rounded-3xl p-8 md:p-14 text-center space-y-5 shadow-glow-primary">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative">
          <ShieldCheck className="w-12 h-12 text-primary-foreground mx-auto opacity-90" />
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mt-4">
            Own a property? List it free.
          </h2>
          <p className="text-primary-foreground/90 max-w-md mx-auto mt-3">
            Reach thousands of verified renters in Dar es Salaam. No commissions, no broker fees.
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="mt-6"
            onClick={() => navigate('/signup?role=landlord')}
          >
            Start Listing <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
