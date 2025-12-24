import { query } from '../db/client';

export interface MonthlyCharge {
  id: string;
  service_number_id: string;
  bill_id: string;
  line_item_id: string;
  service_number: string;
  billing_period_start: Date;
  billing_period_end: Date;
  bill_date: Date;
  subscription_charge: number;
  usage_charges: number;
  other_charges: number;
  total_charge: number;
  package_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MonthlyChargeWithBillInfo extends MonthlyCharge {
  invoice_number: string;
  account_number: string;
  account_name?: string;
}

/**
 * Record monthly charge for a service number from a bill
 */
export async function recordMonthlyCharge(
  serviceNumberId: string,
  billId: string,
  lineItemId: string,
  serviceNumber: string,
  billingPeriodStart: Date,
  billingPeriodEnd: Date,
  billDate: Date,
  subscriptionCharge: number,
  usageCharges: number,
  otherCharges: number,
  totalCharge: number,
  packageName?: string
): Promise<MonthlyCharge> {
  const result = await query<MonthlyCharge>(
    `INSERT INTO service_number_monthly_charges (
      service_number_id,
      bill_id,
      line_item_id,
      service_number,
      billing_period_start,
      billing_period_end,
      bill_date,
      subscription_charge,
      usage_charges,
      other_charges,
      total_charge,
      package_name
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (service_number, bill_id) DO UPDATE SET
      subscription_charge = $8,
      usage_charges = $9,
      other_charges = $10,
      total_charge = $11,
      package_name = $12
    RETURNING *`,
    [
      serviceNumberId,
      billId,
      lineItemId,
      serviceNumber,
      billingPeriodStart,
      billingPeriodEnd,
      billDate,
      subscriptionCharge,
      usageCharges,
      otherCharges,
      totalCharge,
      packageName || null,
    ]
  );

  return result.rows[0];
}

/**
 * Get monthly charge history for a service number
 */
export async function getMonthlyChargesForServiceNumber(
  serviceNumber: string
): Promise<MonthlyChargeWithBillInfo[]> {
  const result = await query<MonthlyChargeWithBillInfo>(
    `SELECT
      mc.*,
      b.invoice_number,
      b.account_number,
      sa.account_name
    FROM service_number_monthly_charges mc
    JOIN bills b ON mc.bill_id = b.id
    LEFT JOIN service_accounts sa ON b.service_account_id = sa.id
    WHERE mc.service_number = $1
    ORDER BY mc.bill_date DESC`,
    [serviceNumber]
  );

  return result.rows;
}

/**
 * Get monthly charges for a bill
 */
export async function getMonthlyChargesForBill(
  billId: string
): Promise<MonthlyCharge[]> {
  const result = await query<MonthlyCharge>(
    'SELECT * FROM service_number_monthly_charges WHERE bill_id = $1 ORDER BY service_number',
    [billId]
  );

  return result.rows;
}

/**
 * Get total charges for a service number across all bills
 */
export async function getTotalChargesForServiceNumber(
  serviceNumber: string
): Promise<{
  total_subscription: number;
  total_usage: number;
  total_other: number;
  total_all: number;
  month_count: number;
}> {
  const result = await query(
    `SELECT
      COALESCE(SUM(subscription_charge), 0) as total_subscription,
      COALESCE(SUM(usage_charges), 0) as total_usage,
      COALESCE(SUM(other_charges), 0) as total_other,
      COALESCE(SUM(total_charge), 0) as total_all,
      COUNT(*) as month_count
    FROM service_number_monthly_charges
    WHERE service_number = $1`,
    [serviceNumber]
  );

  return result.rows[0];
}

/**
 * Record monthly charges for all line items in a bill
 */
export async function recordMonthlyChargesForBill(
  billId: string,
  accountId: string
): Promise<number> {
  // Get bill details
  const billResult = await query(
    'SELECT billing_period_start, billing_period_end, bill_date FROM bills WHERE id = $1',
    [billId]
  );

  if (billResult.rows.length === 0) {
    throw new Error(`Bill ${billId} not found`);
  }

  const bill = billResult.rows[0];

  // Get all line items for this bill
  const lineItemsResult = await query(
    `SELECT
      li.*,
      sn.id as service_number_id
    FROM line_items li
    LEFT JOIN service_numbers sn ON li.service_number = sn.service_number AND sn.service_account_id = $2
    WHERE li.bill_id = $1`,
    [billId, accountId]
  );

  let recordedCount = 0;

  for (const lineItem of lineItemsResult.rows) {
    if (lineItem.service_number_id) {
      await recordMonthlyCharge(
        lineItem.service_number_id,
        billId,
        lineItem.id,
        lineItem.service_number,
        bill.billing_period_start,
        bill.billing_period_end,
        bill.bill_date,
        lineItem.subscription_charge || 0,
        lineItem.usage_charges || 0,
        lineItem.other_charges || 0,
        lineItem.total_charge,
        lineItem.package_name
      );
      recordedCount++;
    }
  }

  return recordedCount;
}
