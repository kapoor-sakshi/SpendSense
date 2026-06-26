import fs from 'fs';
import path from 'path';
import os from 'os';
import { createCanvas } from '@napi-rs/canvas';

export type OcrProgressStep =
  | 'Uploading'
  | 'Reading PDF'
  | 'Running OCR'
  | 'Extracting Transactions'
  | 'Analyzing'
  | 'Completed';

export interface OcrExtractionResult {
  text: string;
  parseMethod: string;
  ocrConfidence: number;
  progressLog: string[];
  usedOcr: boolean;
  pageCount: number;
}

const MIN_TEXT_LENGTH = 100;

function logStep(log: string[], step: string, onProgress?: (s: OcrProgressStep) => void, progressStep?: OcrProgressStep) {
  log.push(`[${new Date().toISOString()}] ${step}`);
  console.log(`[BankStatementOCR] ${step}`);
  if (progressStep && onProgress) onProgress(progressStep);
}

async function extractPdfTextWithParse(filePath: string): Promise<string> {
  try {
    const { PDFParse } = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return (result?.text || '').trim();
  } catch (err) {
    console.warn('[BankStatementOCR] pdf-parse failed:', err);
    return '';
  }
}

async function renderPdfWithPdfJs(filePath: string): Promise<Buffer[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const images: Buffer[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2.5 });
    const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
    const context = canvas.getContext('2d');
    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport
    }).promise;
    images.push(canvas.toBuffer('image/png'));
  }
  return images;
}

async function renderPdfWithPoppler(filePath: string, outDir: string): Promise<string[]> {
  const pdf = require('pdf-poppler');
  const opts = {
    format: 'png',
    out_dir: outDir,
    out_prefix: 'stmt_page',
    page: null as null
  };
  await pdf.convert(filePath, opts);
  return fs.readdirSync(outDir)
    .filter(f => f.endsWith('.png'))
    .sort()
    .map(f => path.join(outDir, f));
}

async function renderPdfWithPdf2pic(filePath: string, outDir: string): Promise<string[]> {
  const { fromPath } = require('pdf2pic');
  const converter = fromPath(filePath, {
    density: 200,
    format: 'png',
    width: 1400,
    height: 1800,
    savePath: outDir,
    saveFilename: 'stmt_page'
  });
  const results = await converter.bulk(-1, { responseType: 'image' });
  return (results || [])
    .filter((r: { path?: string }) => r.path)
    .map((r: { path: string }) => r.path);
}

async function runTesseractOnBuffer(buffer: Buffer): Promise<{ text: string; confidence: number }> {
  const { createWorker } = require('tesseract.js');
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(buffer);
    return {
      text: data.text || '',
      confidence: data.confidence || 0
    };
  } finally {
    await worker.terminate();
  }
}

async function runTesseractOnFile(filePath: string): Promise<{ text: string; confidence: number }> {
  const { createWorker } = require('tesseract.js');
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(filePath);
    return {
      text: data.text || '',
      confidence: data.confidence || 0
    };
  } finally {
    await worker.terminate();
  }
}

async function ocrImageBuffers(buffers: Buffer[], progressLog: string[]): Promise<{ text: string; confidence: number }> {
  let combinedText = '';
  const confidences: number[] = [];

  for (let i = 0; i < buffers.length; i++) {
    progressLog.push(`[${new Date().toISOString()}] Running OCR on page ${i + 1}/${buffers.length}`);
    const { text, confidence } = await runTesseractOnBuffer(buffers[i]);
    combinedText += text + '\n';
    confidences.push(confidence);
    console.log(`[BankStatementOCR] Page ${i + 1} OCR confidence: ${confidence.toFixed(1)}%`);
  }

  const avgConfidence = confidences.length
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;

  return { text: combinedText.trim(), confidence: avgConfidence };
}

async function ocrImagePaths(imagePaths: string[], progressLog: string[]): Promise<{ text: string; confidence: number }> {
  let combinedText = '';
  const confidences: number[] = [];

  for (let i = 0; i < imagePaths.length; i++) {
    progressLog.push(`[${new Date().toISOString()}] Running OCR on page ${i + 1}/${imagePaths.length}`);
    const { text, confidence } = await runTesseractOnFile(imagePaths[i]);
    combinedText += text + '\n';
    confidences.push(confidence);
    console.log(`[BankStatementOCR] Page ${i + 1} OCR confidence: ${confidence.toFixed(1)}%`);
  }

  const avgConfidence = confidences.length
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;

  return { text: combinedText.trim(), confidence: avgConfidence };
}

async function convertPdfToImages(filePath: string, progressLog: string[]): Promise<{ buffers: Buffer[]; paths: string[] }> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spendsense-ocr-'));
  const buffers: Buffer[] = [];
  const paths: string[] = [];

  try {
    progressLog.push(`[${new Date().toISOString()}] Converting PDF pages via pdfjs + canvas`);
    const pdfJsImages = await renderPdfWithPdfJs(filePath);
    buffers.push(...pdfJsImages);
    if (buffers.length > 0) return { buffers, paths };
  } catch (err) {
    console.warn('[BankStatementOCR] pdfjs render failed:', err);
  }

  try {
    progressLog.push(`[${new Date().toISOString()}] Converting PDF pages via pdf-poppler`);
    const popplerPaths = await renderPdfWithPoppler(filePath, tmpDir);
    if (popplerPaths.length > 0) return { buffers: [], paths: popplerPaths };
  } catch (err) {
    console.warn('[BankStatementOCR] pdf-poppler failed (poppler may not be installed):', err);
  }

  try {
    progressLog.push(`[${new Date().toISOString()}] Converting PDF pages via pdf2pic`);
    const picPaths = await renderPdfWithPdf2pic(filePath, tmpDir);
    if (picPaths.length > 0) return { buffers: [], paths: picPaths };
  } catch (err) {
    console.warn('[BankStatementOCR] pdf2pic failed:', err);
  }

  return { buffers, paths };
}

export async function extractTextFromFileWithOcr(
  filePath: string,
  originalName: string,
  onProgress?: (step: OcrProgressStep) => void,
  clientOcrText?: string
): Promise<OcrExtractionResult> {
  const progressLog: string[] = [];
  const ext = path.extname(originalName).toLowerCase().replace('.', '');

  logStep(progressLog, 'Uploading file received', onProgress, 'Uploading');

  if (clientOcrText && clientOcrText.trim().length >= MIN_TEXT_LENGTH) {
    logStep(progressLog, `Using client-side OCR text (${clientOcrText.length} chars)`, onProgress, 'Completed');
    return {
      text: clientOcrText.trim(),
      parseMethod: 'Client OCR Text',
      ocrConfidence: 0,
      progressLog,
      usedOcr: true,
      pageCount: 0
    };
  }

  if (ext === 'csv' || ext === 'txt') {
    logStep(progressLog, 'Reading plain text / CSV file', onProgress, 'Reading PDF');
    const text = fs.readFileSync(filePath, 'utf-8');
    return {
      text,
      parseMethod: ext === 'csv' ? 'CSV Parser' : 'Text Parser',
      ocrConfidence: 100,
      progressLog,
      usedOcr: false,
      pageCount: 0
    };
  }

  if (ext === 'pdf') {
    logStep(progressLog, 'Reading PDF with pdf-parse', onProgress, 'Reading PDF');
    const pdfText = await extractPdfTextWithParse(filePath);
    progressLog.push(`[${new Date().toISOString()}] pdf-parse extracted ${pdfText.length} characters`);

    if (pdfText.length >= MIN_TEXT_LENGTH) {
      logStep(progressLog, 'Text-based PDF — skipping OCR', onProgress, 'Extracting Transactions');
      return {
        text: pdfText,
        parseMethod: 'PDF Text Extractor (pdf-parse)',
        ocrConfidence: 100,
        progressLog,
        usedOcr: false,
        pageCount: 0
      };
    }

    logStep(progressLog, `Image-based PDF detected (${pdfText.length} chars) — converting pages to images`, onProgress, 'Running OCR');
    const { buffers, paths } = await convertPdfToImages(filePath, progressLog);
    const pageCount = buffers.length || paths.length;

    if (pageCount === 0) {
      logStep(progressLog, 'PDF page conversion failed — direct Tesseract on PDF', onProgress, 'Running OCR');
      const direct = await runTesseractOnFile(filePath);
      return {
        text: direct.text || pdfText,
        parseMethod: `PDF Direct OCR (${direct.confidence.toFixed(1)}% confidence)`,
        ocrConfidence: direct.confidence,
        progressLog,
        usedOcr: true,
        pageCount: 1
      };
    }

    logStep(progressLog, `Running Tesseract OCR on ${pageCount} page(s)`, onProgress, 'Running OCR');
    const ocrResult = buffers.length > 0
      ? await ocrImageBuffers(buffers, progressLog)
      : await ocrImagePaths(paths, progressLog);

    console.log(`[BankStatementOCR] Average OCR confidence: ${ocrResult.confidence.toFixed(1)}%`);

    return {
      text: ocrResult.text || pdfText,
      parseMethod: `PDF Page OCR (${ocrResult.confidence.toFixed(1)}% avg confidence, ${pageCount} pages)`,
      ocrConfidence: ocrResult.confidence,
      progressLog,
      usedOcr: true,
      pageCount
    };
  }

  if (['png', 'jpg', 'jpeg'].includes(ext)) {
    logStep(progressLog, 'Running OCR on image file', onProgress, 'Running OCR');
    const ocrResult = await runTesseractOnFile(filePath);
    console.log(`[BankStatementOCR] Image OCR confidence: ${ocrResult.confidence.toFixed(1)}%`);
    return {
      text: ocrResult.text,
      parseMethod: `Image OCR (${ocrResult.confidence.toFixed(1)}% confidence)`,
      ocrConfidence: ocrResult.confidence,
      progressLog,
      usedOcr: true,
      pageCount: 1
    };
  }

  try {
    const text = fs.readFileSync(filePath, 'utf-8');
    return { text, parseMethod: 'Text Parser', ocrConfidence: 100, progressLog, usedOcr: false, pageCount: 0 };
  } catch {
    return { text: '', parseMethod: 'Parse Failed', ocrConfidence: 0, progressLog, usedOcr: false, pageCount: 0 };
  }
}
