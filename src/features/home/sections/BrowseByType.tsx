import { useNavigate } from 'react-router-dom';
import { PROPERTY_TYPES } from '@/lib/constants';

export default function BrowseByType() {
  const navigate = useNavigate();

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-bold">What are you looking for?</h2>
        <p className="text-muted-foreground mt-2">Pick a category to start searching</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {PROPERTY_TYPES.map(({ icon: Icon, label, sub, type, highlight }) => (
          <button
            key={type}
            onClick={() => navigate(`/search?type=${type}`)}
            className={`group relative flex flex-col items-start gap-3 p-5 rounded-2xl border bg-card hover:border-primary hover:-translate-y-1 hover:shadow-soft transition-all text-left ${
              highlight ? 'ring-1 ring-primary/30 bg-gradient-to-br from-primary/5 to-transparent' : ''
            }`}
          >
            {highlight && (
              <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                POPULAR
              </span>
            )}
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
