export interface Accommodation {
  id: string;
  name: string;
  price: number | string;
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
