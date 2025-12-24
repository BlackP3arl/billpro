export interface Alert {
  id: string;
  bill_id: string;
  service_account_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  current_amount?: number | null;
  previous_amount?: number | null;
  percentage_increase?: number | null;
  threshold_exceeded?: number | null;
  title: string;
  description?: string | null;
  status: AlertStatus;
  acknowledged_at?: Date | null;
  acknowledged_by?: string | null;
  resolved_at?: Date | null;
  resolved_by?: string | null;
  resolution_notes?: string | null;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export type AlertType =
  | 'high_charge'
  | 'new_line_item'
  | 'unusual_usage'
  | 'missing_line_item';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface AlertWithDetails extends Alert {
  invoice_number: string;
  bill_date: Date;
  account_number: string;
  account_name: string;
}

export interface CreateAlertInput {
  bill_id: string;
  service_account_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  current_amount?: number;
  previous_amount?: number;
  percentage_increase?: number;
  threshold_exceeded?: number;
  title: string;
  description?: string;
  metadata?: any;
}
