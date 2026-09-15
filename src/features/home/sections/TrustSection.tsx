import { ShieldCheck, MessageCircle, BadgeCheck } from 'lucide-react';

const items = [
  { icon: ShieldCheck, title: 'Verified by Pango', desc: 'Landlords confirm phone & ID before listing. Look for the green badge.' },
  { icon: MessageCircle, title: 'Talk directly', desc: 'WhatsApp the landlord — no agents, no commissions, no waiting.' },
  { icon: BadgeCheck, title: 'Reported & reviewed', desc: 'Suspicious listings flagged by users are reviewed within 24 hours.' },
];

export default function TrustSection() {
  return (
    <section className="relative bg-[hsl(220_25%_10%)] text-[hsl(40_20%_94%)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
      <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="container mx-auto px-4 py-20 relative">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Trust & safety</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Why renters trust Pango</h2>
          <p className="text-[hsl(40_20%_94%/0.7)] mt-3 text-lg">
            Every listing on Pango is built on a foundation of verification, transparency, and direct communication. No middlemen, no surprises.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:bg-white/10 transition">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold">{title}</h3>
              <p className="text-[hsl(40_20%_94%/0.7)] text-sm mt-2 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
