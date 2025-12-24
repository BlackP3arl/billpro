import anthropic, { getAnthropicModel } from './anthropic-client';
import { BILL_EXTRACTION_PROMPT } from './prompts';
import { BillExtractionResult } from '../types/bill';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Extract bill data from PDF image using Claude Vision API
 */
export async function extractBillData(
  imageBase64: string,
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png'
): Promise<BillExtractionResult> {
  try {
    const message = await anthropic.messages.create({
      model: getAnthropicModel(),
      max_tokens: 4000,
      temperature: 0.1, // Low temperature for consistency
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: BILL_EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract text content from response
    const textContent = message.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    // Parse JSON response
    let jsonText = textContent.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const extracted: BillExtractionResult = JSON.parse(jsonText);

    // Validate extracted data
    validateExtractionResult(extracted);

    return extracted;
  } catch (error: any) {
    console.error('Bill extraction error:', error);
    throw new Error(`Failed to extract bill data: ${error.message}`);
  }
}

/**
 * Extract bill data from multiple pages (for multi-page PDFs)
 */
export async function extractBillDataFromPages(
  imagesBase64: string[],
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png'
): Promise<BillExtractionResult> {
  try {
    // For multi-page bills, send all images to Claude
    const imageBlocks = imagesBase64.map((imageData) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: mediaType,
        data: imageData,
      },
    }));

    const message = await anthropic.messages.create({
      model: getAnthropicModel(),
      max_tokens: 4000,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            {
              type: 'text',
              text:
                BILL_EXTRACTION_PROMPT +
                '\n\nNOTE: This bill has multiple pages. Extract information from ALL pages.',
            },
          ],
        },
      ],
    });

    const textContent = message.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    let jsonText = textContent.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const extracted: BillExtractionResult = JSON.parse(jsonText);
    validateExtractionResult(extracted);

    return extracted;
  } catch (error: any) {
    console.error('Multi-page bill extraction error:', error);
    throw new Error(
      `Failed to extract bill data from pages: ${error.message}`
    );
  }
}

/**
 * Validate extraction result has required fields
 */
function validateExtractionResult(result: BillExtractionResult): void {
  const requiredFields = [
    'accountNumber',
    'invoiceNumber',
    'billingPeriodStart',
    'billingPeriodEnd',
    'billDate',
    'currentCharges',
    'outstanding',
    'totalDue',
    'gstAmount',
    'lineItems',
    'confidence',
  ];

  for (const field of requiredFields) {
    if (!(field in result)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate line items
  if (!Array.isArray(result.lineItems)) {
    throw new Error('lineItems must be an array');
  }

  // Validate confidence score
  if (
    typeof result.confidence !== 'number' ||
    result.confidence < 0 ||
    result.confidence > 100
  ) {
    throw new Error('confidence must be a number between 0 and 100');
  }

  // Validate dates format (YYYY-MM-DD)
  const dateFields = ['billingPeriodStart', 'billingPeriodEnd', 'billDate'];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  for (const field of dateFields) {
    const value = (result as any)[field];
    if (value && !dateRegex.test(value)) {
      throw new Error(`${field} must be in YYYY-MM-DD format`);
    }
  }

  // Validate numeric fields
  const numericFields = [
    'currentCharges',
    'outstanding',
    'totalDue',
    'gstAmount',
  ];
  for (const field of numericFields) {
    const value = (result as any)[field];
    if (typeof value !== 'number') {
      throw new Error(`${field} must be a number`);
    }
  }
}
