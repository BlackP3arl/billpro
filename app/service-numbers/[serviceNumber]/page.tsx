'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface MonthlyCharge {
  id: string;
  service_number: string;
  billing_period_start: string;
  billing_period_end: string;
  bill_date: string;
  subscription_charge: number;
  usage_charges: number;
  other_charges: number;
  total_charge: number;
  package_name?: string;
  invoice_number: string;
  account_number: string;
  account_name?: string;
}

interface Totals {
  total_subscription: number;
  total_usage: number;
  total_other: number;
  total_all: number;
  month_count: number;
}

interface MonthlyData {
  month: number;
  monthName: string;
  total: number;
}

export default function ServiceNumberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceNumber = params.serviceNumber as string;

  const [monthlyCharges, setMonthlyCharges] = useState<MonthlyCharge[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServiceNumberDetails();
  }, [serviceNumber]);

  const fetchServiceNumberDetails = async () => {
    try {
      const [detailsRes, monthlyTotalsRes] = await Promise.all([
        fetch(`/api/service-numbers/${serviceNumber}`),
        fetch(`/api/service-numbers/${serviceNumber}/monthly-totals?year=${new Date().getFullYear()}`),
      ]);

      const detailsData = await detailsRes.json();
      const monthlyTotalsData = await monthlyTotalsRes.json();

      if (detailsData.success) {
        setMonthlyCharges(detailsData.data.monthlyCharges);
        setTotals(detailsData.data.totals);
      } else {
        setError(detailsData.error);
      }

      if (monthlyTotalsData.success) {
        setMonthlyData(monthlyTotalsData.data);
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
          <p>Loading service number details...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-4">
            {error}
          </div>
          <Button onClick={() => router.push('/service-numbers')} variant="outline">
            Back to Service Numbers
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          onClick={() => router.push('/service-numbers')}
          variant="outline"
          className="mb-4"
        >
          ← Back to Service Numbers
        </Button>
        <h1 className="text-3xl font-bold">Service Number Details</h1>
        <p className="text-xl font-mono text-muted-foreground">{serviceNumber}</p>
      </div>

      {/* Monthly Trend Chart */}
      {monthlyData.length > 0 && monthlyData.some((m) => m.total > 0) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Monthly Trend Analysis ({new Date().getFullYear()})</CardTitle>
            <CardDescription>
              Total charges per month for this service number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <XAxis
                    dataKey="monthName"
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    width={60}
                    tickFormatter={(value) => {
                      if (value >= 1000) return `MVR ${(value / 1000).toFixed(1)}k`;
                      return `MVR ${value}`;
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`MVR ${value.toFixed(2)}`, 'Total']}
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {totals && (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                MVR {Number(totals.total_subscription).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {totals.month_count} month{totals.month_count !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                MVR {Number(totals.total_usage).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Usage charges</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Other Charges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                MVR {Number(totals.total_other).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Additional fees</p>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Grand Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                MVR {Number(totals.total_all).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All charges combined</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Charge History */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Charge History</CardTitle>
          <CardDescription>
            Charges for this service number across all billing periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyCharges.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No charge history found for this service number
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Bill Date</th>
                    <th className="text-left p-3 font-semibold">Billing Period</th>
                    <th className="text-left p-3 font-semibold">Package</th>
                    <th className="text-right p-3 font-semibold">Subscription</th>
                    <th className="text-right p-3 font-semibold">Usage</th>
                    <th className="text-right p-3 font-semibold">Other</th>
                    <th className="text-right p-3 font-semibold">Total</th>
                    <th className="text-left p-3 font-semibold">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyCharges.map((charge) => (
                    <tr key={charge.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        {new Date(charge.bill_date).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {new Date(charge.billing_period_start).toLocaleDateString()} -{' '}
                          {new Date(charge.billing_period_end).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm">{charge.package_name || '-'}</p>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        MVR {Number(charge.subscription_charge).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        MVR {Number(charge.usage_charges).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        MVR {Number(charge.other_charges).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        MVR {Number(charge.total_charge).toFixed(2)}
                      </td>
                      <td className="p-3">
                        <p className="text-xs font-mono">{charge.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {charge.account_name || charge.account_number}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold bg-muted/30">
                    <td colSpan={3} className="p-3 text-right">
                      Totals:
                    </td>
                    <td className="p-3 text-right">
                      MVR{' '}
                      {monthlyCharges
                        .reduce((sum, c) => sum + Number(c.subscription_charge), 0)
                        .toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      MVR{' '}
                      {monthlyCharges
                        .reduce((sum, c) => sum + Number(c.usage_charges), 0)
                        .toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      MVR{' '}
                      {monthlyCharges
                        .reduce((sum, c) => sum + Number(c.other_charges), 0)
                        .toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-primary">
                      MVR{' '}
                      {monthlyCharges
                        .reduce((sum, c) => sum + Number(c.total_charge), 0)
                        .toFixed(2)}
                    </td>
                    <td className="p-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button onClick={() => router.push('/service-numbers')} variant="outline">
          Back to Service Numbers
        </Button>
      </div>
    </div>
    </>
  );
}
