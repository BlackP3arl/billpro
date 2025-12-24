export interface LineItem {
  id: string;
  bill_id: string;
  service_number: string;
  service_type?: string | null;
  package_name: string;
  package_description?: string | null;
  subscription_charge: number;
  usage_charges: number;
  other_charges: number;
  total_charge: number;
  usage_details?: any;
  service_period_start?: Date | null;
  service_period_end?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateLineItemInput {
  bill_id: string;
  service_number: string;
  service_type?: string;
  package_name: string;
  package_description?: string;
  subscription_charge: number;
  usage_charges: number;
  other_charges?: number;
  total_charge: number;
  usage_details?: any;
  service_period_start?: Date;
  service_period_end?: Date;
}

export interface LineItemComparison {
  serviceNumber: string;
  packageName: string;
  currentCharge: number;
  previousCharge?: number;
  difference?: number;
  percentageChange?: number;
  status: 'new' | 'removed' | 'unchanged' | 'increased' | 'decreased';
}
