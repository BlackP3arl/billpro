-- Add Service Numbers Registry Table
-- Run this file to add the service_numbers table to your existing database

-- Service Numbers Registry Table
CREATE TABLE IF NOT EXISTS service_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_number VARCHAR(50) UNIQUE NOT NULL,
  service_account_id UUID REFERENCES service_accounts(id) ON DELETE CASCADE,

  -- Package Information
  package_name VARCHAR(255),

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

CREATE INDEX IF NOT EXISTS idx_service_numbers_number ON service_numbers(service_number);
CREATE INDEX IF NOT EXISTS idx_service_numbers_account ON service_numbers(service_account_id);
CREATE INDEX IF NOT EXISTS idx_service_numbers_active ON service_numbers(is_active);
CREATE INDEX IF NOT EXISTS idx_service_numbers_package ON service_numbers(package_name);

-- Add trigger for updated_at
CREATE TRIGGER update_service_numbers_updated_at BEFORE UPDATE ON service_numbers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Optional: Populate service_numbers from existing line_items
-- This will create registry entries from all existing bills
INSERT INTO service_numbers (service_number, service_account_id, package_name, first_seen_bill_id, last_seen_bill_id, last_seen_date)
SELECT DISTINCT ON (li.service_number)
  li.service_number,
  b.service_account_id,
  li.package_name,
  (SELECT id FROM bills b2
   JOIN line_items li2 ON b2.id = li2.bill_id
   WHERE li2.service_number = li.service_number
   ORDER BY b2.bill_date ASC
   LIMIT 1) as first_bill_id,
  (SELECT id FROM bills b2
   JOIN line_items li2 ON b2.id = li2.bill_id
   WHERE li2.service_number = li.service_number
   ORDER BY b2.bill_date DESC
   LIMIT 1) as last_bill_id,
  NOW()
FROM line_items li
JOIN bills b ON li.bill_id = b.id
WHERE b.service_account_id IS NOT NULL
ON CONFLICT (service_number) DO NOTHING;

SELECT 'Service numbers table created successfully!' as status;
SELECT COUNT(*) as service_numbers_count FROM service_numbers;
