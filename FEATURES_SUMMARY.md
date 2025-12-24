# BillPro - Feature Summary

## Auto-Registration & Monthly Charge Tracking

### Overview
The system now automatically registers new accounts and tracks monthly charges for each service number across all bills.

---

## Feature 1: Auto-Registration of Accounts

### What It Does
When a bill is scanned and the account number is not found in the database, the system automatically creates a new account entry.

### How It Works
1. Bill is uploaded and processed
2. System checks if account exists
3. If account doesn't exist:
   - Auto-creates account with account number
   - Sets account name as "Auto-registered [account_number]"
   - Adds description: "Automatically registered during bill processing. Please update account details."
   - Provider defaults to "Dhiraagu"
4. Bill is linked to the account (auto-registered or existing)

### Benefits
- No manual account registration required before processing bills
- All bills are automatically linked to accounts
- Alerts and service number tracking work immediately
- Admin can update account details later in the Accounts page

### Implementation
- Function: `autoRegisterAccount()` in [lib/services/account-service.ts](lib/services/account-service.ts:161-184)
- Used in: [app/api/process/route.ts](app/api/process/route.ts:35-43)

---

## Feature 2: Service Number Monthly Charges Tracking

### What It Does
Tracks the monthly charge for each service number from every bill, creating a complete billing history.

### Database Table: `service_number_monthly_charges`

Stores:
- Service number
- Billing period (start/end dates)
- Bill date
- Subscription charges
- Usage charges
- Other charges
- Total charge
- Package name
- Links to service_number, bill, and line_item

### How It Works

**During Bill Processing:**
1. Bill is processed and line items are created
2. Service numbers are registered in the service_numbers registry
3. For each line item, a monthly charge record is created
4. Record includes all charge breakdowns and billing period info

**Viewing Charge History:**
1. Go to Service Numbers page
2. Click on any service number
3. View complete monthly charge history:
   - Summary cards showing totals
   - Detailed table with all billing periods
   - Breakdown of subscription, usage, and other charges
   - Invoice numbers and dates

### Benefits
- Complete billing history for each service number
- Track charge trends over time
- Compare monthly costs
- Identify unusual charges
- Historical reporting and analysis

### Implementation

**Database:**
- Table: `service_number_monthly_charges`
- Migration: [lib/db/add-monthly-charges-table.sql](lib/db/add-monthly-charges-table.sql)
- Schema: [lib/db/schema.sql](lib/db/schema.sql:185-223)

**Backend:**
- Service: [lib/services/monthly-charge-service.ts](lib/services/monthly-charge-service.ts)
- API: [app/api/service-numbers/[serviceNumber]/route.ts](app/api/service-numbers/[serviceNumber]/route.ts)

**Frontend:**
- List: [app/service-numbers/page.tsx](app/service-numbers/page.tsx) - Service numbers are clickable
- Detail: [app/service-numbers/[serviceNumber]/page.tsx](app/service-numbers/[serviceNumber]/page.tsx)

---

## Feature 3: Service Numbers Registry (Enhanced)

### What It Does
Maintains a master registry of all service numbers with tracking of when they were first and last seen.

### Enhancements Made
- Service numbers are now clickable in the list
- Clicking a service number shows its complete monthly charge history
- Account number displayed prominently in monospace font

### How to Use

**View All Service Numbers:**
1. Navigate to `/service-numbers`
2. See all registered service numbers with:
   - Service number
   - Account (name, number, provider)
   - Package name
   - First/last seen dates
   - Active status

**Search and Filter:**
- Search by service number
- Search by account number
- Search by package name
- Filter by active/inactive status

**View Details:**
1. Click any service number in the list
2. See summary cards:
   - Total subscription charges
   - Total usage charges
   - Other charges
   - Grand total
3. View detailed monthly history table
4. See all billing periods and invoices

---

## Complete Bill Processing Flow

```
1. Upload PDF Bill
   ↓
2. AI Extracts Data (account number, line items, charges)
   ↓
3. Check if Account Exists
   ├─ Yes → Use existing account
   └─ No  → Auto-register new account
   ↓
4. Create Bill Record
   ↓
5. Create Line Items
   ↓
6. Register/Update Service Numbers
   ├─ New service number → Register in service_numbers table
   └─ Existing → Update last_seen_date
   ↓
7. Record Monthly Charges
   └─ Create record in service_number_monthly_charges for each line item
   ↓
8. Detect Alerts
   └─ Check for charge increases >20%
   ↓
9. Detect New Service Numbers
   └─ Compare against account's service number history
   ↓
10. Return Results
    ├─ Show processing success
    ├─ Alert if account was auto-registered
    ├─ Show new service numbers detected
    └─ Show alerts generated
```

---

## Testing

### Current Data
- 21 service numbers registered
- 21 monthly charge records
- 1 bill processed
- 1 account

### Test the Features

**Test Auto-Registration:**
Upload a bill with a new account number and verify it auto-creates the account.

**Test Monthly Charges:**
```bash
# View charges for a specific service number
psql billpro -c "SELECT * FROM service_number_monthly_charges WHERE service_number = '7213441';"

# View in UI
1. Go to http://localhost:3000/service-numbers
2. Click on service number "7213441"
3. See monthly charge history
```

**Test Clickable Service Numbers:**
1. Go to `/service-numbers`
2. Click any service number
3. View detailed charge history

---

## Future Bills

When you upload future bills:
1. ✅ Accounts auto-register if new
2. ✅ Service numbers auto-register if new
3. ✅ Monthly charges automatically recorded
4. ✅ New service numbers highlighted
5. ✅ Alerts generated for charge increases
6. ✅ Charge history grows for comparison

---

## Benefits Summary

✅ **No manual setup required** - Accounts auto-register
✅ **Complete billing history** - Track every service number's charges
✅ **Easy navigation** - Click service numbers to view details
✅ **Trend analysis** - Compare monthly charges over time
✅ **Automatic tracking** - Everything happens during bill processing
✅ **Flexible search** - Filter by account, number, or package
✅ **Detailed breakdowns** - See subscription, usage, and other charges separately
