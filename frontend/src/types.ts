export interface Flag {
  id: number;
  key: string;
  name: string;
  description: string | null;
  type: 'boolean' | 'string' | 'number' | 'json';
  value: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlagCreate {
  key: string;
  name: string;
  description?: string;
  type: 'boolean' | 'string' | 'number' | 'json';
  value: string;
  enabled: boolean;
}

export interface FlagUpdate {
  name?: string;
  description?: string;
  type?: 'boolean' | 'string' | 'number' | 'json';
  value?: string;
  enabled?: boolean;
}
