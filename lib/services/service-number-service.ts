import { query } from '../db/client';

export interface ServiceNumber {
  id: string;
  service_number: string;
  service_account_id: string;
  package_name?: string;
  division_name?: string; // Division of MTCC using this service
  first_seen_bill_id?: string;
  first_seen_date: Date;
  last_seen_bill_id?: string;
  last_seen_date?: Date;
  is_active: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface NewServiceDetection {
  serviceNumber: string;
  packageName: string;
  isNew: boolean;
  firstSeenInThisBill: boolean;
}

/**
 * Get all service numbers for an account
 */
export async function getServiceNumbersForAccount(
  accountId: string
): Promise<ServiceNumber[]> {
  const result = await query<ServiceNumber>(
    'SELECT * FROM service_numbers WHERE service_account_id = $1 ORDER BY service_number',
    [accountId]
  );
  return result.rows;
}

/**
 * Check if a service number exists for an account
 */
export async function serviceNumberExists(
  serviceNumber: string,
  accountId: string
): Promise<boolean> {
  const result = await query(
    'SELECT COUNT(*) as count FROM service_numbers WHERE service_number = $1 AND service_account_id = $2',
    [serviceNumber, accountId]
  );
  return parseInt(result.rows[0].count) > 0;
}

/**
 * Register a new service number
 */
export async function registerServiceNumber(
  serviceNumber: string,
  accountId: string,
  billId: string,
  packageName?: string
): Promise<ServiceNumber> {
  const result = await query<ServiceNumber>(
    `INSERT INTO service_numbers (
      service_number, service_account_id, package_name,
      first_seen_bill_id, last_seen_bill_id, last_seen_date
    ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    ON CONFLICT (service_number)
    DO UPDATE SET
      last_seen_bill_id = $5,
      last_seen_date = CURRENT_TIMESTAMP,
      package_name = COALESCE(service_numbers.package_name, $3)
    RETURNING *`,
    [serviceNumber, accountId, packageName || null, billId, billId]
  );
  return result.rows[0];
}

/**
 * Update last seen for a service number
 */
export async function updateServiceNumberLastSeen(
  serviceNumber: string,
  billId: string
): Promise<void> {
  await query(
    `UPDATE service_numbers
     SET last_seen_bill_id = $1, last_seen_date = CURRENT_TIMESTAMP
     WHERE service_number = $2`,
    [billId, serviceNumber]
  );
}

/**
 * Detect new service numbers in a bill
 */
export async function detectNewServiceNumbers(
  billId: string,
  accountId: string,
  lineItems: Array<{ serviceNumber: string; packageName: string }>
): Promise<NewServiceDetection[]> {
  const detections: NewServiceDetection[] = [];

  for (const item of lineItems) {
    const exists = await serviceNumberExists(item.serviceNumber, accountId);

    detections.push({
      serviceNumber: item.serviceNumber,
      packageName: item.packageName,
      isNew: !exists,
      firstSeenInThisBill: !exists,
    });

    // Register or update the service number
    await registerServiceNumber(
      item.serviceNumber,
      accountId,
      billId,
      item.packageName
    );
  }

  return detections;
}

/**
 * Get new service numbers (not seen before)
 */
export async function getNewServiceNumbers(
  detections: NewServiceDetection[]
): NewServiceDetection[] {
  return detections.filter((d) => d.isNew);
}

/**
 * Mark service number as inactive
 */
export async function deactivateServiceNumber(
  serviceNumber: string
): Promise<void> {
  await query(
    'UPDATE service_numbers SET is_active = false WHERE service_number = $1',
    [serviceNumber]
  );
}

/**
 * Mark service number as active
 */
export async function activateServiceNumber(
  serviceNumber: string
): Promise<void> {
  await query(
    'UPDATE service_numbers SET is_active = true WHERE service_number = $1',
    [serviceNumber]
  );
}

/**
 * Add notes to a service number
 */
export async function addServiceNumberNotes(
  serviceNumber: string,
  notes: string
): Promise<void> {
  await query(
    'UPDATE service_numbers SET notes = $1 WHERE service_number = $2',
    [notes, serviceNumber]
  );
}

/**
 * Get all service numbers (with stats)
 */
export async function getAllServiceNumbers() {
  const result = await query('SELECT * FROM v_service_numbers');
  return result.rows;
}

export interface ServiceNumberFilters {
  accountId?: string;
  serviceNumber?: string;
  packageName?: string;
  divisionName?: string;
  isActive?: boolean;
}

/**
 * Get service numbers with optional filtering
 */
export async function getServiceNumbers(filters?: ServiceNumberFilters) {
  let sql = `
    SELECT
      sn.*,
      sa.account_number,
      sa.account_name,
      sa.provider,
      fb.invoice_number as first_seen_invoice,
      lb.invoice_number as last_seen_invoice
    FROM service_numbers sn
    LEFT JOIN service_accounts sa ON sn.service_account_id = sa.id
    LEFT JOIN bills fb ON sn.first_seen_bill_id = fb.id
    LEFT JOIN bills lb ON sn.last_seen_bill_id = lb.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.accountId) {
    sql += ` AND sn.service_account_id = $${paramIndex}`;
    params.push(filters.accountId);
    paramIndex++;
  }

  if (filters?.serviceNumber) {
    sql += ` AND sn.service_number ILIKE $${paramIndex}`;
    params.push(`%${filters.serviceNumber}%`);
    paramIndex++;
  }

  if (filters?.packageName) {
    sql += ` AND sn.package_name ILIKE $${paramIndex}`;
    params.push(`%${filters.packageName}%`);
    paramIndex++;
  }

  if (filters?.divisionName) {
    sql += ` AND sn.division_name ILIKE $${paramIndex}`;
    params.push(`%${filters.divisionName}%`);
    paramIndex++;
  }

  if (filters?.isActive !== undefined) {
    sql += ` AND sn.is_active = $${paramIndex}`;
    params.push(filters.isActive);
    paramIndex++;
  }

  sql += ' ORDER BY sn.service_number';

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Detect removed service numbers (in previous bill but not in current)
 */
export async function detectRemovedServiceNumbers(
  accountId: string,
  currentServiceNumbers: string[]
): Promise<string[]> {
  const result = await query(
    `SELECT service_number FROM service_numbers
     WHERE service_account_id = $1 AND is_active = true
     AND service_number NOT IN (${currentServiceNumbers.map((_, i) => `$${i + 2}`).join(',')})`,
    [accountId, ...currentServiceNumbers]
  );

  return result.rows.map((row: any) => row.service_number);
}

/**
 * Get recently added service numbers (within specified hours)
 */
export async function getRecentlyAddedServiceNumbers(hours: number = 24): Promise<any[]> {
  const result = await query(
    `SELECT 
      sn.*,
      sa.account_number,
      sa.account_name,
      sa.provider,
      fb.invoice_number as first_seen_invoice,
      lb.invoice_number as last_seen_invoice
     FROM service_numbers sn
     LEFT JOIN service_accounts sa ON sn.service_account_id = sa.id
     LEFT JOIN bills fb ON sn.first_seen_bill_id = fb.id
     LEFT JOIN bills lb ON sn.last_seen_bill_id = lb.id
     WHERE sn.created_at >= NOW() - INTERVAL '1 hour' * $1
     ORDER BY sn.created_at DESC`,
    [hours]
  );
  return result.rows;
}
