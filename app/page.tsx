export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">BillPro</h1>
          <p className="text-sm text-muted-foreground">
            ISP Bill Management & Verification System
          </p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid gap-6">
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
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="flex gap-4 flex-wrap">
              <a
                href="/upload"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Upload Bill
              </a>
              <a
                href="/bills"
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                View Bills
              </a>
              <a
                href="/accounts"
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Manage Accounts
              </a>
              <a
                href="/service-numbers"
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Service Numbers
              </a>
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
  )
}
