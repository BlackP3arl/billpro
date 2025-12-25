'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProcessingJob {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  status: 'pending' | 'uploading' | 'quick-scanning' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'duplicate-pending';
  progress: number;
  error?: string;
  result?: any;
  startTime?: number;
  endTime?: number;
  duration?: number;
  abortController?: AbortController;
  duplicateInfo?: {
    invoiceNumber: string;
    accountNumber: string;
    reason: 'invoice' | 'billing_period' | 'file';
    existingBill?: any;
  };
}

export default function UploadPage() {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [duplicateModal, setDuplicateModal] = useState<{
    jobId: string;
    invoiceNumber: string;
    accountNumber: string;
    reason: 'invoice' | 'billing_period' | 'file';
    existingBill?: any;
  } | null>(null);
  const [fileReuseModal, setFileReuseModal] = useState<{
    jobId: string;
    fileName: string;
    filePath: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const updateJob = useCallback((jobId: string, updates: Partial<ProcessingJob>) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          const updated = { ...job, ...updates };
          // Calculate duration if both start and end times are present
          if (updated.startTime && updated.endTime) {
            updated.duration = updated.endTime - updated.startTime;
          }
          return updated;
        }
        return job;
      })
    );
  }, []);

  const cancelJob = (jobId: string) => {
    const controller = abortControllersRef.current.get(jobId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(jobId);
    }
    
    const job = jobs.find((j) => j.id === jobId);
    if (job && ['pending', 'uploading', 'processing'].includes(job.status)) {
      const endTime = Date.now();
      updateJob(jobId, {
        status: 'cancelled',
        progress: 0,
        error: 'Processing cancelled by user',
        endTime,
        duration: job.startTime ? endTime - job.startTime : 0,
      });
    }
  };

  const handleDuplicateProceed = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job || !job.result?.uploadData) return;

    setDuplicateModal(null);
    updateJob(jobId, { status: 'processing', progress: 40 });

    const abortController = abortControllersRef.current.get(jobId);
    if (!abortController) return;

    try {
      // Proceed with full scan, skipping duplicate check
      const processRes = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...job.result.uploadData,
          skipDuplicateCheck: true,
        }),
        signal: abortController.signal,
      });

      if (abortController.signal.aborted) {
        return;
      }

      const processData = await processRes.json();

      if (!processData.success) {
        throw new Error(processData.error || 'Processing failed');
      }

      const endTime = Date.now();
      const duration = endTime - (job.startTime || Date.now());

      updateJob(jobId, {
        status: 'completed',
        progress: 100,
        result: processData.data,
        endTime,
        duration,
      });

      abortControllersRef.current.delete(jobId);
    } catch (err: any) {
      if (abortController.signal.aborted) {
        return;
      }

      const endTime = Date.now();
      updateJob(jobId, {
        status: 'failed',
        error: err.message,
        endTime,
        duration: endTime - (job.startTime || Date.now()),
      });

      abortControllersRef.current.delete(jobId);
    }
  };

  const handleDuplicateCancel = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const controller = abortControllersRef.current.get(jobId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(jobId);
    }

    const endTime = Date.now();
    updateJob(jobId, {
      status: 'cancelled',
      progress: 0,
      error: 'Processing cancelled - duplicate detected',
      endTime,
      duration: job.startTime ? endTime - job.startTime : 0,
    });

    setDuplicateModal(null);
  };

  const handleFileReuseContinue = (jobId: string) => {
    setFileReuseModal(null);
    // Continue with normal processing flow
    // The uploadData is already stored, just proceed to quick scan
    const job = jobs.find((j) => j.id === jobId);
    if (!job || !job.result?.uploadData) return;

    // Continue with quick scan
    continueProcessingAfterUpload(jobId, job.result.uploadData);
  };

  const handleFileReuseCancel = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const controller = abortControllersRef.current.get(jobId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(jobId);
    }

    const endTime = Date.now();
    updateJob(jobId, {
      status: 'cancelled',
      progress: 0,
      error: 'Processing cancelled - file already exists',
      endTime,
      duration: job.startTime ? endTime - job.startTime : 0,
    });

    setFileReuseModal(null);
  };

  const continueProcessingAfterUpload = async (jobId: string, uploadData: any) => {
    const abortController = abortControllersRef.current.get(jobId);
    if (!abortController) return;

    try {
      // Step 2: Quick scan for duplicate detection
      updateJob(jobId, { status: 'quick-scanning', progress: 30 });

      const preScanRes = await fetch('/api/process/pre-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadData.fileName,
          filePath: uploadData.filePath,
        }),
        signal: abortController.signal,
      });

      // Check if cancelled
      if (abortController.signal.aborted) {
        return;
      }

      const preScanData = await preScanRes.json();

      // Step 3: Check if duplicate found
      if (preScanData.isDuplicate) {
        // Store duplicate info and show modal
        updateJob(jobId, {
          status: 'duplicate-pending',
          progress: 30,
          duplicateInfo: {
            invoiceNumber: preScanData.invoiceNumber,
            accountNumber: preScanData.accountNumber,
            reason: preScanData.duplicateReason,
            existingBill: preScanData.existingBill,
          },
        });

        setDuplicateModal({
          jobId,
          invoiceNumber: preScanData.invoiceNumber,
          accountNumber: preScanData.accountNumber,
          reason: preScanData.duplicateReason,
          existingBill: preScanData.existingBill,
        });

        // Store uploadData for later use if user proceeds
        updateJob(jobId, { 
          result: { uploadData },
          duplicateInfo: {
            invoiceNumber: preScanData.invoiceNumber,
            accountNumber: preScanData.accountNumber,
            reason: preScanData.duplicateReason,
            existingBill: preScanData.existingBill,
          },
        });
        return;
      }

      // Not a duplicate, proceed with full scan
      updateJob(jobId, { status: 'processing', progress: 40 });

      const processRes = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadData),
        signal: abortController.signal,
      });

      // Check if cancelled
      if (abortController.signal.aborted) {
        return;
      }

      const processData = await processRes.json();

      if (!processData.success) {
        // Check if it's a duplicate (fallback check)
        if (processData.isDuplicate) {
          const job = jobs.find((j) => j.id === jobId);
          const endTime = Date.now();
          updateJob(jobId, {
            status: 'failed',
            error: processData.error || 'Duplicate bill detected',
            endTime,
            duration: job?.startTime ? endTime - job.startTime : 0,
            result: {
              isDuplicate: true,
              duplicateReason: processData.duplicateReason,
              existingBill: processData.existingBill,
            },
          });
          abortControllersRef.current.delete(jobId);
          return;
        }
        throw new Error(processData.error || 'Processing failed');
      }

      const job = jobs.find((j) => j.id === jobId);
      const endTime = Date.now();
      const duration = endTime - (job?.startTime || Date.now());

      // Step 4: Mark as completed
      updateJob(jobId, {
        status: 'completed',
        progress: 100,
        result: processData.data,
        endTime,
        duration,
      });
      
      abortControllersRef.current.delete(jobId);
    } catch (err: any) {
      if (abortController.signal.aborted) {
        return;
      }
      
      const job = jobs.find((j) => j.id === jobId);
      const endTime = Date.now();
      updateJob(jobId, {
        status: 'failed',
        error: err.message,
        endTime,
        duration: job?.startTime ? endTime - job.startTime : 0,
      });
      
      abortControllersRef.current.delete(jobId);
    }
  };

  const processFile = async (file: File) => {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();
    const abortController = new AbortController();
    
    // Store abort controller for this job
    abortControllersRef.current.set(jobId, abortController);

    // Create job
    const newJob: ProcessingJob = {
      id: jobId,
      fileName: file.name,
      originalName: file.name,
      fileSize: file.size,
      status: 'pending',
      progress: 0,
      startTime,
      abortController,
    };

    setJobs((prev) => [...prev, newJob]);

    try {
      // Step 1: Upload file
      updateJob(jobId, { status: 'uploading', progress: 10 });

      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      });

      // Check if cancelled
      if (abortController.signal.aborted) {
        return;
      }

      const uploadData = await uploadRes.json();

      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed');
      }

      updateJob(jobId, { progress: 20 });

      // Check if file was reused (already exists in uploads folder)
      if (uploadData.data.fileReused) {
        // Store uploadData for later use
        updateJob(jobId, { 
          result: { uploadData: uploadData.data },
          status: 'pending',
        });

        // Show file reuse modal
        setFileReuseModal({
          jobId,
          fileName: uploadData.data.originalName,
          filePath: uploadData.data.filePath,
        });
        return;
      }

      // File is new, continue with normal processing
      // Store uploadData for later use
      updateJob(jobId, { 
        result: { uploadData: uploadData.data },
      });

      // Step 2: Continue with processing (quick scan, then full scan)
      await continueProcessingAfterUpload(jobId, uploadData.data);
    } catch (err: any) {
      // Don't update if it was cancelled
      if (abortController.signal.aborted) {
        return;
      }
      
      const endTime = Date.now();
      updateJob(jobId, {
        status: 'failed',
        error: err.message,
        endTime,
        duration: endTime - startTime,
      });
      
      abortControllersRef.current.delete(jobId);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.type !== 'application/pdf') {
        // Create a failed job for invalid files
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        setJobs((prev) => [
          ...prev,
          {
            id: jobId,
            fileName: file.name,
            originalName: file.name,
            fileSize: file.size,
            status: 'failed',
            progress: 0,
            error: 'Only PDF files are allowed',
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0,
          },
        ]);
        return;
      }

      // Check if this file is already being processed or completed in this session
      const isAlreadyProcessing = jobs.some(
        (job) =>
          job.originalName === file.name &&
          job.fileSize === file.size &&
          ['pending', 'uploading', 'processing'].includes(job.status)
      );

      if (isAlreadyProcessing) {
        // Create a failed job for duplicate file in same session
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        setJobs((prev) => [
          ...prev,
          {
            id: jobId,
            fileName: file.name,
            originalName: file.name,
            fileSize: file.size,
            status: 'failed',
            progress: 0,
            error: `File "${file.name}" is already being processed in this session`,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0,
            result: {
              isDuplicate: true,
              duplicateReason: 'file',
            },
          },
        ]);
        return;
      }

      // Process the file
      processFile(file);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeJob = (jobId: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
  };

  const getStatusColor = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'processing':
        return 'text-blue-600 dark:text-blue-400';
      case 'uploading':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusBadgeColor = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'cancelled':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'uploading':
      case 'quick-scanning':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'duplicate-pending':
        return 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  const activeJobs = jobs.filter((job) =>
    ['pending', 'uploading', 'quick-scanning', 'processing', 'duplicate-pending'].includes(job.status)
  );
  const completedJobs = jobs.filter((job) => job.status === 'completed');
  const failedJobs = jobs.filter((job) => ['failed', 'cancelled'].includes(job.status));

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Upload Bills</h1>
            <p className="text-muted-foreground">
              Upload multiple PDF bills for automatic processing. You can upload additional files
              while others are being processed.
            </p>
          </div>

          {/* Upload Area - Always Available */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select PDF Files</CardTitle>
              <CardDescription>
                Drag and drop PDF bills or click to browse (max 10MB per file)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 dark:border-gray-700 hover:border-primary'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="space-y-2">
                  <p className="text-lg font-medium">Drop PDF files here</p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse • Multiple files supported
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Jobs */}
          {activeJobs.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Processing ({activeJobs.length})</CardTitle>
                <CardDescription>Files currently being processed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeJobs.map((job) => (
                    <div
                      key={job.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{job.originalName}</p>
                            <span
                              className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(
                                job.status
                              )}`}
                            >
                              {job.status === 'quick-scanning' && 'Quick Scanning'}
                              {job.status === 'duplicate-pending' && 'Duplicate Detected'}
                              {job.status !== 'quick-scanning' && job.status !== 'duplicate-pending' &&
                                job.status.charAt(0).toUpperCase() + job.status.slice(1).replace(/-/g, ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(job.fileSize)}
                          </p>
                        </div>
                        {job.status !== 'duplicate-pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelJob(job.id)}
                            className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              job.status === 'failed'
                                ? 'bg-red-500'
                                : job.status === 'completed'
                                ? 'bg-green-500'
                                : 'bg-primary'
                            }`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {job.status === 'uploading' && 'Uploading file...'}
                            {job.status === 'quick-scanning' && 'Scanning for duplicates (offline)...'}
                            {job.status === 'processing' && 'Extracting data with AI...'}
                            {job.status === 'duplicate-pending' && 'Waiting for user decision...'}
                            {job.status === 'pending' && 'Queued...'}
                          </span>
                          {job.startTime && (
                            <span>
                              {formatDuration(Date.now() - job.startTime)} elapsed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Jobs */}
          {completedJobs.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Completed ({completedJobs.length})</CardTitle>
                <CardDescription>Successfully processed bills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50/50 dark:bg-green-950/20"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{job.originalName}</p>
                            <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                              Completed
                            </span>
                          </div>
                          {job.result && (
                            <div className="text-sm text-muted-foreground space-y-1 mt-2">
                              <p>
                                <strong>Invoice:</strong> {job.result.extraction?.invoiceNumber}
                              </p>
                              <p>
                                <strong>Account:</strong> {job.result.extraction?.accountNumber}
                              </p>
                              <p>
                                <strong>Total Due:</strong> MVR{' '}
                                {job.result.extraction?.totalDue?.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeJob(job.id)}
                          className="ml-2"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-green-200 dark:border-green-800">
                        <span>
                          {job.result?.alerts?.length > 0 && (
                            <span className="text-amber-600">
                              ⚠️ {job.result.alerts.length} alert(s)
                            </span>
                          )}
                          {job.result?.hasNewServices && (
                            <span className="text-blue-600 ml-2">
                              ✨ New service numbers detected
                            </span>
                          )}
                        </span>
                        {job.duration !== undefined && (
                          <span className="font-medium">
                            Processed in {formatDuration(job.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Failed/Cancelled Jobs */}
          {failedJobs.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Failed/Cancelled ({failedJobs.length})</CardTitle>
                <CardDescription>Files that failed to process or were cancelled</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {failedJobs.map((job) => {
                    const isDuplicate = job.result?.isDuplicate;
                    const isCancelled = job.status === 'cancelled';
                    return (
                      <div
                        key={job.id}
                        className={`border rounded-lg p-4 ${
                          isCancelled
                            ? 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20'
                            : isDuplicate
                            ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
                            : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">{job.originalName}</p>
                              <span
                                className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(
                                  job.status
                                )}`}
                              >
                                {isCancelled
                                  ? 'Cancelled'
                                  : isDuplicate
                                  ? 'Duplicate'
                                  : 'Failed'}
                              </span>
                            </div>
                            <p
                              className={`text-sm mt-1 ${
                                isDuplicate
                                  ? 'text-amber-700 dark:text-amber-300'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {job.error || 'Unknown error occurred'}
                            </p>
                            {isDuplicate && job.result?.existingBill && (
                              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                <p>
                                  Existing bill: Invoice{' '}
                                  {job.result.existingBill.invoice_number}
                                </p>
                                <p>
                                  Billing period:{' '}
                                  {new Date(
                                    job.result.existingBill.billing_period_start
                                  ).toLocaleDateString()}{' '}
                                  -{' '}
                                  {new Date(
                                    job.result.existingBill.billing_period_end
                                  ).toLocaleDateString()}
                                </p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                  onClick={() =>
                                    router.push(
                                      `/bills/${job.result.existingBill.id}`
                                    )
                                  }
                                >
                                  View Existing Bill
                                </Button>
                              </div>
                            )}
                            {job.duration !== undefined && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {isDuplicate
                                  ? 'Detected as duplicate'
                                  : `Failed after ${formatDuration(job.duration)}`}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeJob(job.id)}
                            className="ml-2"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {jobs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No files uploaded yet. Drop PDF files above to get started.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {jobs.length > 0 && (
            <div className="flex gap-4 justify-end">
              <Button
                onClick={() => {
                  setJobs([]);
                }}
                variant="outline"
              >
                Clear All
              </Button>
              <Button onClick={() => router.push('/bills')}>
                View All Bills
              </Button>
            </div>
          )}

          {/* File Reuse Modal */}
          {fileReuseModal && (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => {
                // Don't close on outside click - user must make explicit choice
              }}
            >
              <Card 
                className="max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <CardHeader>
                  <CardTitle>File Already Exists</CardTitle>
                  <CardDescription>
                    This file already exists in the system. The existing file will be used for processing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>File Name:</strong>{' '}
                      <span className="font-mono">{fileReuseModal.fileName}</span>
                    </p>
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        ℹ️ The system detected that this file has been uploaded before. To save disk space, the existing file will be reused instead of creating a duplicate copy.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleFileReuseCancel(fileReuseModal.jobId)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleFileReuseContinue(fileReuseModal.jobId)}
                    >
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Duplicate Detection Modal */}
          {duplicateModal && (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => {
                // Don't close on outside click - user must make explicit choice
              }}
            >
              <Card 
                className="max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <CardHeader>
                  <CardTitle>Duplicate Bill Detected</CardTitle>
                  <CardDescription>
                    This invoice appears to already exist in the system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Invoice Number:</strong>{' '}
                      <span className="font-mono">{duplicateModal.invoiceNumber}</span>
                    </p>
                    <p className="text-sm">
                      <strong>Account Number:</strong>{' '}
                      <span className="font-mono">{duplicateModal.accountNumber}</span>
                    </p>
                    {duplicateModal.existingBill && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Existing Bill:</p>
                        <p className="text-sm">
                          Billing Period:{' '}
                          {new Date(duplicateModal.existingBill.billing_period_start).toLocaleDateString()}{' '}
                          -{' '}
                          {new Date(duplicateModal.existingBill.billing_period_end).toLocaleDateString()}
                        </p>
                        {duplicateModal.existingBill.total_due && (
                          <p className="text-sm">
                            Total: MVR {parseFloat(duplicateModal.existingBill.total_due.toString()).toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleDuplicateCancel(duplicateModal.jobId)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleDuplicateProceed(duplicateModal.jobId)}
                    >
                      Proceed Anyway
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
