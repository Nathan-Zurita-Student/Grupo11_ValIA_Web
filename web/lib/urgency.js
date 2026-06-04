// Calcula o nível de urgência a partir da data de validade.
// Espelha exatamente a lógica do backend.
const DAY = 24 * 60 * 60 * 1000;

export function urgencyOf(expiryDate) {
  const days = Math.ceil((new Date(expiryDate) - new Date()) / DAY);
  if (days < 0) return { level: 'gone', days, label: 'Vencido' };
  if (days <= 1) return { level: 'red', days, label: days === 0 ? 'Vence hoje' : 'Vence amanhã' };
  if (days <= 3) return { level: 'amber', days, label: `Vence em ${days} dias` };
  return { level: 'green', days, label: `Vence em ${days} dias` };
}

export const URGENCY_STYLES = {
  green: { dot: 'bg-urgency-green', ring: 'ring-brand-100', text: 'text-brand-600' },
  amber: { dot: 'bg-urgency-amber', ring: 'ring-amber-100', text: 'text-amber-700' },
  red: { dot: 'bg-urgency-red', ring: 'ring-red-100', text: 'text-red-600' },
  gone: { dot: 'bg-urgency-gone', ring: 'ring-neutral-200', text: 'text-neutral-500' },
};

export const CATEGORIES = ['laticinios', 'carnes', 'enlatados', 'hortifruti', 'bebidas', 'outros'];

export const CATEGORY_LABELS = {
  laticinios: 'Laticínios',
  carnes: 'Carnes',
  enlatados: 'Enlatados',
  hortifruti: 'Hortifrúti',
  bebidas: 'Bebidas',
  outros: 'Outros',
};
