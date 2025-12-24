# BillPro System Test Guide

## Quick System Test

Follow these steps to verify everything works:

### 1. ✅ Check Server is Running
- Server should be at: http://localhost:3001
- Open in browser - you should see the BillPro home page

### 2. ✅ Test Database Connection
```bash
psql billpro -c "SELECT COUNT(*) FROM service_accounts;"
```
Expected: Should return a count (0 if no accounts yet)

### 3. ✅ Register First Service Account

**Via Web Interface:**
1. Go to http://localhost:3001/accounts
2. Click "Add Account"
3. Fill in:
   - Account Number: `BA11639924`
   - Account Name: `MTCC Test Account`
   - Provider: `Dhiraagu`
   - Description: `Test account for sample bill`
4. Click "Register Account"
5. You should see the account appear in the list

**Via Database (Alternative):**
```bash
psql billpro << EOF
INSERT INTO service_accounts (account_number, account_name, provider, description)
VALUES ('BA11639924', 'MTCC Test Account', 'Dhiraagu', 'Test account for sample bill');
EOF
```

### 4. ✅ Upload and Process Sample Bill

1. Go to http://localhost:3001/upload
2. Drag and drop the sample bill: `docs/57_18016895616018_BA11639924_B1-176644802.pdf`
3. Click "Upload and Process"
4. Wait 10-15 seconds for processing
5. You should see:
   - ✅ "Processing Complete!" message
   - Invoice number: B1-176644802
   - Account: BA11639924
   - Total Due: MVR 16,069.16
   - Line Items: 21
   - Confidence: 90%+ (varies)

### 5. ✅ Verify Data in Database

```bash
# Check bill was created
psql billpro -c "SELECT invoice_number, account_number, total_due, extraction_confidence FROM bills ORDER BY created_at DESC LIMIT 1;"

# Check line items were created
psql billpro -c "SELECT COUNT(*) FROM line_items WHERE bill_id = (SELECT id FROM bills ORDER BY created_at DESC LIMIT 1);"

# Expected: Should show 21 line items
```

### 6. ✅ View Bills List

1. Go to http://localhost:3001/bills
2. You should see your uploaded bill in the list
3. Check that it shows:
   - Account name
   - Invoice number
   - Date range
   - Total amount
   - Line item count

### 7. ✅ Test Alert System

Upload a second bill with higher charges to test alerts:

1. Register another account (BA11790694) or use same account
2. Upload the second sample bill: `docs/B1-180418655.pdf`
3. If using same account and charges > 20% higher, an alert should be generated

Check for alerts:
```bash
psql billpro -c "SELECT * FROM v_active_alerts;"
```

### 8. ✅ Test API Endpoints

**Get all bills:**
```bash
curl http://localhost:3001/api/bills?summary=true | jq
```

**Get all accounts:**
```bash
curl http://localhost:3001/api/accounts?stats=true | jq
```

**Get active alerts:**
```bash
curl http://localhost:3001/api/alerts?active=true | jq
```

---

## Expected Results

### After uploading first bill:
- ✅ Bill appears in database
- ✅ 21 line items created
- ✅ Bill shows in /bills page
- ✅ Account statistics updated
- ✅ No alerts (first bill for account)

### Sample Extraction Output:
```json
{
  "accountNumber": "BA11639924",
  "invoiceNumber": "B1-176644802",
  "billingPeriodStart": "2025-09-01",
  "billingPeriodEnd": "2025-09-30",
  "billDate": "2025-09-30",
  "currentCharges": 14878.67,
  "outstanding": 0,
  "totalDue": 16069.16,
  "gstAmount": 1190.49,
  "lineItems": [
    {
      "serviceNumber": "7951234",
      "packageName": "Postpaid 150",
      "subscriptionCharge": 150,
      "usageCharges": 25.50,
      "totalCharge": 175.50
    },
    // ... 20 more items
  ],
  "confidence": 95
}
```

---

## Troubleshooting Tests

### Upload Fails
- Check file is PDF
- Verify file size < 10MB
- Check uploads folder exists: `ls -la public/uploads/`

### Processing Fails
- Verify Anthropic API key: `cat .env.local | grep ANTHROPIC`
- Check server logs in terminal
- Ensure GraphicsMagick installed: `gm version`

### No Data in Database
- Check database connection: `psql billpro -c "SELECT NOW();"`
- Verify bill_service imports are correct
- Check server logs for errors

### Low Confidence Score (<80%)
- Normal for some bills
- Check if PDF is clear/readable
- Scanned images may have lower accuracy

---

## Quick Health Check Script

Run this to check overall system health:

```bash
#!/bin/bash

echo "=== BillPro System Health Check ==="
echo ""

# Check database
echo "✓ Testing database connection..."
psql billpro -c "SELECT 'Database OK' as status;" -t | grep -q "Database OK" && echo "  ✅ Database connected" || echo "  ❌ Database connection failed"

# Check tables
echo "✓ Checking tables..."
TABLE_COUNT=$(psql billpro -c "\dt" -t | wc -l | tr -d ' ')
echo "  ✅ Found $TABLE_COUNT tables"

# Check API server
echo "✓ Checking API server..."
curl -s http://localhost:3001/api/bills > /dev/null && echo "  ✅ API server responding" || echo "  ❌ API server not responding"

# Check accounts
echo "✓ Checking accounts..."
ACCOUNT_COUNT=$(psql billpro -c "SELECT COUNT(*) FROM service_accounts;" -t | tr -d ' ')
echo "  ℹ️  $ACCOUNT_COUNT account(s) registered"

# Check bills
echo "✓ Checking bills..."
BILL_COUNT=$(psql billpro -c "SELECT COUNT(*) FROM bills;" -t | tr -d ' ')
echo "  ℹ️  $BILL_COUNT bill(s) processed"

# Check alerts
echo "✓ Checking alerts..."
ALERT_COUNT=$(psql billpro -c "SELECT COUNT(*) FROM alerts WHERE status='active';" -t | tr -d ' ')
echo "  ℹ️  $ALERT_COUNT active alert(s)"

echo ""
echo "=== System Status: READY ==="
```

Save as `check-health.sh`, make executable (`chmod +x check-health.sh`), and run.

---

## Success Criteria

System is working correctly if:
- ✅ Database queries return results
- ✅ Server responds to HTTP requests
- ✅ PDF uploads successfully
- ✅ AI extraction returns structured data
- ✅ Data appears in database
- ✅ UI pages load without errors
- ✅ Bills show in /bills page
- ✅ Accounts show in /accounts page

**If all tests pass, your system is fully operational! 🎉**
