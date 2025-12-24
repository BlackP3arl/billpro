import { query } from '../db/client';
import { Alert, AlertWithDetails, CreateAlertInput, AlertSeverity } from '../types/alert';
import { Bill } from '../types/bill';

/**
 * Get all alerts
 */
export async function getAllAlerts(): Promise<Alert[]> {
  const result = await query<Alert>(
    'SELECT * FROM alerts ORDER BY created_at DESC'
  );
  return result.rows;
}

/**
 * Get active alerts with details
 */
export async function getActiveAlerts(): Promise<AlertWithDetails[]> {
  const result = await query<AlertWithDetails>(
    'SELECT * FROM v_active_alerts'
  );
  return result.rows;
}

/**
 * Get alerts for a specific bill
 */
export async function getAlertsForBill(billId: string): Promise<Alert[]> {
  const result = await query<Alert>(
    'SELECT * FROM alerts WHERE bill_id = $1 ORDER BY created_at DESC',
    [billId]
  );
  return result.rows;
}

/**
 * Get alerts for a service account
 */
export async function getAlertsForAccount(accountId: string): Promise<Alert[]> {
  const result = await query<Alert>(
    'SELECT * FROM alerts WHERE service_account_id = $1 AND status = $2 ORDER BY created_at DESC',
    [accountId, 'active']
  );
  return result.rows;
}

/**
 * Create alert
 */
export async function createAlert(input: CreateAlertInput): Promise<Alert> {
  const result = await query<Alert>(
    `INSERT INTO alerts (
      bill_id, service_account_id, alert_type, severity,
      current_amount, previous_amount, percentage_increase,
      threshold_exceeded, title, description, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      input.bill_id,
      input.service_account_id,
      input.alert_type,
      input.severity,
      input.current_amount || null,
      input.previous_amount || null,
      input.percentage_increase || null,
      input.threshold_exceeded || null,
      input.title,
      input.description || null,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ]
  );

  return result.rows[0];
}

/**
 * Detect and create alerts for a bill
 */
export async function detectAlertsForBill(
  currentBill: Bill,
  thresholdPercentage: number = 20
): Promise<Alert[]> {
  const alerts: Alert[] = [];

  if (!currentBill.service_account_id) {
    return alerts; // Can't compare without account
  }

  // Find previous bill for same account
  const previousBillResult = await query<Bill>(
    `SELECT * FROM bills
     WHERE service_account_id = $1
     AND billing_period_start < $2
     AND processing_status = 'completed'
     ORDER BY billing_period_start DESC
     LIMIT 1`,
    [currentBill.service_account_id, currentBill.billing_period_start]
  );

  if (previousBillResult.rows.length === 0) {
    return alerts; // No previous bill to compare
  }

  const previousBill = previousBillResult.rows[0];

  // Calculate percentage increase
  const increase = currentBill.total_due - previousBill.total_due;
  const percentageIncrease = (increase / previousBill.total_due) * 100;

  // Check if threshold exceeded
  if (percentageIncrease >= thresholdPercentage) {
    const severity = getSeverity(percentageIncrease);

    const alert = await createAlert({
      bill_id: currentBill.id,
      service_account_id: currentBill.service_account_id,
      alert_type: 'high_charge',
      severity,
      current_amount: currentBill.total_due,
      previous_amount: previousBill.total_due,
      percentage_increase: percentageIncrease,
      threshold_exceeded: thresholdPercentage,
      title: `Bill increased by ${percentageIncrease.toFixed(1)}%`,
      description: `Current bill (MVR ${currentBill.total_due.toFixed(
        2
      )}) is ${percentageIncrease.toFixed(
        1
      )}% higher than last month (MVR ${previousBill.total_due.toFixed(2)})`,
      metadata: {
        previous_invoice: previousBill.invoice_number,
        increase_amount: increase,
      },
    });

    alerts.push(alert);
  }

  return alerts;
}

/**
 * Get severity based on percentage increase
 */
function getSeverity(percentageIncrease: number): AlertSeverity {
  if (percentageIncrease >= 50) return 'critical';
  if (percentageIncrease >= 30) return 'high';
  return 'medium';
}

/**
 * Acknowledge alert
 */
export async function acknowledgeAlert(
  alertId: string,
  acknowledgedBy?: string
): Promise<Alert> {
  const result = await query<Alert>(
    `UPDATE alerts
     SET status = 'acknowledged',
         acknowledged_at = CURRENT_TIMESTAMP,
         acknowledged_by = $2
     WHERE id = $1
     RETURNING *`,
    [alertId, acknowledgedBy || null]
  );

  if (result.rows.length === 0) {
    throw new Error(`Alert with ID ${alertId} not found`);
  }

  return result.rows[0];
}

/**
 * Resolve alert
 */
export async function resolveAlert(
  alertId: string,
  resolvedBy?: string,
  resolutionNotes?: string
): Promise<Alert> {
  const result = await query<Alert>(
    `UPDATE alerts
     SET status = 'resolved',
         resolved_at = CURRENT_TIMESTAMP,
         resolved_by = $2,
         resolution_notes = $3
     WHERE id = $1
     RETURNING *`,
    [alertId, resolvedBy || null, resolutionNotes || null]
  );

  if (result.rows.length === 0) {
    throw new Error(`Alert with ID ${alertId} not found`);
  }

  return result.rows[0];
}

/**
 * Dismiss alert
 */
export async function dismissAlert(alertId: string): Promise<Alert> {
  const result = await query<Alert>(
    `UPDATE alerts
     SET status = 'dismissed'
     WHERE id = $1
     RETURNING *`,
    [alertId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Alert with ID ${alertId} not found`);
  }

  return result.rows[0];
}
