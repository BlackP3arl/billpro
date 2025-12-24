export const BILL_EXTRACTION_PROMPT = `Analyze this ISP/telecom bill image and extract structured data in JSON format.

IMPORTANT INSTRUCTIONS:
1. Extract ALL information accurately from the bill
2. For line items, include EVERY service/phone number listed in the bill
3. All monetary amounts should be numbers (not strings)
4. All dates should be in YYYY-MM-DD format
5. Return ONLY valid JSON - no markdown, no explanations

Required JSON structure:
{
  "accountNumber": "string - unique account/service number",
  "invoiceNumber": "string - bill invoice number",
  "billingPeriodStart": "YYYY-MM-DD",
  "billingPeriodEnd": "YYYY-MM-DD",
  "billDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD or null",
  "currentCharges": number,
  "outstanding": number,
  "totalDue": number,
  "gstAmount": number,
  "lineItems": [
    {
      "serviceNumber": "string - phone/SIM number",
      "packageName": "string - subscription package name",
      "subscriptionCharge": number,
      "usageCharges": number,
      "totalCharge": number,
      "servicePeriodStart": "YYYY-MM-DD or null",
      "servicePeriodEnd": "YYYY-MM-DD or null",
      "usageDetails": {
        // Optional: voice minutes, data GB, SMS count, etc.
      }
    }
  ],
  "confidence": number (0-100, your confidence in the extraction accuracy)
}

CRITICAL:
- Extract ALL line items from the bill (every phone number/service)
- Be precise with numbers - use exact amounts from the bill
- If a field is not clearly visible, use null or 0 as appropriate
- Your confidence score should reflect extraction certainty`;

export const BILL_VALIDATION_PROMPT = `Review this extracted bill data and the original bill image.

Verify:
1. Account number is correct
2. Invoice number matches
3. All dates are accurate
4. All monetary amounts match the bill
5. All line items are included
6. Calculations are correct (line items should sum to totals)

Return JSON:
{
  "isValid": boolean,
  "errors": ["array of error messages if any"],
  "warnings": ["array of warnings if any"],
  "confidence": number (0-100)
}`;

export const QUICK_SCAN_PROMPT = `Analyze ONLY the first page of this bill and extract just the invoice number and account number.

Return ONLY valid JSON - no markdown, no explanations:
{
  "invoiceNumber": "string - bill invoice number",
  "accountNumber": "string - account/service number",
  "confidence": number (0-100, your confidence in the extraction)
}

Focus only on finding these two fields. Ignore all other information.`;
