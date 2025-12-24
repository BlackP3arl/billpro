'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
      setResult(null);
    } else {
      setError('Please drop a PDF file');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      // Upload file
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      setUploading(false);
      setProcessing(true);

      // Process bill
      const processRes = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadData.data),
      });

      const processData = await processRes.json();

      if (!processData.success) {
        throw new Error(processData.error || 'Processing failed');
      }

      setResult(processData.data);
      setProcessing(false);

      // If account registration required, prompt user
      if (processData.data.requiresAccountRegistration) {
        const accountNumber = processData.data.extraction.accountNumber;
        if (
          confirm(
            `Account ${accountNumber} not found. Would you like to register it?`
          )
        ) {
          router.push(`/accounts?register=${accountNumber}`);
        }
      }
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Upload Bill</h1>
          <p className="text-muted-foreground">
            Upload a PDF bill for automatic processing and data extraction
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select PDF File</CardTitle>
            <CardDescription>
              Drag and drop a PDF bill or click to browse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <div>
                  <p className="text-lg font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg mb-2">Drop PDF file here</p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse (max 10MB)
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}

            {file && !result && (
              <div className="mt-6">
                <Button
                  onClick={handleUpload}
                  disabled={uploading || processing}
                  className="w-full"
                >
                  {uploading
                    ? 'Uploading...'
                    : processing
                    ? 'Processing with AI...'
                    : 'Upload and Process'}
                </Button>
              </div>
            )}

            {result && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    Processing Complete!
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Invoice:</strong> {result.extraction.invoiceNumber}
                    </p>
                    <p>
                      <strong>Account:</strong> {result.extraction.accountNumber}
                    </p>
                    <p>
                      <strong>Total Due:</strong> MVR{' '}
                      {result.extraction.totalDue.toFixed(2)}
                    </p>
                    <p>
                      <strong>Line Items:</strong> {result.extraction.lineItems.length}
                    </p>
                    <p>
                      <strong>Confidence:</strong> {result.extraction.confidence}%
                    </p>
                    {result.alerts && result.alerts.length > 0 && (
                      <p className="text-amber-600 font-medium">
                        ⚠️ {result.alerts.length} alert(s) generated
                      </p>
                    )}
                  </div>
                </div>

                {result.hasNewServices && result.newServiceNumbers && result.newServiceNumbers.length > 0 && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                      ⚠️ New Service Numbers Detected
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                      The following service numbers were not seen before in this account. Please confirm if these are valid services:
                    </p>
                    <div className="space-y-2">
                      {result.newServiceNumbers.map((service: any) => (
                        <div
                          key={service.serviceNumber}
                          className="bg-white dark:bg-gray-900 p-3 rounded border border-amber-200 dark:border-amber-800"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-mono font-semibold text-amber-900 dark:text-amber-100">
                                {service.serviceNumber}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {service.packageName}
                              </p>
                            </div>
                            <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">
                              NEW
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button onClick={() => router.push('/bills')} className="flex-1">
                    View All Bills
                  </Button>
                  <Button
                    onClick={() => {
                      setFile(null);
                      setResult(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Upload Another
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {processing && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-pulse w-2/3"></div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Converting PDF to images and extracting data with Claude AI...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </>
  );
}
