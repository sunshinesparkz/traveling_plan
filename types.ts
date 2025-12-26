export interface PriceOption {
  label: string;
  amount: string;
}

export interface Accommodation {
  id: string;
  name: string;
  price: number | string; // Main display price or starting price
  priceOptions?: PriceOption[]; // New: Array of price options
  link: string;
  locationLink: string; // New: Google Maps link
  images: string[];     // New: Array of image URLs
  notes: string;
  votes: number;
  addedBy: 'user' | 'ai';
}

export interface AiSuggestionParams {
  budget: string;
  style: string; // e.g., ติดทะเล, ปาร์ตี้, สงบ
  people: string;
}

export interface TripDetails extends AiSuggestionParams {
  title?: string; // Optional trip title
}