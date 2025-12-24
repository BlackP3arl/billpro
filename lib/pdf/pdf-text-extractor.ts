import fs from 'fs/promises';
import pdfParse from 'pdf-parse';

export interface ExtractedNumbers {
  invoiceNumber?: string;
  accountNumber?: string;
}

/**
 * Extract text from PDF and find invoice/account numbers using regex
 * This is much faster than OCR/AI and works for PDFs with selectable text
 * Focuses on first ~3000 characters which typically contain header info
 */
export async function extractNumbersFromPdfFirstPage(
  pdfPath: string
): Promise<ExtractedNumbers> {
  try {
    const pdfBuffer = await fs.readFile(pdfPath);
    const data = await pdfParse(pdfBuffer);
    
    // Get text content (first 3000 chars should contain header with invoice/account info)
    const fullText = data.text || '';
    const headerText = fullText.substring(0, 3000).toUpperCase();

    console.log('Extracted text (first 300 chars):', headerText.substring(0, 300));

    // Extract invoice number - common patterns for Dhiraagu/Ooredoo bills:
    // B1-123456, B1-176644802, Invoice: B1-123456, Invoice No: B1-123456
    const invoicePatterns = [
      /\b(B\d+[-]\d{6,12})\b/i,  // B1-176644802 format
      /\b(?:INVOICE|BILL)\s*(?:NO|NUMBER|#)?[:\s]*([B]\d+[-]?\d{6,12})\b/i,
      /\b(?:INVOICE|BILL)\s*(?:NO|NUMBER|#)?[:\s]*([A-Z]{1,3}[-]?\d{6,12})\b/i,
    ];

    // Extract account number - common patterns:
    // BA11639924, BA117906194, Account: BA11639924, Account No: BA11639924
    const accountPatterns = [
      /\b(BA\d{8,12})\b/i,  // BA11639924 format (most common)
      /\b(?:ACCOUNT|SERVICE\s*ACCOUNT)\s*(?:NO|NUMBER|#)?[:\s]*([B][A]\d{8,12})\b/i,
      /\b(?:ACCOUNT|SERVICE\s*ACCOUNT)\s*(?:NO|NUMBER|#)?[:\s]*([A-Z]{2}\d{8,12})\b/i,
    ];

    let invoiceNumber: string | undefined;
    let accountNumber: string | undefined;

    // Try to find invoice number
    for (const pattern of invoicePatterns) {
      const matches = headerText.match(pattern);
      if (matches && matches[1]) {
        invoiceNumber = matches[1].trim();
        // Clean up - remove any trailing spaces or special chars
        invoiceNumber = invoiceNumber.replace(/[^\w-]/g, '');
        if (invoiceNumber.length >= 6) { // Valid invoice numbers are usually 6+ chars
          break;
        }
      }
    }

    // Try to find account number
    for (const pattern of accountPatterns) {
      const matches = headerText.match(pattern);
      if (matches && matches[1]) {
        accountNumber = matches[1].trim();
        // Clean up - remove any trailing spaces or special chars
        accountNumber = accountNumber.replace(/[^\w]/g, '');
        if (accountNumber.length >= 8) { // Valid account numbers are usually 8+ chars
          break;
        }
      }
    }

    return {
      invoiceNumber: invoiceNumber || undefined,
      accountNumber: accountNumber || undefined,
    };
  } catch (error: any) {
    console.error('PDF text extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}
