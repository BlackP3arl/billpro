export interface ServiceAccount {
  id: string;
  account_number: string;
  account_name: string;
  provider: string;
  description?: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ServiceAccountWithStats extends ServiceAccount {
  total_bills: number;
  total_spending: number;
  avg_bill_amount: number;
  latest_bill_date: Date | null;
  active_alerts: number;
}

export interface CreateServiceAccountInput {
  account_number: string;
  account_name: string;
  provider?: string;
  description?: string;
}

export interface UpdateServiceAccountInput {
  account_name?: string;
  provider?: string;
  description?: string;
  is_active?: boolean;
}
