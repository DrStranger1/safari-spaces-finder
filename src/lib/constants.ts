import {
  DoorOpen, Building2, Home, Briefcase,
  BadgeCheck, MessageCircle, Wallet, Zap,
  type LucideIcon,
} from 'lucide-react';

export const MAX_PRICE = 3_000_000;

export const DAR_DISTRICTS = [
  'Kinondoni',
  'Ilala',
  'Temeke',
  'Ubungo',
  'Kigamboni',
  'Mbezi',
  'Sinza',
  'Kijitonyama',
] as const;

export type District = (typeof DAR_DISTRICTS)[number];

export const HOME_DISTRICTS: { name: District | string; avg: string }[] = [
  { name: 'Kinondoni', avg: '350k' },
  { name: 'Sinza', avg: '250k' },
  { name: 'Mbezi', avg: '300k' },
  { name: 'Ilala', avg: '400k' },
  { name: 'Temeke', avg: '180k' },
  { name: 'Ubungo', avg: '220k' },
  { name: 'Kigamboni', avg: '280k' },
  { name: 'Mikocheni', avg: '500k' },
];

export const BUDGET_PRESETS = [
  { label: 'Under 100k', value: '100000' },
  { label: 'Under 250k', value: '250000' },
  { label: 'Under 500k', value: '500000' },
  { label: 'Under 1M', value: '1000000' },
  { label: 'Any budget', value: 'any' },
];

export const PRICE_PRESETS = [
  { label: 'Under 100k', max: 100_000 },
  { label: 'Under 250k', max: 250_000 },
  { label: 'Under 500k', max: 500_000 },
  { label: 'Under 1M', max: 1_000_000 },
];

export const QUICK_AMENITIES = [
  'Self-contained',
  'Near main road',
  'Parking',
  'Water tank',
  'Security',
];

export type PropertyTypeOption = {
  icon: LucideIcon;
  label: string;
  sub: string;
  type: 'room' | 'apartment' | 'house' | 'office';
  highlight?: boolean;
};

export const PROPERTY_TYPES: PropertyTypeOption[] = [
  { icon: DoorOpen, label: 'Rooms', sub: 'Single & shared', type: 'room', highlight: true },
  { icon: Building2, label: 'Apartments', sub: '1–3 bedroom', type: 'apartment' },
  { icon: Home, label: 'Houses', sub: 'Family homes', type: 'house' },
  { icon: Briefcase, label: 'Offices', sub: 'For business', type: 'office' },
];

export type TrustPoint = { icon: LucideIcon; title: string; desc: string };

export const TRUST_POINTS: TrustPoint[] = [
  { icon: BadgeCheck, title: 'Verified landlords', desc: 'ID & phone confirmed by Pango.' },
  { icon: MessageCircle, title: 'Direct WhatsApp', desc: 'Talk to landlords instantly.' },
  { icon: Wallet, title: 'No broker fees', desc: 'Zero hidden charges. Ever.' },
  { icon: Zap, title: 'Find a place fast', desc: 'Most renters connect within 48 hrs.' },
];

export const HOME_TESTIMONIALS = [
  { quote: 'Nilipata chumba ndani ya siku 2 — bila broker, bila stress!', name: 'Mwajuma H.', area: 'Kinondoni', initials: 'MH', rating: 5 },
  { quote: 'WhatsApp contact made it so easy to reach the landlord directly.', name: 'David M.', area: 'Sinza', initials: 'DM', rating: 5 },
  { quote: 'Verified badge gave me confidence. Nyumba nzuri kwa bei nzuri.', name: 'Neema K.', area: 'Mbezi', initials: 'NK', rating: 5 },
];
