import { query, transaction } from '../db/client';
import { Bill, BillExtractionResult, BillComparison } from '../types/bill';
import { LineItem, CreateLineItemInput } from '../types/line-item';

/**
 * Get all bills
 */
export async function getAllBills(): Promise<Bill[]> {
  const result = await query<Bill>(
    'SELECT * FROM bills ORDER BY bill_date DESC'
  );
  return result.rows;
}

/**
 * Get bills summary with account info
 */
export async function getBillsSummary() {
  const result = await query('SELECT * FROM v_bills_summary ORDER BY bill_date DESC');
  return result.rows;
}

/**
 * Get recent bills
 */
export async function getRecentBills(limit: number = 10): Promise<Bill[]> {
  const result = await query<Bill>(
    'SELECT * FROM bills ORDER BY bill_date DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

/**
 * Get bill by ID
 */
export async function getBillById(id: string): Promise<Bill | null> {
  const result = await query<Bill>('SELECT * FROM bills WHERE id = $1', [id]);
  return result.rows[0] || null;
}

/**
 * Get bill by invoice number
 */
export async function getBillByInvoiceNumber(invoiceNumber: string): Promise<Bill | null> {
  const result = await query<Bill>(
    'SELECT * FROM bills WHERE invoice_number = $1',
    [invoiceNumber]
  );
  return result.rows[0] || null;
}

/**
 * Get bills for a service account
 */
export async function getBillsForAccount(accountId: string): Promise<Bill[]> {
  const result = await query<Bill>(
    'SELECT * FROM bills WHERE service_account_id = $1 ORDER BY bill_date DESC',
    [accountId]
  );
  return result.rows;
}

/**
 * Create bill from extraction result
 */
export async function createBillFromExtraction(
  extraction: BillExtractionResult,
  filePath: string,
  fileName: string,
  fileSize: number,
  serviceAccountId?: string
): Promise<Bill> {
  return transaction(async (client) => {
    // Create bill
    const billResult = await client.query<Bill>(
      `INSERT INTO bills (
        service_account_id, invoice_number, account_number,
        billing_period_start, billing_period_end, bill_date, due_date,
        current_charges, outstanding_amount, gst_amount, total_due,
        file_path, file_name, file_size_bytes,
        processing_status, extraction_confidence, extracted_data,
        requires_review
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        serviceAccountId || null,
        extraction.invoiceNumber,
        extraction.accountNumber,
        extraction.billingPeriodStart,
        extraction.billingPeriodEnd,
        extraction.billDate,
        extraction.dueDate || null,
        extraction.currentCharges,
        extraction.outstanding,
        extraction.gstAmount,
        extraction.totalDue,
        filePath,
        fileName,
        fileSize,
        serviceAccountId ? 'completed' : 'review_required',
        extraction.confidence,
        JSON.stringify(extraction),
        !serviceAccountId, // requires_review if no account
      ]
    );

    const bill = billResult.rows[0];

    // Create line items
    if (extraction.lineItems && extraction.lineItems.length > 0) {
      for (const item of extraction.lineItems) {
        await client.query(
          `INSERT INTO line_items (
            bill_id, service_number, package_name,
            subscription_charge, usage_charges, total_charge,
            service_period_start, service_period_end, usage_details
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            bill.id,
            item.serviceNumber,
            item.packageName,
            item.subscriptionCharge,
            item.usageCharges,
            item.totalCharge,
            item.servicePeriodStart || null,
            item.servicePeriodEnd || null,
            item.usageDetails ? JSON.stringify(item.usageDetails) : null,
          ]
        );
      }
    }

    // Update processed timestamp
    await client.query(
      'UPDATE bills SET processed_at = CURRENT_TIMESTAMP WHERE id = $1',
      [bill.id]
    );

    return bill;
  });
}

/**
 * Update bill
 */
export async function updateBill(
  id: string,
  data: Partial<Bill>
): Promise<Bill> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  // Build dynamic update query
  Object.keys(data).forEach((key) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = $${paramCount++}`);
      values.push((data as any)[key]);
    }
  });

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);

  const result = await query<Bill>(
    `UPDATE bills SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error(`Bill with ID ${id} not found`);
  }

  return result.rows[0];
}

/**
 * Link bill to service account
 */
export async function linkBillToAccount(
  billId: string,
  accountId: string
): Promise<Bill> {
  const result = await query<Bill>(
    `UPDATE bills
     SET service_account_id = $1,
         processing_status = 'completed',
         requires_review = false
     WHERE id = $2
     RETURNING *`,
    [accountId, billId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Bill with ID ${billId} not found`);
  }

  return result.rows[0];
}

/**
 * Delete bill
 */
export async function deleteBill(id: string): Promise<void> {
  await query('DELETE FROM bills WHERE id = $1', [id]);
}

/**
 * Get line items for a bill
 */
export async function getLineItemsForBill(billId: string): Promise<LineItem[]> {
  const result = await query<LineItem>(
    'SELECT * FROM line_items WHERE bill_id = $1 ORDER BY service_number',
    [billId]
  );
  return result.rows;
}

/**
 * Get previous bill for comparison
 */
export async function getPreviousBill(
  accountId: string,
  currentBillingStart: Date
): Promise<Bill | null> {
  const result = await query<Bill>(
    `SELECT * FROM bills
     WHERE service_account_id = $1
     AND billing_period_start < $2
     AND processing_status = 'completed'
     ORDER BY billing_period_start DESC
     LIMIT 1`,
    [accountId, currentBillingStart]
  );

  return result.rows[0] || null;
}

/**
 * Compare current bill with previous bill
 */
export async function compareBills(
  currentBillId: string,
  previousBillId?: string
): Promise<BillComparison | null> {
  const currentBill = await getBillById(currentBillId);
  if (!currentBill) {
    throw new Error('Current bill not found');
  }

  let previousBill: Bill | null = null;

  if (previousBillId) {
    previousBill = await getBillById(previousBillId);
  } else if (currentBill.service_account_id) {
    previousBill = await getPreviousBill(
      currentBill.service_account_id,
      currentBill.billing_period_start
    );
  }

  if (!previousBill) {
    return {
      currentBill,
      previousBill: null,
      difference: 0,
      percentageChange: 0,
      hasIncreased: false,
      newLineItems: [],
      removedLineItems: [],
    };
  }

  const difference = currentBill.total_due - previousBill.total_due;
  const percentageChange = (difference / previousBill.total_due) * 100;

  // Get line items for comparison
  const currentLineItems = await getLineItemsForBill(currentBillId);
  const previousLineItems = await getLineItemsForBill(previousBill.id);

  const currentServiceNumbers = new Set(
    currentLineItems.map((item) => item.service_number)
  );
  const previousServiceNumbers = new Set(
    previousLineItems.map((item) => item.service_number)
  );

  const newLineItems = currentLineItems
    .filter((item) => !previousServiceNumbers.has(item.service_number))
    .map((item) => item.service_number);

  const removedLineItems = previousLineItems
    .filter((item) => !currentServiceNumbers.has(item.service_number))
    .map((item) => item.service_number);

  return {
    currentBill,
    previousBill,
    difference,
    percentageChange,
    hasIncreased: difference > 0,
    newLineItems,
    removedLineItems,
  };
}

/**
 * Check if invoice number already exists
 */
export async function invoiceExists(invoiceNumber: string): Promise<boolean> {
  const result = await query(
    'SELECT COUNT(*) as count FROM bills WHERE invoice_number = $1',
    [invoiceNumber]
  );
  return parseInt(result.rows[0].count) > 0;
}

/**
 * Get bills requiring review
 */
export async function getBillsRequiringReview(): Promise<Bill[]> {
  const result = await query<Bill>(
    'SELECT * FROM bills WHERE requires_review = true ORDER BY created_at DESC'
  );
  return result.rows;
}

/**
 * Mark bill as verified
 */
export async function verifyBill(billId: string): Promise<Bill> {
  const result = await query<Bill>(
    'UPDATE bills SET is_verified = true, requires_review = false WHERE id = $1 RETURNING *',
    [billId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Bill with ID ${billId} not found`);
  }

  return result.rows[0];
}
