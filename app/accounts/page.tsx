'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    account_number: '',
    account_name: '',
    provider: 'Dhiraagu',
    description: '',
  });
  const [editFormData, setEditFormData] = useState({
    provider: '',
  });
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchAccounts();

    // Check if we need to register an account
    const registerAccount = searchParams.get('register');
    if (registerAccount) {
      setFormData((prev) => ({ ...prev, account_number: registerAccount }));
      setShowForm(true);
    }
  }, [searchParams]);

  // Cancel any active edits when edit mode is disabled
  useEffect(() => {
    if (!editMode && editingAccountId) {
      setEditingAccountId(null);
      setEditFormData({ provider: '' });
    }
  }, [editMode, editingAccountId]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts?stats=true');
      const data = await res.json();

      if (data.success) {
        setAccounts(data.data);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setShowForm(false);
        setFormData({
          account_number: '',
          account_name: '',
          provider: 'Dhiraagu',
          description: '',
        });
        fetchAccounts();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEditClick = (account: any) => {
    setEditingAccountId(account.id);
    setEditFormData({
      provider: account.provider || 'Dhiraagu',
    });
  };

  const handleCancelEdit = () => {
    setEditingAccountId(null);
    setEditFormData({ provider: '' });
  };

  const handleUpdateProvider = async (accountId: string) => {
    try {
      const res = await fetch('/api/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: accountId,
          provider: editFormData.provider,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setEditingAccountId(null);
        setEditFormData({ provider: '' });
        fetchAccounts();
      } else {
        alert(data.error || 'Failed to update provider');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update provider');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p>Loading accounts...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Service Accounts</h1>
          <p className="text-muted-foreground">
            Manage ISP service accounts
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="edit-mode-toggle" className="text-sm font-medium cursor-pointer">
              Edit Mode
            </label>
            <button
              id="edit-mode-toggle"
              type="button"
              role="switch"
              aria-checked={editMode}
              onClick={() => setEditMode(!editMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                editMode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  editMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add Account'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Register New Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.account_number}
                  onChange={(e) =>
                    setFormData({ ...formData, account_number: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., BA11639924"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.account_name}
                  onChange={(e) =>
                    setFormData({ ...formData, account_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., MTCC Main Office"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Provider *
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) =>
                    setFormData({ ...formData, provider: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="Dhiraagu">Dhiraagu</option>
                  <option value="Ooredoo">Ooredoo</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="e.g., Mobile services for main office"
                />
              </div>

              <Button type="submit" className="w-full">
                Register Account
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No accounts found</p>
            <Button onClick={() => setShowForm(true)}>Add Your First Account</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{account.account_name}</h3>
                      {editingAccountId === account.id ? (
                        <div className="mt-2 space-y-2">
                          <label className="block text-sm font-medium">
                            Service Provider *
                          </label>
                          <select
                            value={editFormData.provider}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, provider: e.target.value })
                            }
                            className="w-full px-3 py-2 border rounded-md bg-background"
                          >
                            <option value="Dhiraagu">Dhiraagu</option>
                            <option value="Ooredoo">Ooredoo</option>
                            <option value="Other">Other</option>
                          </select>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateProvider(account.id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">{account.provider}</span> • {account.account_number}
                          </p>
                          {editMode && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2"
                              onClick={() => handleEditClick(account)}
                            >
                              Edit Provider
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {account.description && (
                    <p className="text-sm text-muted-foreground">
                      {account.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <p className="text-2xl font-bold">
                        {account.total_bills || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Bills</p>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">
                          {account.current_month_total
                            ? `MVR ${parseFloat(account.current_month_total.toString()).toFixed(0)}`
                            : 'MVR 0'}
                        </p>
                        {account.previous_month_total !== undefined && account.previous_month_total > 0 && (
                          <p className="text-xs text-muted-foreground">
                            (prev: MVR {parseFloat(account.previous_month_total.toString()).toFixed(0)})
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">This Month</p>
                    </div>
                  </div>

                  {account.active_alerts > 0 && (
                    <div className="pt-2">
                      <span className="px-2 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded text-xs">
                        ⚠️ {account.active_alerts} active alert(s)
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link href="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
    </>
  );
}
