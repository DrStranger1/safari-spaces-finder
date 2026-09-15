export const formatTzs = (n: number) => new Intl.NumberFormat('en-TZ').format(n);

export const buildWhatsappUrl = (
  phone: string,
  message: string,
): string | null => {
  if (!phone) return null;
  const cleaned = phone.replace(/[^0-9+]/g, '');
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
};
