'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';

export default function Home() {
  const [stats, setStats] = useState<{
    totalAccounts: number;
    totalServiceNumbers: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="grid gap-6">
            {/* Statistics Cards and Upload Button */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Total Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-2xl font-bold">Loading...</p>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold">{stats?.totalAccounts || 0}</p>
                      <Link
                        href="/accounts"
                        className="text-sm text-primary hover:underline mt-2 inline-block"
                      >
                        View all accounts →
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Service Numbers</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-2xl font-bold">Loading...</p>
                  ) : (
                    <div>
                      <p className="text-3xl font-bold">{stats?.totalServiceNumbers || 0}</p>
                      <Link
                        href="/service-numbers"
                        className="text-sm text-primary hover:underline mt-2 inline-block"
                      >
                        View all service numbers →
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Action</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-full">
                  <Link
                    href="/upload"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 w-full"
                  >
                    Upload Bill
                  </Link>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Welcome to BillPro</h2>
              <p className="text-muted-foreground mb-4">
                Automate your ISP bill processing with intelligent scanning and
                verification.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">📄 Upload Bills</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop PDF bills for automatic processing
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">🤖 AI Extraction</h3>
                  <p className="text-sm text-muted-foreground">
                    Claude Vision API extracts all bill data accurately
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">⚠️ Smart Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified when charges increase beyond threshold
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Setup Instructions</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Set up PostgreSQL database and run the schema.sql file</li>
                <li>Copy .env.example to .env.local and add your Anthropic API key</li>
                <li>Install dependencies: npm install</li>
                <li>Run database migrations (see lib/db/schema.sql)</li>
                <li>Start the development server: npm run dev</li>
              </ol>
            </div>
          </div>
        </main>

        <footer className="border-t">
          <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
            <p>BillPro © 2025 - Built with Next.js, PostgreSQL, and Claude AI</p>
          </div>
        </footer>
      </div>
    </>
  );
}
