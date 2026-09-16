export interface Offer {
  id: string;
  title: string;
  meta?: string;
  description: string;
  details?: string[];
  price?: string;
  featured?: boolean;
  active?: boolean;
}