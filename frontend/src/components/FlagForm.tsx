import { useState, useEffect } from 'react';
import type { Flag, FlagCreate, FlagUpdate } from '../types';

interface FlagFormProps {
  flag?: Flag | null;
  onSubmit: (data: FlagCreate | FlagUpdate) => Promise<void>;
  onCancel: () => void;
}

export default function FlagForm({ flag, onSubmit, onCancel }: FlagFormProps) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'boolean' | 'string' | 'number' | 'json'>('boolean');
  const [value, setValue] = useState('false');
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (flag) {
      setKey(flag.key);
      setName(flag.name);
      setDescription(flag.description || '');
      setType(flag.type);
      setValue(flag.value);
      setEnabled(flag.enabled);
    }
  }, [flag]);

  function validateValue(type: string, value: string): boolean {
    switch (type) {
      case 'boolean':
        return value === 'true' || value === 'false';
      case 'number':
        return !isNaN(parseFloat(value));
      case 'json':
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      default:
        return true;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!flag && !key.trim()) {
      setError('Key is required');
      return;
    }

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!validateValue(type, value)) {
      setError(`Invalid value for ${type} type`);
      return;
    }

    try {
      setSubmitting(true);
      
      if (flag) {
        // Update
        await onSubmit({
          name,
          description: description || undefined,
          type,
          value,
          enabled,
        });
      } else {
        // Create
        await onSubmit({
          key,
          name,
          description: description || undefined,
          type,
          value,
          enabled,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  function handleTypeChange(newType: typeof type) {
    setType(newType);
    
    // Set default value based on type
    switch (newType) {
      case 'boolean':
        setValue('false');
        break;
      case 'number':
        setValue('0');
        break;
      case 'json':
        setValue('{}');
        break;
      case 'string':
        setValue('');
        break;
    }
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        {flag ? 'Edit Flag' : 'Create New Flag'}
      </h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {!flag && (
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700">
                Key *
              </label>
              <input
                type="text"
                id="key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                placeholder="feature_flag_key"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Unique identifier (lowercase, underscores, no spaces)
              </p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Feature Flag Name"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="What does this flag control?"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Type *
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as typeof type)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="boolean">Boolean</option>
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700">
              Value *
            </label>
            {type === 'boolean' ? (
              <select
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : type === 'json' ? (
              <textarea
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                placeholder='{"key": "value"}'
                required
              />
            ) : (
              <input
                type={type === 'number' ? 'number' : 'text'}
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                placeholder={type === 'number' ? '0' : 'value'}
                required
              />
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enabled"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
            Enabled
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
          >
            {submitting ? 'Saving...' : flag ? 'Update Flag' : 'Create Flag'}
          </button>
        </div>
      </form>
    </div>
  );
}
