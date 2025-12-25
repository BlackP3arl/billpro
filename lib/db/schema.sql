-- BillPro Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Service Accounts Table
CREATE TABLE IF NOT EXISTS service_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_number VARCHAR(50) UNIQUE NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL DEFAULT 'Dhiraagu',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_accounts_number ON service_accounts(account_number);
CREATE INDEX idx_service_accounts_active ON service_accounts(is_active);

-- Bills Table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_account_id UUID REFERENCES service_accounts(id) ON DELETE CASCADE,

  -- Bill Identifiers
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  account_number VARCHAR(50) NOT NULL,

  -- Dates
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  bill_date DATE NOT NULL,
  due_date DATE,

  -- Financial Data
  current_charges DECIMAL(12, 2) NOT NULL,
  outstanding_amount DECIMAL(12, 2) DEFAULT 0,
  gst_amount DECIMAL(12, 2) DEFAULT 0,
  total_due DECIMAL(12, 2) NOT NULL,
  discounts DECIMAL(12, 2) DEFAULT 0,

  -- Previous Period Data (for context)
  previous_bill_amount DECIMAL(12, 2),
  payment_received DECIMAL(12, 2),

  -- File Information
  file_path VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes INTEGER,

  -- Processing Status
  processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, review_required
  extraction_confidence DECIMAL(5, 2), -- AI confidence score (0-100)

  -- AI Extracted Raw Data (JSONB for flexibility)
  extracted_data JSONB,

  -- Flags
  requires_review BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE INDEX idx_bills_account ON bills(service_account_id);
CREATE INDEX idx_bills_invoice ON bills(invoice_number);
CREATE INDEX idx_bills_account_number ON bills(account_number);
CREATE INDEX idx_bills_period ON bills(billing_period_start, billing_period_end);
CREATE INDEX idx_bills_status ON bills(processing_status);
CREATE INDEX idx_bills_date ON bills(bill_date DESC);

-- Line Items Table
CREATE TABLE IF NOT EXISTS line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,

  -- Service Identifier
  service_number VARCHAR(50) NOT NULL, -- phone number, SIM number, etc.
  service_type VARCHAR(100), -- 'postpaid_mobile', 'data_sim', 'broadband', etc.

  -- Package Information
  package_name VARCHAR(255),
  package_description TEXT,

  -- Charges
  subscription_charge DECIMAL(10, 2) DEFAULT 0,
  usage_charges DECIMAL(10, 2) DEFAULT 0,
  other_charges DECIMAL(10, 2) DEFAULT 0,
  total_charge DECIMAL(10, 2) NOT NULL,

  -- Usage Details (JSONB for flexibility)
  usage_details JSONB, -- voice minutes, data usage, SMS, etc.

  -- Period
  service_period_start DATE,
  service_period_end DATE,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_line_items_bill ON line_items(bill_id);
CREATE INDEX idx_line_items_service ON line_items(service_number);
CREATE INDEX idx_line_items_package ON line_items(package_name);

-- Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  service_account_id UUID NOT NULL REFERENCES service_accounts(id) ON DELETE CASCADE,

  -- Alert Details
  alert_type VARCHAR(50) NOT NULL, -- 'high_charge', 'new_line_item', 'unusual_usage', 'missing_line_item'
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'

  -- Comparison Data
  current_amount DECIMAL(12, 2),
  previous_amount DECIMAL(12, 2),
  percentage_increase DECIMAL(8, 2),
  threshold_exceeded DECIMAL(5, 2), -- What threshold was exceeded

  -- Alert Message
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'dismissed'
  acknowledged_at TIMESTAMP,
  acknowledged_by VARCHAR(100),
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(100),
  resolution_notes TEXT,

  -- Additional Context
  metadata JSONB,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_bill ON alerts(bill_id);
CREATE INDEX idx_alerts_account ON alerts(service_account_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_type ON alerts(alert_type);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- Service Numbers Registry Table
CREATE TABLE IF NOT EXISTS service_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_number VARCHAR(50) UNIQUE NOT NULL,
  service_account_id UUID REFERENCES service_accounts(id) ON DELETE CASCADE,

  -- Package Information
  package_name VARCHAR(255),

  -- Organization Information
  division_name VARCHAR(255), -- Division of MTCC using this service

  -- Tracking
  first_seen_bill_id UUID REFERENCES bills(id),
  first_seen_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen_bill_id UUID REFERENCES bills(id),
  last_seen_date TIMESTAMP,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_numbers_number ON service_numbers(service_number);
CREATE INDEX idx_service_numbers_account ON service_numbers(service_account_id);
CREATE INDEX idx_service_numbers_active ON service_numbers(is_active);
CREATE INDEX idx_service_numbers_package ON service_numbers(package_name);
CREATE INDEX idx_service_numbers_division ON service_numbers(division_name);

-- Service Number Monthly Charges Table
CREATE TABLE IF NOT EXISTS service_number_monthly_charges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  service_number_id UUID NOT NULL REFERENCES service_numbers(id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  line_item_id UUID NOT NULL REFERENCES line_items(id) ON DELETE CASCADE,

  -- Service identification
  service_number VARCHAR(50) NOT NULL,

  -- Billing period
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  bill_date DATE NOT NULL,

  -- Charges breakdown
  subscription_charge DECIMAL(10, 2) DEFAULT 0,
  usage_charges DECIMAL(10, 2) DEFAULT 0,
  other_charges DECIMAL(10, 2) DEFAULT 0,
  total_charge DECIMAL(10, 2) NOT NULL,

  -- Package info (for history)
  package_name VARCHAR(255),

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one charge record per service number per bill
  UNIQUE(service_number, bill_id)
);

CREATE INDEX idx_monthly_charges_service_number_id ON service_number_monthly_charges(service_number_id);
CREATE INDEX idx_monthly_charges_service_number ON service_number_monthly_charges(service_number);
CREATE INDEX idx_monthly_charges_bill ON service_number_monthly_charges(bill_id);
CREATE INDEX idx_monthly_charges_period ON service_number_monthly_charges(billing_period_start, billing_period_end);
CREATE INDEX idx_monthly_charges_bill_date ON service_number_monthly_charges(bill_date DESC);

-- Application Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  value_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_app_settings_key ON app_settings(key);
CREATE INDEX idx_app_settings_category ON app_settings(category);

-- Default settings
INSERT INTO app_settings (key, value, value_type, description, category) VALUES
  ('alert_threshold_percentage', '20', 'number', 'Percentage increase threshold for high charge alerts', 'alerts'),
  ('enable_auto_processing', 'true', 'boolean', 'Automatically process bills upon upload', 'processing'),
  ('retention_days', '730', 'number', 'Days to retain bill files (2 years default)', 'storage'),
  ('max_upload_size_mb', '10', 'number', 'Maximum upload file size in MB', 'uploads'),
  ('anthropic_model', 'claude-3-5-sonnet-20241022', 'string', 'Anthropic model for bill extraction', 'ai')
ON CONFLICT (key) DO NOTHING;

-- Audit Log Table (optional but recommended)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL, -- 'bill', 'account', 'line_item', 'alert', etc.
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'verify', 'acknowledge', etc.
  changes JSONB, -- Before/after data
  performed_by VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_service_accounts_updated_at BEFORE UPDATE ON service_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_line_items_updated_at BEFORE UPDATE ON line_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_numbers_updated_at BEFORE UPDATE ON service_numbers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_number_monthly_charges_updated_at BEFORE UPDATE ON service_number_monthly_charges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries

-- View: Bill Summary with Account Info
CREATE OR REPLACE VIEW v_bills_summary AS
SELECT
    b.id,
    b.invoice_number,
    b.bill_date,
    b.billing_period_start,
    b.billing_period_end,
    b.total_due,
    b.processing_status,
    b.requires_review,
    sa.account_number,
    sa.account_name,
    sa.provider,
    (SELECT COUNT(*) FROM line_items WHERE bill_id = b.id) as line_item_count,
    (SELECT COUNT(*) FROM alerts WHERE bill_id = b.id AND status = 'active') as active_alert_count
FROM bills b
LEFT JOIN service_accounts sa ON b.service_account_id = sa.id
ORDER BY b.bill_date DESC;

-- View: Active Alerts with Details
CREATE OR REPLACE VIEW v_active_alerts AS
SELECT
    a.id,
    a.alert_type,
    a.severity,
    a.title,
    a.description,
    a.percentage_increase,
    a.current_amount,
    a.previous_amount,
    a.created_at,
    b.invoice_number,
    b.bill_date,
    sa.account_number,
    sa.account_name
FROM alerts a
JOIN bills b ON a.bill_id = b.id
JOIN service_accounts sa ON a.service_account_id = sa.id
WHERE a.status = 'active'
ORDER BY
    CASE a.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
    END,
    a.created_at DESC;

-- View: Account Statistics
CREATE OR REPLACE VIEW v_account_stats AS
SELECT
    sa.id,
    sa.account_number,
    sa.account_name,
    sa.provider,
    COUNT(b.id) as total_bills,
    SUM(b.total_due) as total_spending,
    AVG(b.total_due) as avg_bill_amount,
    MAX(b.bill_date) as latest_bill_date,
    (SELECT COUNT(*) FROM alerts WHERE service_account_id = sa.id AND status = 'active') as active_alerts
FROM service_accounts sa
LEFT JOIN bills b ON sa.id = b.service_account_id
GROUP BY sa.id, sa.account_number, sa.account_name, sa.provider;
