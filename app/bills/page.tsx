'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await fetch('/api/bills?summary=true');
      const data = await res.json();

      if (data.success) {
        setBills(data.data);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p>Loading bills...</p>
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
          <h1 className="text-3xl font-bold">Bills</h1>
          <p className="text-muted-foreground">View and manage all bills</p>
        </div>
        <Link href="/upload">
          <Button>Upload New Bill</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {bills.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No bills found</p>
            <Link href="/upload">
              <Button>Upload Your First Bill</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bills.map((bill) => (
            <Link key={bill.id} href={`/bills/${bill.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {bill.account_name || bill.account_number}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {bill.provider} • Invoice {bill.invoice_number}
                      </p>
                    </div>

                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Period:</span>{' '}
                        {new Date(bill.billing_period_start).toLocaleDateString()} -{' '}
                        {new Date(bill.billing_period_end).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bill Date:</span>{' '}
                        {new Date(bill.bill_date).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-4 text-sm">
                      <span className="px-2 py-1 bg-muted rounded text-xs">
                        {bill.line_item_count} services
                      </span>
                      {bill.active_alert_count > 0 && (
                        <span className="px-2 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded text-xs">
                          ⚠️ {bill.active_alert_count} alert(s)
                        </span>
                      )}
                      {bill.requires_review && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded text-xs">
                          Needs Review
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      MVR {bill.total_due ? Number(bill.total_due).toFixed(2) : '0.00'}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Due</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {bills.length} bill{bills.length !== 1 ? 's' : ''}
        </p>
        <Link href="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
    </>
  );
}
