import { convertPdfToImages, convertPdfPageToImage, getPdfPageCount, cleanupTempImages } from './pdf-to-image';
import { extractBillData, extractBillDataFromPages, extractInvoiceAndAccount, extractBillHeader, extractLineItemsFromPages, QuickScanResult } from '../ai/bill-extractor';
import { BillExtractionResult, ProcessingProgress } from '../types/bill';
import fs from 'fs/promises';
import path from 'path';

export interface ProcessPdfResult {
  extraction: BillExtractionResult;
  pageCount: number;
  fileSize: number;
}

/**
 * Quick scan: Extract only invoice and account number from first page
 * Used for duplicate detection before full extraction
 * 
 * Strategy:
 * 1. First try offline text extraction (fast, free)
 * 2. If that fails or doesn't find numbers, fall back to AI quick scan
 */
export async function quickScanPdfBill(pdfPath: string): Promise<QuickScanResult> {
  try {
    // Step 1: Try offline text extraction first (fastest, free)
    const { extractNumbersFromPdfFirstPage } = await import('./pdf-text-extractor');
    
    try {
      const extractedNumbers = await extractNumbersFromPdfFirstPage(pdfPath);
      
      // If we found both numbers, return immediately (no AI call needed!)
      if (extractedNumbers.invoiceNumber && extractedNumbers.accountNumber) {
        console.log('Quick scan (offline): Found both numbers via text extraction');
        return {
          invoiceNumber: extractedNumbers.invoiceNumber,
          accountNumber: extractedNumbers.accountNumber,
          confidence: 95, // High confidence for text extraction
        };
      }

      // If we found at least invoice number, that's enough for duplicate check
      if (extractedNumbers.invoiceNumber) {
        console.log('Quick scan (offline): Found invoice number via text extraction');
        return {
          invoiceNumber: extractedNumbers.invoiceNumber,
          accountNumber: extractedNumbers.accountNumber || 'UNKNOWN',
          confidence: extractedNumbers.accountNumber ? 90 : 85,
        };
      }

      console.log('Quick scan (offline): Could not extract numbers, falling back to AI');
    } catch (textExtractionError: any) {
      console.log('Text extraction failed, falling back to AI:', textExtractionError.message);
    }

    // Step 2: Fall back to AI quick scan if text extraction failed or didn't find numbers
    // Convert only first page to image with lower resolution for cost savings
    const firstPageImage = await convertPdfPageToImage(pdfPath, 1, {
      density: 150, // Lower DPI for quick scan (vs 200 for full scan)
      format: 'png',
      width: 1600, // Smaller dimensions for quick scan (vs 2400x3200)
      height: 2200,
    });

    console.log('Quick scan (AI): Converted first page to image');

    // Extract only invoice and account number using AI
    const result = await extractInvoiceAndAccount(firstPageImage);

    console.log('Quick scan (AI) complete:', {
      invoiceNumber: result.invoiceNumber,
      accountNumber: result.accountNumber,
      confidence: result.confidence,
    });

    // Clean up temporary image files
    await cleanupTempImages();

    return result;
  } catch (error: any) {
    console.error('Quick scan error:', error);
    // Try to clean up even on error
    await cleanupTempImages().catch(() => {});
    throw new Error(`Failed to quick scan PDF bill: ${error.message}`);
  }
}

/**
 * Process a PDF bill file - convert to images and extract data
 * Uses batched extraction for large multi-page documents
 */
export async function processPdfBill(
  pdfPath: string,
  options?: {
    batchSize?: number;
    onProgress?: (progress: ProcessingProgress) => void;
  }
): Promise<ProcessPdfResult> {
  const batchSize = options?.batchSize || parseInt(process.env.PDF_BATCH_SIZE || '10', 10);
  const lineItemDpi = parseInt(process.env.PDF_LINE_ITEM_DPI || '150', 10);

  try {
    // Get PDF info
    const stats = await fs.stat(pdfPath);
    const fileSize = stats.size;
    const pageCount = await getPdfPageCount(pdfPath);

    console.log(`Processing PDF: ${pdfPath}, Pages: ${pageCount}, Size: ${fileSize} bytes`);

    let extraction: BillExtractionResult;

    // Determine processing strategy based on page count
    if (pageCount <= 10) {
      // Small PDFs: Use existing single-batch approach
      console.log('Using single-batch extraction (10 pages or less)');

      options?.onProgress?.({
        stage: 'header',
        message: `Processing ${pageCount} page${pageCount > 1 ? 's' : ''}...`,
      });

      const images = await convertPdfToImages(pdfPath, {
        density: 200,
        format: 'png',
        width: 2400,
        height: 3200,
      });

      if (!images || images.length === 0) {
        throw new Error('No images generated from PDF');
      }

      if (images.length === 1) {
        extraction = await extractBillData(images[0].base64);
      } else {
        const base64Images = images.map((img) => img.base64);
        extraction = await extractBillDataFromPages(base64Images);
      }

      await cleanupTempImages();
    } else {
      // Large PDFs: Use batched extraction approach
      console.log(`Using batched extraction (${pageCount} pages)`);

      // Phase 1: Extract header from page 1
      options?.onProgress?.({
        stage: 'header',
        message: 'Extracting header from page 1...',
      });

      console.log('Phase 1: Extracting header from page 1');
      const page1Image = await convertPdfPageToImage(pdfPath, 1, {
        density: 200,
        format: 'png',
        width: 2400,
        height: 3200,
      });

      const headerResult = await extractBillHeader(page1Image);
      console.log(`Header extracted. Invoice: ${headerResult.invoiceNumber}`);

      // Phase 2: Extract line items from remaining pages in batches
      const remainingPages = pageCount - 1; // Exclude page 1
      const totalBatches = Math.ceil(remainingPages / batchSize);

      console.log(`Phase 2: Extracting line items from pages 2-${pageCount} in ${totalBatches} batches`);

      const allLineItems: any[] = [];
      let totalConfidence = headerResult.confidence;
      let confidenceCount = 1;

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchNumber = batchIndex + 1;
        const startPage = 2 + (batchIndex * batchSize); // Page 2 is first line items page
        const endPage = Math.min(startPage + batchSize - 1, pageCount);
        const pagesInBatch = endPage - startPage + 1;

        options?.onProgress?.({
          stage: 'line_items',
          currentBatch: batchNumber,
          totalBatches,
          message: `Processing batch ${batchNumber} of ${totalBatches} (pages ${startPage}-${endPage})...`,
        });

        console.log(`Processing batch ${batchNumber}/${totalBatches}: pages ${startPage}-${endPage}`);

        // Convert batch pages to images with optimized settings
        const batchPageNumbers = Array.from(
          { length: pagesInBatch },
          (_, i) => startPage + i
        );

        const batchImages = await Promise.all(
          batchPageNumbers.map((pageNum) =>
            convertPdfPageToImage(pdfPath, pageNum, {
              density: lineItemDpi,
              format: 'jpg', // Use JPEG for better compression
              width: 1800,
              height: 2400,
            })
          )
        );

        console.log(`Converted ${batchImages.length} pages in batch ${batchNumber}`);

        // Extract line items from this batch
        const batchLineItems = await extractLineItemsFromPages(batchImages);

        if (batchLineItems.length > 0) {
          allLineItems.push(...batchLineItems);
          console.log(`Extracted ${batchLineItems.length} line items from batch ${batchNumber}`);
        } else {
          console.warn(`No line items extracted from batch ${batchNumber}`);
        }

        // Clean up batch images to free memory
        await cleanupTempImages();

        // Track confidence (simple average for now)
        totalConfidence += 90; // Assume 90% confidence for successful batch
        confidenceCount++;
      }

      // Phase 3: Merge results
      console.log(`Merging results: ${allLineItems.length} total line items`);

      extraction = {
        ...headerResult,
        lineItems: allLineItems,
        confidence: Math.round(totalConfidence / confidenceCount),
      };

      console.log(`Batched extraction complete. Total line items: ${allLineItems.length}, Confidence: ${extraction.confidence}%`);
    }

    // Final cleanup
    await cleanupTempImages();

    return {
      extraction,
      pageCount,
      fileSize,
    };
  } catch (error: any) {
    console.error('PDF processing error:', error);
    // Try to clean up even on error
    await cleanupTempImages().catch(() => {});
    throw new Error(`Failed to process PDF bill: ${error.message}`);
  }
}

/**
 * Validate PDF file
 */
export async function validatePdfFile(filePath: string): Promise<void> {
  try {
    // Check if file exists
    await fs.access(filePath);

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.pdf') {
      throw new Error('File must be a PDF');
    }

    // Check file size (max 10MB by default)
    const stats = await fs.stat(filePath);
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (stats.size > maxSize) {
      throw new Error(`File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`);
    }

    if (stats.size === 0) {
      throw new Error('File is empty');
    }

    // Try to load PDF to verify it's valid
    const { PDFDocument } = await import('pdf-lib');
    const pdfBuffer = await fs.readFile(filePath);
    await PDFDocument.load(pdfBuffer);
  } catch (error: any) {
    throw new Error(`Invalid PDF file: ${error.message}`);
  }
}

/**
 * Save uploaded file to storage
 */
export async function saveUploadedFile(
  fileBuffer: Buffer,
  originalName: string,
  destinationPath: string = './public/uploads'
): Promise<string> {
  try {
    // Ensure destination directory exists
    await fs.mkdir(destinationPath, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const fileName = `${timestamp}_${randomStr}_${baseName}${ext}`;

    const filePath = path.join(destinationPath, fileName);

    // Write file
    await fs.writeFile(filePath, fileBuffer);

    return filePath;
  } catch (error: any) {
    throw new Error(`Failed to save uploaded file: ${error.message}`);
  }
}

/**
 * Move file from uploads to processed folder
 */
export async function moveToProcessed(
  sourceFilePath: string,
  processedPath: string = './public/processed'
): Promise<string> {
  try {
    await fs.mkdir(processedPath, { recursive: true });

    const fileName = path.basename(sourceFilePath);
    const destinationPath = path.join(processedPath, fileName);

    await fs.rename(sourceFilePath, destinationPath);

    return destinationPath;
  } catch (error: any) {
    throw new Error(`Failed to move file to processed: ${error.message}`);
  }
}
