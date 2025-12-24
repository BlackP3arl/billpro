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
  const [formData, setFormData] = useState({
    account_number: '',
    account_name: '',
    provider: 'Dhiraagu',
    description: '',
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
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add Account'}
        </Button>
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
                  <div>
                    <h3 className="font-semibold text-lg">{account.account_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {account.provider} • {account.account_number}
                    </p>
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
                      <p className="text-2xl font-bold">
                        {account.total_spending
                          ? `MVR ${parseFloat(account.total_spending).toFixed(0)}`
                          : 'MVR 0'}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
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
