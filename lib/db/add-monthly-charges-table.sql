-- Add Service Number Monthly Charges Table
-- This table tracks the monthly charge for each service number from each bill

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

CREATE INDEX IF NOT EXISTS idx_monthly_charges_service_number_id ON service_number_monthly_charges(service_number_id);
CREATE INDEX IF NOT EXISTS idx_monthly_charges_service_number ON service_number_monthly_charges(service_number);
CREATE INDEX IF NOT EXISTS idx_monthly_charges_bill ON service_number_monthly_charges(bill_id);
CREATE INDEX IF NOT EXISTS idx_monthly_charges_period ON service_number_monthly_charges(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_monthly_charges_bill_date ON service_number_monthly_charges(bill_date DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_service_number_monthly_charges_updated_at
BEFORE UPDATE ON service_number_monthly_charges
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Populate from existing data
INSERT INTO service_number_monthly_charges (
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
)
SELECT
  sn.id as service_number_id,
  li.bill_id,
  li.id as line_item_id,
  li.service_number,
  b.billing_period_start,
  b.billing_period_end,
  b.bill_date,
  li.subscription_charge,
  li.usage_charges,
  li.other_charges,
  li.total_charge,
  li.package_name
FROM line_items li
JOIN bills b ON li.bill_id = b.id
JOIN service_numbers sn ON li.service_number = sn.service_number
ON CONFLICT (service_number, bill_id) DO NOTHING;

SELECT 'Monthly charges table created and populated!' as status;
SELECT COUNT(*) as monthly_charges_count FROM service_number_monthly_charges;
