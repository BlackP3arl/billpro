'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RecentAccount {
  id: string;
  account_number: string;
  account_name: string;
  provider: string;
  description?: string;
  created_at: string;
}

interface RecentServiceNumber {
  id: string;
  service_number: string;
  account_number: string;
  account_name: string;
  provider: string;
  package_name?: string;
  created_at: string;
}

export default function NewItemsPage() {
  const [recentAccounts, setRecentAccounts] = useState<RecentAccount[]>([]);
  const [recentServiceNumbers, setRecentServiceNumbers] = useState<RecentServiceNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(24); // hours

  useEffect(() => {
    fetchRecentItems();
  }, [timeRange]);

  const fetchRecentItems = async () => {
    setLoading(true);
    try {
      const [accountsRes, serviceNumbersRes] = await Promise.all([
        fetch(`/api/accounts/recent?hours=${timeRange}`),
        fetch(`/api/service-numbers/recent?hours=${timeRange}`),
      ]);

      const accountsData = await accountsRes.json();
      const serviceNumbersData = await serviceNumbersRes.json();

      if (accountsData.success) {
        setRecentAccounts(accountsData.data);
      }
      if (serviceNumbersData.success) {
        setRecentServiceNumbers(serviceNumbersData.data);
      }
    } catch (err) {
      console.error('Failed to fetch recent items:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Newly Added Items</h1>
          <p className="text-muted-foreground">
            Accounts and service numbers added during bill processing
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={timeRange === 24 ? 'default' : 'outline'}
            onClick={() => setTimeRange(24)}
          >
            Last 24 Hours
          </Button>
          <Button
            variant={timeRange === 168 ? 'default' : 'outline'}
            onClick={() => setTimeRange(168)}
          >
            Last 7 Days
          </Button>
          <Button
            variant={timeRange === 720 ? 'default' : 'outline'}
            onClick={() => setTimeRange(720)}
          >
            Last 30 Days
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recently Added Accounts */}
            <Card>
              <CardHeader>
                <CardTitle>Newly Added Accounts ({recentAccounts.length})</CardTitle>
                <CardDescription>
                  Accounts auto-registered during bill processing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentAccounts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No new accounts added in the last {timeRange} hours
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/accounts`}
                                className="font-semibold text-lg hover:text-primary hover:underline"
                              >
                                {account.account_name}
                              </Link>
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                Auto-registered
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              <span className="font-mono">{account.account_number}</span> • {account.provider}
                            </p>
                            {account.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {account.description}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimeAgo(account.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recently Added Service Numbers */}
            <Card>
              <CardHeader>
                <CardTitle>Newly Added Service Numbers ({recentServiceNumbers.length})</CardTitle>
                <CardDescription>
                  Service numbers detected for the first time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentServiceNumbers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No new service numbers added in the last {timeRange} hours
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentServiceNumbers.map((sn) => (
                      <div
                        key={sn.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/service-numbers/${sn.service_number}`}
                                className="font-mono font-semibold text-primary hover:underline"
                              >
                                {sn.service_number}
                              </Link>
                              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                New
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {sn.account_name || sn.account_number} • {sn.provider}
                            </p>
                            {sn.package_name && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Package: {sn.package_name}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimeAgo(sn.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-6">
          <Button onClick={() => window.history.back()} variant="outline">
            ← Back
          </Button>
        </div>
      </div>
    </>
  );
}



