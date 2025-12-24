'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [bill, setBill] = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillDetails();
  }, [params.id]);

  const fetchBillDetails = async () => {
    try {
      const res = await fetch(`/api/bills/${params.id}?includeLineItems=true`);
      const data = await res.json();

      if (data.success) {
        setBill(data.data.bill);
        setLineItems(data.data.lineItems || []);
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
          <p>Loading bill details...</p>
        </div>
      </>
    );
  }

  if (error || !bill) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-4">
            {error || 'Bill not found'}
          </div>
          <Button onClick={() => router.push('/bills')} variant="outline">
            Back to Bills
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
        <Button onClick={() => router.push('/bills')} variant="outline" className="mb-4">
          ← Back to Bills
        </Button>
        <h1 className="text-3xl font-bold">Bill Details</h1>
        <p className="text-muted-foreground">Invoice {bill.invoice_number}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Bill Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Account Number</p>
              <p className="font-medium">{bill.account_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="font-medium">{bill.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Billing Period</p>
              <p className="font-medium">
                {new Date(bill.billing_period_start).toLocaleDateString()} -{' '}
                {new Date(bill.billing_period_end).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bill Date</p>
              <p className="font-medium">
                {new Date(bill.bill_date).toLocaleDateString()}
              </p>
            </div>
            {bill.extraction_confidence && (
              <div>
                <p className="text-sm text-muted-foreground">Extraction Confidence</p>
                <p className="font-medium">{bill.extraction_confidence}%</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">Current Charges</p>
              <p className="font-medium">
                MVR {Number(bill.current_charges).toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">Outstanding</p>
              <p className="font-medium">
                MVR {Number(bill.outstanding_amount).toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">GST</p>
              <p className="font-medium">MVR {Number(bill.gst_amount).toFixed(2)}</p>
            </div>
            <div className="flex justify-between pt-3 border-t">
              <p className="font-semibold">Total Due</p>
              <p className="text-xl font-bold text-primary">
                MVR {Number(bill.total_due).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Line Items ({lineItems.length} service{lineItems.length !== 1 ? 's' : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No line items found for this bill
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">#</th>
                    <th className="text-left p-3 font-semibold">Service Number</th>
                    <th className="text-left p-3 font-semibold">Package</th>
                    <th className="text-right p-3 font-semibold">Subscription</th>
                    <th className="text-right p-3 font-semibold">Usage</th>
                    <th className="text-right p-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-muted-foreground">{index + 1}</td>
                      <td className="p-3">
                        <Link
                          href={`/service-numbers/${item.service_number}`}
                          className="font-mono text-primary hover:underline cursor-pointer"
                        >
                          {item.service_number}
                        </Link>
                      </td>
                      <td className="p-3">{item.package_name}</td>
                      <td className="p-3 text-right">
                        MVR {Number(item.subscription_charge).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        MVR {Number(item.usage_charges).toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        MVR {Number(item.total_charge).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold">
                    <td colSpan={5} className="p-3 text-right">
                      Total:
                    </td>
                    <td className="p-3 text-right">
                      MVR{' '}
                      {lineItems
                        .reduce((sum, item) => sum + Number(item.total_charge), 0)
                        .toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-4">
        <Button onClick={() => router.push('/bills')} variant="outline">
          Back to Bills
        </Button>
        {bill.file_path && (
          <a href={bill.file_path} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">View PDF</Button>
          </a>
        )}
      </div>
    </div>
    </>
  );
}
