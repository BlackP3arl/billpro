import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { processPdfBill } from '@/lib/pdf/pdf-processor';
import { createBillFromExtraction, checkForDuplicates } from '@/lib/services/bill-service';
import { getAccountByNumber, autoRegisterAccount } from '@/lib/services/account-service';
import { detectAlertsForBill } from '@/lib/services/alert-service';
import { detectNewServiceNumbers, getNewServiceNumbers } from '@/lib/services/service-number-service';
import { recordMonthlyChargesForBill } from '@/lib/services/monthly-charge-service';

export async function POST(request: NextRequest) {
  try {
    const { fileName, filePath, fileSize, skipDuplicateCheck } = await request.json();

    if (!fileName || !filePath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get full file path
    const fullPath = path.join(process.cwd(), 'public', filePath);

    // Process PDF and extract data
    console.log('Processing PDF:', fullPath);
    const { extraction, pageCount } = await processPdfBill(fullPath);

    console.log('Extraction complete:', {
      accountNumber: extraction.accountNumber,
      invoiceNumber: extraction.invoiceNumber,
      confidence: extraction.confidence,
      lineItemCount: extraction.lineItems.length,
    });

    // Auto-register account if it doesn't exist
    let account = await getAccountByNumber(extraction.accountNumber);
    let accountAutoRegistered = false;

    if (!account) {
      account = await autoRegisterAccount(extraction.accountNumber, 'Dhiraagu');
      accountAutoRegistered = true;
      console.log(`Auto-registered new account: ${extraction.accountNumber}`);
    }

    // Check for duplicates before processing (unless user chose to skip)
    if (!skipDuplicateCheck) {
      const duplicateCheck = await checkForDuplicates(
        extraction.invoiceNumber,
        account.id,
        new Date(extraction.billingPeriodStart),
        new Date(extraction.billingPeriodEnd),
        fileName
      );

      if (duplicateCheck.isDuplicate) {
        let errorMessage = '';
        switch (duplicateCheck.reason) {
          case 'invoice':
            errorMessage = `Invoice ${extraction.invoiceNumber} already exists in the system.`;
            break;
          case 'file':
            errorMessage = `File "${fileName}" has already been uploaded.`;
            break;
          case 'billing_period':
            errorMessage = `Account ${extraction.accountNumber} already has a bill for the billing period ${extraction.billingPeriodStart} to ${extraction.billingPeriodEnd}.`;
            break;
          default:
            errorMessage = 'This bill appears to be a duplicate.';
        }

        return NextResponse.json(
          {
            success: false,
            error: errorMessage,
            isDuplicate: true,
            duplicateReason: duplicateCheck.reason,
            existingBill: duplicateCheck.existingBill,
          },
          { status: 409 } // Conflict status code
        );
      }
    }

    // Create bill in database
    const bill = await createBillFromExtraction(
      extraction,
      filePath,
      fileName,
      fileSize,
      account.id
    );

    console.log('Bill created:', bill.id);

    // Detect alerts
    let alerts = [];
    let newServiceNumbers = [];
    let serviceNumberDetections = [];

    alerts = await detectAlertsForBill(bill);
    console.log(`Generated ${alerts.length} alerts`);

    // Detect new service numbers
    const lineItemsData = extraction.lineItems.map(item => ({
      serviceNumber: item.serviceNumber,
      packageName: item.packageName,
    }));

    serviceNumberDetections = await detectNewServiceNumbers(
      bill.id,
      account.id,
      lineItemsData
    );

    newServiceNumbers = getNewServiceNumbers(serviceNumberDetections);

    if (newServiceNumbers.length > 0) {
      console.log(`Detected ${newServiceNumbers.length} new service numbers`);
    }

    // Record monthly charges for all service numbers
    const chargesRecorded = await recordMonthlyChargesForBill(bill.id, account.id);
    console.log(`Recorded ${chargesRecorded} monthly charges`);

    return NextResponse.json({
      success: true,
      data: {
        bill,
        extraction,
        alerts,
        accountFound: true,
        accountAutoRegistered,
        requiresAccountRegistration: false,
        pageCount,
        newServiceNumbers,
        hasNewServices: newServiceNumbers.length > 0,
        chargesRecorded,
      },
    });
  } catch (error: any) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { error: `Processing failed: ${error.message}` },
      { status: 500 }
    );
  }
}
