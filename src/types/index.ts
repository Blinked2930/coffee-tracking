export type User = {
  id: string;
  name: string;
};

export type KafeType = 'standard' | 'espresso' | 'macchiato' | 'freddo';

export type KafeLog = {
  id: string;
  user_id: string;
  type: KafeType;
  created_at: string;
  location?: string;
  notes?: string;
  photo_url?: string;
};
