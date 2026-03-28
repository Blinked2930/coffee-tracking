export type User = {
  id: string;
  name: string;
};

export type KafeType = 'dublo' | 'kafe' | 'turkish kafe' | 'macchiato' | 'cappicino' | 'macchiato_cappicino' | 'freddo' | 'cai' | 'bottled_energy' | 'canned_coffee' | 'energy_drink' | 'other';

export type KafeLog = {
  id: string;
  user_id: string;
  type: KafeType;
  created_at: string;
  location?: string;
  notes?: string;
  photo_url?: string;
  rating?: number;
};