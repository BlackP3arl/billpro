import { query } from '../db/client';
import {
  ServiceAccount,
  ServiceAccountWithStats,
  CreateServiceAccountInput,
  UpdateServiceAccountInput,
} from '../types/account';

/**
 * Get all service accounts
 */
export async function getAllAccounts(): Promise<ServiceAccount[]> {
  const result = await query<ServiceAccount>(
    'SELECT * FROM service_accounts ORDER BY account_name ASC'
  );
  return result.rows;
}

/**
 * Get all active service accounts
 */
export async function getActiveAccounts(): Promise<ServiceAccount[]> {
  const result = await query<ServiceAccount>(
    'SELECT * FROM service_accounts WHERE is_active = true ORDER BY account_name ASC'
  );
  return result.rows;
}

/**
 * Get account by ID
 */
export async function getAccountById(id: string): Promise<ServiceAccount | null> {
  const result = await query<ServiceAccount>(
    'SELECT * FROM service_accounts WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Get account by account number
 */
export async function getAccountByNumber(
  accountNumber: string
): Promise<ServiceAccount | null> {
  const result = await query<ServiceAccount>(
    'SELECT * FROM service_accounts WHERE account_number = $1',
    [accountNumber]
  );
  return result.rows[0] || null;
}

/**
 * Get accounts with statistics including monthly totals
 */
export async function getAccountsWithStats(): Promise<ServiceAccountWithStats[]> {
  const result = await query<ServiceAccountWithStats>(
    `SELECT 
      sa.id,
      sa.account_number,
      sa.account_name,
      sa.provider,
      sa.description,
      sa.is_active,
      sa.created_at,
      sa.updated_at,
      COUNT(b.id) as total_bills,
      SUM(b.total_due) as total_spending,
      AVG(b.total_due) as avg_bill_amount,
      MAX(b.bill_date) as latest_bill_date,
      (SELECT COUNT(*) FROM alerts WHERE service_account_id = sa.id AND status = 'active') as active_alerts,
      -- Current month total (bills with billing_period_start in current month)
      COALESCE((
        SELECT SUM(b2.total_due)
        FROM bills b2
        WHERE b2.service_account_id = sa.id
        AND DATE_TRUNC('month', b2.billing_period_start) = DATE_TRUNC('month', CURRENT_DATE)
        AND b2.processing_status = 'completed'
      ), 0) as current_month_total,
      -- Previous month total (bills with billing_period_start in previous month)
      COALESCE((
        SELECT SUM(b3.total_due)
        FROM bills b3
        WHERE b3.service_account_id = sa.id
        AND DATE_TRUNC('month', b3.billing_period_start) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND b3.processing_status = 'completed'
      ), 0) as previous_month_total
    FROM service_accounts sa
    LEFT JOIN bills b ON sa.id = b.service_account_id AND b.processing_status = 'completed'
    GROUP BY sa.id, sa.account_number, sa.account_name, sa.provider, sa.description, sa.is_active, sa.created_at, sa.updated_at
    ORDER BY sa.account_name ASC`
  );
  return result.rows;
}

/**
 * Create a new service account
 */
export async function createAccount(
  input: CreateServiceAccountInput
): Promise<ServiceAccount> {
  const { account_number, account_name, provider = 'Dhiraagu', description } = input;

  // Check if account already exists
  const existing = await getAccountByNumber(account_number);
  if (existing) {
    throw new Error(`Account with number ${account_number} already exists`);
  }

  const result = await query<ServiceAccount>(
    `INSERT INTO service_accounts (account_number, account_name, provider, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [account_number, account_name, provider, description || null]
  );

  return result.rows[0];
}

/**
 * Update a service account
 */
export async function updateAccount(
  id: string,
  input: UpdateServiceAccountInput
): Promise<ServiceAccount> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (input.account_name !== undefined) {
    fields.push(`account_name = $${paramCount++}`);
    values.push(input.account_name);
  }

  if (input.provider !== undefined) {
    fields.push(`provider = $${paramCount++}`);
    values.push(input.provider);
  }

  if (input.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(input.description);
  }

  if (input.is_active !== undefined) {
    fields.push(`is_active = $${paramCount++}`);
    values.push(input.is_active);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);

  const result = await query<ServiceAccount>(
    `UPDATE service_accounts
     SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error(`Account with ID ${id} not found`);
  }

  return result.rows[0];
}

/**
 * Delete a service account
 */
export async function deleteAccount(id: string): Promise<void> {
  await query('DELETE FROM service_accounts WHERE id = $1', [id]);
}

/**
 * Check if account number exists
 */
export async function accountExists(accountNumber: string): Promise<boolean> {
  const result = await query(
    'SELECT COUNT(*) as count FROM service_accounts WHERE account_number = $1',
    [accountNumber]
  );
  return parseInt(result.rows[0].count) > 0;
}

/**
 * Auto-register account if it doesn't exist
 * Creates account with basic info, allowing manual update later
 */
export async function autoRegisterAccount(
  accountNumber: string,
  provider: string = 'Dhiraagu'
): Promise<ServiceAccount> {
  // Check if account already exists
  const existing = await getAccountByNumber(accountNumber);
  if (existing) {
    return existing;
  }

  // Create account with auto-generated name
  const accountName = `Auto-registered ${accountNumber}`;
  const description = 'Automatically registered during bill processing. Please update account details.';

  const result = await query<ServiceAccount>(
    `INSERT INTO service_accounts (account_number, account_name, provider, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [accountNumber, accountName, provider, description]
  );

  console.log(`Auto-registered new account: ${accountNumber}`);
  return result.rows[0];
}

/**
 * Get recently added accounts (within specified hours)
 */
export async function getRecentlyAddedAccounts(hours: number = 24): Promise<ServiceAccount[]> {
  const result = await query<ServiceAccount>(
    `SELECT * FROM service_accounts
     WHERE created_at >= NOW() - INTERVAL '1 hour' * $1
     ORDER BY created_at DESC`,
    [hours]
  );
  return result.rows;
}

/**
 * Get monthly totals for an account for the current year
 */
export async function getAccountMonthlyTotals(
  accountId: string,
  year: number = new Date().getFullYear()
): Promise<Array<{ month: number; monthName: string; total: number }>> {
  const result = await query<{ month: number; total: number }>(
    `SELECT 
      EXTRACT(MONTH FROM billing_period_start)::INTEGER as month,
      COALESCE(SUM(total_due), 0) as total
     FROM bills
     WHERE service_account_id = $1
     AND EXTRACT(YEAR FROM billing_period_start) = $2
     AND processing_status = 'completed'
     GROUP BY EXTRACT(MONTH FROM billing_period_start)
     ORDER BY month`,
    [accountId, year]
  );

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Create array with all 12 months, filling in missing months with 0
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthData = result.rows.find((r) => r.month === i + 1);
    return {
      month: i + 1,
      monthName: monthNames[i],
      total: monthData ? parseFloat(monthData.total.toString()) : 0,
    };
  });

  return monthlyData;
}
