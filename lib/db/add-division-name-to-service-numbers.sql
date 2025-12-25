-- Add division_name field to service_numbers table
-- This field stores which division of MTCC is using the service

ALTER TABLE service_numbers 
ADD COLUMN IF NOT EXISTS division_name VARCHAR(255);

-- Add index for faster queries by division
CREATE INDEX IF NOT EXISTS idx_service_numbers_division ON service_numbers(division_name);

-- Add comment to document the field
COMMENT ON COLUMN service_numbers.division_name IS 'Division of MTCC using this service number';

