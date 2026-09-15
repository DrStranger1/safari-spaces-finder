import { Quote, Star } from 'lucide-react';
import { HOME_TESTIMONIALS } from '@/lib/constants';

export default function Testimonials() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider">💬 Testimonials</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold mt-1">Wateja wetu wanasema</h2>
        <p className="text-muted-foreground mt-2">Real stories from renters in Dar</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {HOME_TESTIMONIALS.map(t => (
          <div key={t.name} className="p-6 rounded-2xl border bg-card hover:shadow-soft transition space-y-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <Quote className="w-6 h-6 text-primary/30" />
            <p className="text-foreground leading-relaxed">"{t.quote}"</p>
            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm">
                {t.initials}
              </div>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.area}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
