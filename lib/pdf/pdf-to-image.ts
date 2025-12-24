import { fromPath } from 'pdf2pic';
import fs from 'fs/promises';
import path from 'path';

export interface PdfToImageOptions {
  density?: number; // DPI, higher = better quality
  format?: 'png' | 'jpg' | 'jpeg';
  width?: number;
  height?: number;
  savePath?: string;
}

export interface ConversionResult {
  page: number;
  base64: string;
  path?: string;
}

/**
 * Convert PDF to images (one per page)
 */
export async function convertPdfToImages(
  pdfPath: string,
  options: PdfToImageOptions = {}
): Promise<ConversionResult[]> {
  const {
    density = 200,
    format = 'png',
    width = 2400,
    height = 3200,
    savePath = './temp',
  } = options;

  try {
    // Ensure temp directory exists
    await fs.mkdir(savePath, { recursive: true });

    const convert = fromPath(pdfPath, {
      density,
      format,
      width,
      height,
      saveFilename: `page`,
      savePath,
    });

    // Convert all pages (-1 means all pages)
    const result = await convert.bulk(-1, { responseType: 'base64' });

    if (!result || !Array.isArray(result)) {
      throw new Error('Failed to convert PDF pages');
    }

    return result.map((page, index) => ({
      page: index + 1,
      base64: page.base64 || '',
      path: page.path,
    }));
  } catch (error: any) {
    console.error('PDF to image conversion error:', error);
    throw new Error(`Failed to convert PDF to images: ${error.message}`);
  }
}

/**
 * Convert a single PDF page to image
 */
export async function convertPdfPageToImage(
  pdfPath: string,
  pageNumber: number,
  options: PdfToImageOptions = {}
): Promise<string> {
  const {
    density = 200,
    format = 'png',
    width = 2400,
    height = 3200,
    savePath = './temp',
  } = options;

  try {
    await fs.mkdir(savePath, { recursive: true });

    const convert = fromPath(pdfPath, {
      density,
      format,
      width,
      height,
      saveFilename: `page-${pageNumber}`,
      savePath,
    });

    const result = await convert(pageNumber, { responseType: 'base64' });

    if (!result || !result.base64) {
      throw new Error(`Failed to convert page ${pageNumber}`);
    }

    return result.base64;
  } catch (error: any) {
    console.error('PDF page conversion error:', error);
    throw new Error(
      `Failed to convert PDF page ${pageNumber}: ${error.message}`
    );
  }
}

/**
 * Get number of pages in a PDF
 */
export async function getPdfPageCount(pdfPath: string): Promise<number> {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    return pdfDoc.getPageCount();
  } catch (error: any) {
    console.error('Error getting PDF page count:', error);
    throw new Error(`Failed to get PDF page count: ${error.message}`);
  }
}

/**
 * Clean up temporary image files
 */
export async function cleanupTempImages(tempPath: string = './temp'): Promise<void> {
  try {
    const files = await fs.readdir(tempPath);
    await Promise.all(
      files.map((file) => fs.unlink(path.join(tempPath, file)))
    );
  } catch (error: any) {
    console.error('Error cleaning up temp files:', error);
    // Don't throw - cleanup is best effort
  }
}
