'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function BillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('bill_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  // Filter and sort bills
  const filteredAndSortedBills = useMemo(() => {
    let filtered = bills;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = bills.filter((bill) => {
        return (
          bill.invoice_number?.toLowerCase().includes(query) ||
          bill.account_number?.toLowerCase().includes(query) ||
          bill.account_name?.toLowerCase().includes(query) ||
          bill.provider?.toLowerCase().includes(query)
        );
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle date fields
      if (sortField.includes('date') || sortField.includes('period')) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle numeric fields
      if (sortField === 'total_due') {
        aValue = parseFloat(aValue || 0);
        bValue = parseFloat(bValue || 0);
      }

      // Handle string fields
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [bills, searchQuery, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-muted-foreground">↕</span>;
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Searchable view of all invoices</p>
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

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by invoice number, account number, account name, or provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  size="sm"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading invoices...</p>
            </CardContent>
          </Card>
        ) : filteredAndSortedBills.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No invoices found matching your search' : 'No invoices found'}
              </p>
              {!searchQuery && (
                <Link href="/upload">
                  <Button>Upload Your First Bill</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>All Invoices</CardTitle>
                  <CardDescription>
                    Showing {filteredAndSortedBills.length} of {bills.length} invoice{bills.length !== 1 ? 's' : ''}
                    {searchQuery && ` matching "${searchQuery}"`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th
                        className="text-left p-3 font-semibold cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('invoice_number')}
                      >
                        <div className="flex items-center gap-2">
                          Invoice Number
                          <SortIcon field="invoice_number" />
                        </div>
                      </th>
                      <th
                        className="text-left p-3 font-semibold cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('account_name')}
                      >
                        <div className="flex items-center gap-2">
                          Account
                          <SortIcon field="account_name" />
                        </div>
                      </th>
                      <th
                        className="text-left p-3 font-semibold cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('provider')}
                      >
                        <div className="flex items-center gap-2">
                          Provider
                          <SortIcon field="provider" />
                        </div>
                      </th>
                      <th
                        className="text-left p-3 font-semibold cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('bill_date')}
                      >
                        <div className="flex items-center gap-2">
                          Bill Date
                          <SortIcon field="bill_date" />
                        </div>
                      </th>
                      <th className="text-left p-3 font-semibold">Billing Period</th>
                      <th
                        className="text-right p-3 font-semibold cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('total_due')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Amount
                          <SortIcon field="total_due" />
                        </div>
                      </th>
                      <th className="text-left p-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedBills.map((bill) => (
                      <tr
                        key={bill.id}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-3">
                          <Link
                            href={`/bills/${bill.id}`}
                            className="font-mono font-semibold text-primary hover:underline"
                          >
                            {bill.invoice_number}
                          </Link>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{bill.account_name || bill.account_number}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {bill.account_number}
                            </p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{bill.provider || '-'}</span>
                        </td>
                        <td className="p-3">
                          <p className="text-sm">
                            {new Date(bill.bill_date).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="p-3">
                          <p className="text-sm">
                            {new Date(bill.billing_period_start).toLocaleDateString()} -{' '}
                            {new Date(bill.billing_period_end).toLocaleDateString()}
                          </p>
                        </td>
                        <td className="p-3 text-right">
                          <p className="font-semibold">
                            MVR {Number(bill.total_due || 0).toFixed(2)}
                          </p>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            {bill.active_alert_count > 0 && (
                              <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded w-fit">
                                ⚠️ {bill.active_alert_count} alert{bill.active_alert_count !== 1 ? 's' : ''}
                              </span>
                            )}
                            {bill.requires_review && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded w-fit">
                                Needs Review
                              </span>
                            )}
                            {bill.processing_status !== 'completed' && (
                              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded w-fit">
                                {bill.processing_status}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? `Found ${filteredAndSortedBills.length} invoice${filteredAndSortedBills.length !== 1 ? 's' : ''}`
              : `Total: ${bills.length} invoice${bills.length !== 1 ? 's' : ''}`}
          </p>
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
