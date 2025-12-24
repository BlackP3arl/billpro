import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { quickScanPdfBill } from '@/lib/pdf/pdf-processor';
import { getBillByInvoiceNumber, getBillByFileName } from '@/lib/services/bill-service';
import { getAccountByNumber } from '@/lib/services/account-service';

export async function POST(request: NextRequest) {
  try {
    const { fileName, filePath } = await request.json();

    if (!fileName || !filePath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get full file path
    const fullPath = path.join(process.cwd(), 'public', filePath);

    // Quick scan: Extract only invoice and account number from first page
    console.log('Quick scanning PDF:', fullPath);
    const quickScanResult = await quickScanPdfBill(fullPath);

    console.log('Quick scan complete:', {
      invoiceNumber: quickScanResult.invoiceNumber,
      accountNumber: quickScanResult.accountNumber,
      confidence: quickScanResult.confidence,
    });

    // Get account (if exists)
    const account = await getAccountByNumber(quickScanResult.accountNumber);

    // Check for duplicates - only invoice and file (billing period check requires full extraction)
    // Check invoice number first
    const existingInvoice = await getBillByInvoiceNumber(quickScanResult.invoiceNumber);
    if (existingInvoice) {
      return NextResponse.json({
        success: false,
        isDuplicate: true,
        duplicateReason: 'invoice',
        error: `Invoice ${quickScanResult.invoiceNumber} already exists in the system.`,
        existingBill: existingInvoice,
        invoiceNumber: quickScanResult.invoiceNumber,
        accountNumber: quickScanResult.accountNumber,
        confidence: quickScanResult.confidence,
      });
    }

    // Check file name
    const existingFileBill = await getBillByFileName(fileName);
    if (existingFileBill) {
      return NextResponse.json({
        success: false,
        isDuplicate: true,
        duplicateReason: 'file',
        error: `File "${fileName}" has already been uploaded.`,
        existingBill: existingFileBill,
        invoiceNumber: quickScanResult.invoiceNumber,
        accountNumber: quickScanResult.accountNumber,
        confidence: quickScanResult.confidence,
      });
    }

    // Not a duplicate, return success with extracted info
    return NextResponse.json({
      success: true,
      isDuplicate: false,
      invoiceNumber: quickScanResult.invoiceNumber,
      accountNumber: quickScanResult.accountNumber,
      confidence: quickScanResult.confidence,
      accountExists: !!account,
    });
  } catch (error: any) {
    console.error('Pre-scan error:', error);
    return NextResponse.json(
      { error: `Pre-scan failed: ${error.message}` },
      { status: 500 }
    );
  }
}

