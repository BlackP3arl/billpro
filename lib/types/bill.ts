export interface Bill {
  id: string;
  service_account_id: string | null;
  invoice_number: string;
  account_number: string;
  billing_period_start: Date;
  billing_period_end: Date;
  bill_date: Date;
  due_date?: Date | null;
  current_charges: number;
  outstanding_amount: number;
  gst_amount: number;
  total_due: number;
  discounts: number;
  previous_bill_amount?: number | null;
  payment_received?: number | null;
  file_path: string;
  file_name: string;
  file_size_bytes?: number | null;
  processing_status: BillProcessingStatus;
  extraction_confidence?: number | null;
  extracted_data?: any;
  requires_review: boolean;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
  processed_at?: Date | null;
}

export type BillProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'review_required';

export interface BillExtractionResult {
  accountNumber: string;
  invoiceNumber: string;
  billingPeriodStart: string; // YYYY-MM-DD
  billingPeriodEnd: string; // YYYY-MM-DD
  billDate: string; // YYYY-MM-DD
  currentCharges: number;
  outstanding: number;
  totalDue: number;
  gstAmount: number;
  lineItems: LineItemExtraction[];
  confidence: number; // 0-100
  dueDate?: string;
}

export interface LineItemExtraction {
  serviceNumber: string;
  packageName: string;
  subscriptionCharge: number;
  usageCharges: number;
  totalCharge: number;
  servicePeriodStart?: string;
  servicePeriodEnd?: string;
  usageDetails?: any;
}

export interface BillWithAccount extends Bill {
  account_name: string;
  provider: string;
  line_item_count: number;
  active_alert_count: number;
}

export interface BillComparison {
  currentBill: Bill;
  previousBill: Bill | null;
  difference: number;
  percentageChange: number;
  hasIncreased: boolean;
  newLineItems: string[];
  removedLineItems: string[];
}
