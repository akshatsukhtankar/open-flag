import type { Flag, FlagCreate, FlagUpdate } from './types';

const API_BASE_URL = '/api';

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new APIError(response.status, error.detail || 'An error occurred');
  }
  
  if (response.status === 204) {
    return null as T;
  }
  
  return response.json();
}

export const api = {
  // Health check
  async health(): Promise<{ status: string; service: string }> {
    const response = await fetch('/health');
    return handleResponse(response);
  },

  // Get all flags
  async getFlags(): Promise<Flag[]> {
    const response = await fetch(`${API_BASE_URL}/flags`);
    return handleResponse(response);
  },

  // Get flag by ID
  async getFlag(id: number): Promise<Flag> {
    const response = await fetch(`${API_BASE_URL}/flags/${id}`);
    return handleResponse(response);
  },

  // Get flag by key
  async getFlagByKey(key: string): Promise<Flag> {
    const response = await fetch(`${API_BASE_URL}/flags/key/${encodeURIComponent(key)}`);
    return handleResponse(response);
  },

  // Create flag
  async createFlag(data: FlagCreate): Promise<Flag> {
    const response = await fetch(`${API_BASE_URL}/flags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Update flag
  async updateFlag(id: number, data: FlagUpdate): Promise<Flag> {
    const response = await fetch(`${API_BASE_URL}/flags/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Delete flag
  async deleteFlag(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/flags/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

export { APIError };
