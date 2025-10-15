import { useState, useEffect } from 'react';
import type { Flag, FlagCreate, FlagUpdate } from './types';
import { api, APIError } from './api';
import FlagList from './components/FlagList';
import FlagForm from './components/FlagForm';
import Header from './components/Header';

function App() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFlag, setEditingFlag] = useState<Flag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFlags();
  }, []);

  async function loadFlags() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getFlags();
      setFlags(data);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to load flags');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: FlagCreate) {
    try {
      await api.createFlag(data);
      await loadFlags();
      setShowForm(false);
    } catch (err) {
      if (err instanceof APIError) {
        throw new Error(err.message);
      }
      throw err;
    }
  }

  async function handleUpdate(id: number, data: FlagUpdate) {
    try {
      await api.updateFlag(id, data);
      await loadFlags();
      setEditingFlag(null);
    } catch (err) {
      if (err instanceof APIError) {
        throw new Error(err.message);
      }
      throw err;
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this flag?')) {
      return;
    }

    try {
      await api.deleteFlag(id);
      await loadFlags();
    } catch (err) {
      if (err instanceof APIError) {
        alert(`Failed to delete flag: ${err.message}`);
      } else {
        alert('Failed to delete flag');
      }
    }
  }

  async function handleToggleEnabled(flag: Flag) {
    try {
      await api.updateFlag(flag.id, { enabled: !flag.enabled });
      await loadFlags();
    } catch (err) {
      if (err instanceof APIError) {
        alert(`Failed to update flag: ${err.message}`);
      } else {
        alert('Failed to update flag');
      }
    }
  }

  function handleEdit(flag: Flag) {
    setEditingFlag(flag);
    setShowForm(false);
  }

  function handleCancelEdit() {
    setEditingFlag(null);
  }

  function handleNewFlag() {
    setShowForm(true);
    setEditingFlag(null);
  }

  const filteredFlags = flags.filter(flag =>
    flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (flag.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onNewFlag={handleNewFlag}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {(showForm || editingFlag) && (
          <div className="mb-8">
            <FlagForm
              flag={editingFlag}
              onSubmit={editingFlag 
                ? (data) => handleUpdate(editingFlag.id, data)
                : handleCreate
              }
              onCancel={editingFlag ? handleCancelEdit : () => setShowForm(false)}
            />
          </div>
        )}

        <FlagList
          flags={filteredFlags}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleEnabled={handleToggleEnabled}
        />

        {!loading && filteredFlags.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No flags found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try a different search query' : 'Get started by creating a new flag'}
            </p>
            {!searchQuery && (
              <div className="mt-6">
                <button
                  onClick={handleNewFlag}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Flag
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
