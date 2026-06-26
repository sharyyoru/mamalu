/**
 * voucherRenderer.ts
 * Browser-side canvas renderer for Mamalu Kitchen voucher images.
 * Loads the existing voucher template PNGs (816×579), draws dynamic text
 * at calibrated coordinates, and exports each page as a PNG Blob.
 */

export interface VoucherData {
  toName: string;
  fromName: string;
  voucherCode: string;
  issueDate: string;
}

/**
 * Coordinates calibrated for 816×579 voucher images.
 * Adjust x/y values here if text needs fine-tuning after visual inspection.
 */
const PAGE1_COORDS = {
  // After the "To:" label on the To line
  toName:      { x: 143, y: 205, maxWidth: 155, size: 18, centered: false },
  // After the "From:" label on the From line
  fromName:    { x: 160, y: 231, maxWidth: 143, size: 18, centered: false },
  // On the first blank underline after the "Message:" heading
  voucherCode: { x: 290, y: 322, maxWidth: 415, size: 20, centered: false },
} as const;

const PAGE2_COORDS = {
  // After the "Voucher Issue Date:" label
  issueDate:   { x: 362, y: 380, maxWidth: 218, size: 18, centered: false },
  // Replaces the hardcoded "018" code at the bottom of page 2, centred
  voucherCode: { x: 408, y: 554, maxWidth: 280, size: 26, centered: true },
} as const;

const FONT_FAMILY = '"Coming Soon", cursive';
const FONT_URL    = '/fonts/ComingSoon-Regular.ttf';
const TEXT_COLOR  = '#1a1a1a';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/** Load the Coming Soon font from the project's public folder and add it to the document. */
async function ensureFont(): Promise<void> {
  try {
    const face = new FontFace('Coming Soon', `url("${FONT_URL}") format("truetype")`);
    const loaded = await face.load();
    document.fonts.add(loaded);
    await document.fonts.load(`20px "Coming Soon"`);
  } catch {
    // Silently fall back to the system cursive stack
  }
}

/**
 * Set the canvas font, reducing size until the text fits within maxWidth.
 * Returns the final computed font string.
 */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  baseFontSize: number,
): string {
  let size = baseFontSize;
  ctx.font = `${size}px ${FONT_FAMILY}`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 1;
    ctx.font = `${size}px ${FONT_FAMILY}`;
  }
  return ctx.font;
}

/**
 * Draw text with a white halo so the existing underline doesn't cross
 * through the characters, then draw the dark text on top.
 */
function drawTextWithHalo(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  baseFontSize: number,
  centered: boolean,
): void {
  fitFont(ctx, text, maxWidth, baseFontSize);
  const drawX = centered ? x - ctx.measureText(text).width / 2 : x;

  ctx.save();
  ctx.strokeStyle = 'white';
  ctx.lineWidth   = 7;
  ctx.lineJoin    = 'round';
  ctx.strokeText(text, drawX, y);
  ctx.restore();

  ctx.fillStyle = TEXT_COLOR;
  ctx.fillText(text, drawX, y);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
      'image/png',
    ),
  );
}

/** Render a single voucher page: load the template, draw dynamic text, export as Blob. */
async function renderPage(
  imageSrc: string,
  draw: (ctx: CanvasRenderingContext2D) => void,
): Promise<Blob> {
  const [img] = await Promise.all([loadImage(imageSrc), ensureFont()]);

  const canvas   = document.createElement('canvas');
  canvas.width   = img.naturalWidth;
  canvas.height  = img.naturalHeight;
  const ctx      = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not acquire 2D canvas context');

  ctx.drawImage(img, 0, 0);
  draw(ctx);
  return canvasToBlob(canvas);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function renderVoucherFront(data: VoucherData): Promise<Blob> {
  return renderPage('/voucher/page-1.png', (ctx) => {
    const c = PAGE1_COORDS;
    drawTextWithHalo(ctx, data.toName,      c.toName.x,      c.toName.y,      c.toName.maxWidth,      c.toName.size,      c.toName.centered);
    drawTextWithHalo(ctx, data.fromName,    c.fromName.x,    c.fromName.y,    c.fromName.maxWidth,    c.fromName.size,    c.fromName.centered);
    drawTextWithHalo(ctx, data.voucherCode, c.voucherCode.x, c.voucherCode.y, c.voucherCode.maxWidth, c.voucherCode.size, c.voucherCode.centered);
  });
}

export function renderVoucherTerms(data: VoucherData): Promise<Blob> {
  return renderPage('/voucher/page-2.png', (ctx) => {
    const c = PAGE2_COORDS;
    drawTextWithHalo(ctx, data.issueDate,   c.issueDate.x,   c.issueDate.y,   c.issueDate.maxWidth,   c.issueDate.size,   c.issueDate.centered);
    drawTextWithHalo(ctx, data.voucherCode, c.voucherCode.x, c.voucherCode.y, c.voucherCode.maxWidth, c.voucherCode.size, c.voucherCode.centered);
  });
}

export async function renderVoucherPages(
  data: VoucherData,
): Promise<{ front: Blob; terms: Blob }> {
  const [front, terms] = await Promise.all([
    renderVoucherFront(data),
    renderVoucherTerms(data),
  ]);
  return { front, terms };
}
