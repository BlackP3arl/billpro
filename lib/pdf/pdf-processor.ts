import { convertPdfToImages, getPdfPageCount, cleanupTempImages } from './pdf-to-image';
import { extractBillData, extractBillDataFromPages } from '../ai/bill-extractor';
import { BillExtractionResult } from '../types/bill';
import fs from 'fs/promises';
import path from 'path';

export interface ProcessPdfResult {
  extraction: BillExtractionResult;
  pageCount: number;
  fileSize: number;
}

/**
 * Process a PDF bill file - convert to images and extract data
 */
export async function processPdfBill(pdfPath: string): Promise<ProcessPdfResult> {
  try {
    // Get PDF info
    const stats = await fs.stat(pdfPath);
    const fileSize = stats.size;
    const pageCount = await getPdfPageCount(pdfPath);

    console.log(`Processing PDF: ${pdfPath}, Pages: ${pageCount}, Size: ${fileSize} bytes`);

    // Convert PDF to images
    const images = await convertPdfToImages(pdfPath, {
      density: 200,
      format: 'png',
      width: 2400,
      height: 3200,
    });

    if (!images || images.length === 0) {
      throw new Error('No images generated from PDF');
    }

    console.log(`Converted ${images.length} pages to images`);

    // Extract data using Claude Vision
    let extraction: BillExtractionResult;

    if (images.length === 1) {
      // Single page - simpler extraction
      extraction = await extractBillData(images[0].base64);
    } else {
      // Multiple pages - send all pages to Claude
      const base64Images = images.map((img) => img.base64);
      extraction = await extractBillDataFromPages(base64Images);
    }

    console.log(`Extraction complete. Confidence: ${extraction.confidence}%`);

    // Clean up temporary image files
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
