import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { HOME_DISTRICTS } from '@/lib/constants';

export default function PopularAreas() {
  const navigate = useNavigate();
  return (
    <section className="bg-muted/40 py-16 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">📍 Browse by area</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-1">Popular neighborhoods</h2>
          <p className="text-muted-foreground mt-2">Explore Dar es Salaam by district</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {HOME_DISTRICTS.map((d) => (
            <button
              key={d.name}
              onClick={() => navigate(`/search?district=${d.name}`)}
              className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary hover:shadow-soft hover:-translate-y-0.5 transition-all text-left"
            >
              <div>
                <p className="font-semibold text-foreground group-hover:text-primary transition">{d.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">avg TZS {d.avg}/mo</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
