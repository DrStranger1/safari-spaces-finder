import { ArrowRight, Search, Home, MessageCircle } from 'lucide-react';

const steps = [
  { step: '01', icon: Search, title: 'Search', desc: 'Browse properties by area, price, or type in Dar es Salaam.' },
  { step: '02', icon: Home, title: 'Explore', desc: 'View photos, amenities, maps, and nearby services.' },
  { step: '03', icon: MessageCircle, title: 'Connect', desc: 'WhatsApp the verified landlord directly and move in.' },
];

export default function HowItWorks() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <p className="text-sm font-semibold text-primary uppercase tracking-wider">⚡ How Pango works</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold mt-1">From search to keys, in 3 steps</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6 relative">
        {steps.map(({ step, icon: Icon, title, desc }, i) => (
          <div key={step} className="relative group">
            <div className="p-8 rounded-2xl border bg-card hover:shadow-soft hover:-translate-y-1 transition-all h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="text-5xl font-display font-bold text-primary/15">{step}</span>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition">
                  <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                </div>
              </div>
              <h3 className="font-display text-xl font-semibold">{title}</h3>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{desc}</p>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 text-primary/40 z-10" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
