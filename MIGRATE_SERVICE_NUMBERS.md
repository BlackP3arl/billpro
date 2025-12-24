# Service Numbers Registry Migration

## Problem

The service numbers registry feature was implemented in code but the database table was never created. This is why the `/service-numbers` page shows no data.

## What This Does

The `service_numbers` table creates a registry of all service numbers (phone numbers) across all bills, tracking:
- When each service number was first seen
- When it was last seen
- Which account it belongs to
- What package/plan it's on
- Active/inactive status

This is separate from the `line_items` table:
- **`line_items`**: Records every service on every bill (many entries per service number)
- **`service_numbers`**: Registry with ONE entry per unique service number

## Run the Migration

Execute this SQL file to create the table and populate it from existing bills:

```bash
psql billpro < lib/db/add-service-numbers-table.sql
```

Or connect to the database directly:

```bash
psql billpro
```

Then run:

```sql
\i lib/db/add-service-numbers-table.sql
```

## What Happens

1. Creates the `service_numbers` table
2. Creates indexes for fast queries
3. Adds update trigger
4. **Automatically populates** the registry from all existing line items in your bills
5. Shows count of service numbers created

## After Running

1. Refresh the `/service-numbers` page
2. You should now see all service numbers from all your bills
3. Future bill uploads will automatically update this registry
4. New service numbers will be detected and highlighted during bill processing

## Verification

Check that the table was created and populated:

```sql
-- Check table exists
\dt service_numbers

-- Check count
SELECT COUNT(*) FROM service_numbers;

-- View sample data
SELECT service_number, package_name, first_seen_date, is_active
FROM service_numbers
LIMIT 10;

-- View with account details
SELECT
  sn.service_number,
  sa.account_name,
  sa.account_number,
  sn.package_name,
  sn.first_seen_date,
  sn.is_active
FROM service_numbers sn
JOIN service_accounts sa ON sn.service_account_id = sa.id
ORDER BY sn.first_seen_date DESC
LIMIT 10;
```

## Expected Result

You should see all unique service numbers from your bills in the registry. If you've processed bills with 20+ line items, you'll see those unique numbers registered here.
