/**
 * Client-Side Background Removal, Alpha Masking, and Jewelry Blending Utilities
 */

export interface ColorKeyOptions {
  tolerance: number; // 0 to 100
  feather: number; // edge smoothing 0 to 10
  targetColor?: { r: number; g: number; b: number } | null;
  preserveGoldTones: boolean;
}

/**
 * Remove background from an image on an HTML5 canvas using adaptive color distance
 * and gold-hue preservation.
 */
export function removeBackgroundCanvas(
  sourceCanvas: HTMLCanvasElement,
  options: ColorKeyOptions = {
    tolerance: 32,
    feather: 2,
    targetColor: null,
    preserveGoldTones: true,
  }
): HTMLCanvasElement {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  const ctx = outputCanvas.getContext("2d");
  if (!ctx) return sourceCanvas;

  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // If no target color is specified, sample the 4 corners of the image
  let bgR = 255;
  let bgG = 255;
  let bgB = 255;

  if (options.targetColor) {
    bgR = options.targetColor.r;
    bgG = options.targetColor.g;
    bgB = options.targetColor.b;
  } else {
    // Sample four corners to deduce background color
    const corners = [
      [0, 0],
      [width - 1, 0],
      [0, height - 1],
      [width - 1, height - 1],
    ];
    let sumR = 0,
      sumG = 0,
      sumB = 0;
    corners.forEach(([x, y]) => {
      const idx = (y * width + x) * 4;
      sumR += data[idx];
      sumG += data[idx + 1];
      sumB += data[idx + 2];
    });
    bgR = sumR / 4;
    bgG = sumG / 4;
    bgB = sumB / 4;
  }

  const tolSquared = (options.tolerance * 2.55) ** 2;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a === 0) continue;

    // Euclidean color distance from background
    const distSq = (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2;

    // Gold / Gemstone tone heuristic check:
    // Gold usually has high Red, moderate Green, and lower Blue (R > G > B)
    const isGoldTone =
      options.preserveGoldTones &&
      r > 120 &&
      g > 80 &&
      r > b * 1.25 &&
      g > b * 1.05;

    // Ruby tone heuristic: high Red, low Green, low Blue
    const isRubyTone =
      options.preserveGoldTones && r > 100 && r > g * 1.5 && r > b * 1.5;

    // Emerald tone heuristic: high Green
    const isEmeraldTone =
      options.preserveGoldTones && g > 70 && g > r * 1.2 && g > b * 1.1;

    const isJewelryColor = isGoldTone || isRubyTone || isEmeraldTone;

    if (distSq < tolSquared) {
      if (isJewelryColor && options.tolerance < 60) {
        // Soften instead of fully deleting if it looks like gold reflection
        const ratio = Math.sqrt(distSq) / (options.tolerance * 2.55);
        data[i + 3] = Math.round(a * Math.min(1, ratio * 1.5));
      } else {
        data[i + 3] = 0; // Transparent
      }
    } else if (distSq < tolSquared * 1.5 && options.feather > 0) {
      // Feathered boundary
      const factor = (distSq - tolSquared) / (tolSquared * 0.5);
      data[i + 3] = Math.round(a * Math.min(1, factor));
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}

/**
 * Download a high-res comparison card featuring the user's try-on image,
 * gold design specifications, gram weight range, and showroom branding.
 */
export function createComparisonCard(
  mainImageSrc: string | HTMLCanvasElement,
  designInfo: {
    id: string;
    name: string;
    category: string;
    grams: number;
    price: string;
    showroomName?: string;
  }
): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Luxury Card Dimensions: 1080 x 1350 (Instagram Portrait 4:5 ratio)
  canvas.width = 1080;
  canvas.height = 1350;

  // 1. Dark Obsidian Royal Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1350);
  bgGrad.addColorStop(0, "#08080B");
  bgGrad.addColorStop(0.7, "#111117");
  bgGrad.addColorStop(1, "#0B0B0E");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1350);

  // 2. Gold Heritage Frame Border
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, 1080 - 72, 1350 - 72);

  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(46, 46, 1080 - 92, 1350 - 92);

  // Corner Ornaments
  drawCornerAccents(ctx, 46, 46, 1080 - 92, 1350 - 92);

  // 3. Top Header / Showroom Branding
  ctx.textAlign = "center";
  ctx.font = "bold 32px 'Cinzel', serif, Georgia";
  ctx.fillStyle = "#FAF8F5";
  ctx.fillText(
    designInfo.showroomName || "SWARNATRY HERITAGE JEWELLERS",
    540,
    105
  );

  ctx.font = "italic 18px 'Playfair Display', serif";
  ctx.fillStyle = "#D4AF37";
  ctx.fillText("AI Virtual Try-On & Bespoke Goldsmith Estimation", 540, 138);

  const photoX = 70;
  const photoY = 175;
  const photoW = 940;
  const photoH = 880;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(photoX, photoY, photoW, photoH, 16);
  ctx.clip();

  if (typeof mainImageSrc !== "string") {
    // Already a canvas
    const imgAspect = mainImageSrc.width / mainImageSrc.height;
    const boxAspect = photoW / photoH;
    let sx = 0, sy = 0, sw = mainImageSrc.width, sh = mainImageSrc.height;
    if (imgAspect > boxAspect) {
      sw = mainImageSrc.height * boxAspect;
      sx = (mainImageSrc.width - sw) / 2;
    } else {
      sh = mainImageSrc.width / boxAspect;
      sy = (mainImageSrc.height - sh) / 2;
    }
    ctx.drawImage(mainImageSrc, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
  } else {
    const img = new Image();
    img.src = mainImageSrc;
    const imgAspect = (img.width || 800) / (img.height || 1000);
    const boxAspect = photoW / photoH;
    let sx = 0, sy = 0, sw = img.width || 800, sh = img.height || 1000;
    if (imgAspect > boxAspect) {
      sw = (img.height || 1000) * boxAspect;
      sx = ((img.width || 800) - sw) / 2;
    } else {
      sh = (img.width || 800) / boxAspect;
      sy = ((img.height || 1000) - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
  }
  ctx.restore();

  // Photo border gold stroke
  ctx.strokeStyle = "rgba(212, 175, 55, 0.6)";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  // "AI TRY-ON PREVIEW" Badge on image
  ctx.fillStyle = "rgba(11, 11, 14, 0.85)";
  ctx.fillRect(photoX + 24, photoY + 24, 210, 38);
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 1;
  ctx.strokeRect(photoX + 24, photoY + 24, 210, 38);
  ctx.fillStyle = "#FFE484";
  ctx.font = "600 15px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("✨ AI VIRTUAL TRY-ON", photoX + 40, photoY + 49);

  // 5. Bottom Specifications & Goldsmith Estimation Panel
  const panelY = 1080;
  const panelH = 195;
  ctx.fillStyle = "rgba(20, 20, 28, 0.9)";
  ctx.fillRect(photoX, panelY, photoW, panelH);
  ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(photoX, panelY, photoW, panelH);

  // Design Title
  ctx.textAlign = "left";
  ctx.font = "bold 28px 'Cinzel', serif";
  ctx.fillStyle = "#FAF8F5";
  ctx.fillText(designInfo.name, photoX + 30, panelY + 48);

  // Badges (Design ID & Hallmarking)
  ctx.font = "600 16px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#D4AF37";
  ctx.fillText(
    `DESIGN ID: ${designInfo.id}  •  22K 916 BIS HALLMARKED`,
    photoX + 30,
    panelY + 82
  );

  ctx.font = "500 16px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#C5C0B6";
  ctx.fillText(
    `Craftable Weight: ${designInfo.grams} Grams  |  Category: ${designInfo.category}`,
    photoX + 30,
    panelY + 114
  );

  ctx.font = "italic 13px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#8E887E";
  ctx.fillText(
    "*Inclusive of 22K Live Gold Rate, Wastage (VA), Making Charges & 3% GST",
    photoX + 30,
    panelY + 155
  );

  // Estimated Price Big Display (Right aligned)
  ctx.textAlign = "right";
  ctx.font = "500 16px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#D4AF37";
  ctx.fillText("ESTIMATED PRICE RANGE", photoX + photoW - 30, panelY + 50);

  ctx.font = "bold 38px 'Cinzel', serif";
  ctx.fillStyle = "#FFE89E";
  ctx.fillText(designInfo.price, photoX + photoW - 30, panelY + 100);

  ctx.font = "600 14px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#34D399";
  ctx.fillText("✓ Verified Gold Estimate", photoX + photoW - 30, panelY + 135);

  return canvas.toDataURL("image/png");
}

export const generateComparisonCard = createComparisonCard;

/**
 * 3D Parabolic Neck-Curve & Head-Turn Perspective Warping Filter
 * Slices the flat ornament image into vertical strips and applies a parabolic vertical bend
 * and yaw foreshortening so necklaces wrap realistically around curved necks.
 */
export function warpNecklaceCanvas(
  source: HTMLCanvasElement | HTMLImageElement,
  neckCurve: number = 0, // -40 to +40 degrees
  yawAngle: number = 0   // -35 to +35 degrees
): HTMLCanvasElement {
  const w = (source as HTMLCanvasElement).width || (source as HTMLImageElement).naturalWidth || 400;
  const h = (source as HTMLCanvasElement).height || (source as HTMLImageElement).naturalHeight || 400;

  const outputCanvas = document.createElement("canvas");
  const maxCurvatureOffset = Math.abs(neckCurve / 40) * (h * 0.4);
  const extraPaddingY = maxCurvatureOffset * 1.5 + 40;
  const extraPaddingX = Math.abs(yawAngle / 35) * (w * 0.25) + 30;

  outputCanvas.width = Math.ceil(w + extraPaddingX * 2);
  outputCanvas.height = Math.ceil(h + extraPaddingY * 2);

  const ctx = outputCanvas.getContext("2d");
  if (!ctx) return outputCanvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // If neutral, simply draw centered
  if (Math.abs(neckCurve) < 0.5 && Math.abs(yawAngle) < 0.5) {
    ctx.drawImage(source, extraPaddingX, extraPaddingY, w, h);
    return outputCanvas;
  }

  const sliceW = Math.max(2, Math.floor(w / 140));
  const totalSlices = Math.ceil(w / sliceW);
  const centerX = outputCanvas.width / 2;
  const centerY = outputCanvas.height / 2;

  const yawRad = (yawAngle * Math.PI) / 180;
  const curveFactor = neckCurve / 40;

  for (let i = 0; i < totalSlices; i++) {
    const sx = i * sliceW;
    const currentSliceW = Math.min(sliceW, w - sx);
    if (currentSliceW <= 0) break;

    // Normalized coordinate from -1 (left edge) to 0 (center) to +1 (right edge)
    const sliceMidX = sx + currentSliceW / 2;
    const u = (sliceMidX - w / 2) / (w / 2);

    // 1. Parabolic Curve: y = -curveFactor * u^2 * maxCurvatureOffset
    // When curveFactor > 0, sides move UPWARDS towards collarbones
    const curveDy = -curveFactor * (u * u) * (h * 0.32);

    // 2. 3D Yaw / Head-Turn perspective foreshortening
    // Side rotated forward looks larger, side rotated back looks smaller
    const depthZ = -u * Math.sin(yawRad);
    const perspectiveScale = Math.max(0.65, Math.min(1.35, 1 + depthZ * 0.4));

    // Projected horizontal position
    const cosYaw = Math.cos(yawRad);
    const projX = centerX + (u * (w / 2) * cosYaw * perspectiveScale);

    // Projected vertical position
    const projY = centerY + (curveDy * perspectiveScale) - (h * perspectiveScale) / 2;

    const destW = (currentSliceW * cosYaw * perspectiveScale) + 0.75; // overlap prevents subpixel seams
    const destH = h * perspectiveScale;

    ctx.drawImage(
      source,
      sx,
      0,
      currentSliceW,
      h,
      projX - destW / 2,
      projY,
      destW,
      destH
    );
  }

  return outputCanvas;
}

/**
 * 1080x1350 Full Bridal Set Lookbook Card
 * High-definition composite featuring customer photo wearing the full bridal set
 * plus an itemized goldsmith trousseau breakdown.
 */
export function createBridalSetLookbookCard(
  portraitCanvas: HTMLCanvasElement,
  trousseauData: {
    showroomName: string;
    goldRate22K: number;
    totalGrossGrams: number;
    totalNetGrams: number;
    totalStoneWeightGrams: number;
    grandTotal: number;
    minPossibleTotal: number;
    maxPossibleTotal: number;
    totalPieces: number;
    items: Array<{
      id: string;
      name: string;
      teluguName?: string;
      categoryLabel: string;
      selectedGrams: number;
      priceFormatted: string;
    }>;
  }
): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Obsidian Luxury Gradient Background
  const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
  bgGrad.addColorStop(0, "#08080A");
  bgGrad.addColorStop(0.4, "#101017");
  bgGrad.addColorStop(1, "#070709");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1350);

  // Outer Gold Border & Corner Accents
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, 1008, 1278);
  drawCornerAccents(ctx, 36, 36, 1008, 1278);

  // 2. Header
  ctx.textAlign = "center";
  ctx.font = "bold 34px 'Cinzel', serif";
  ctx.fillStyle = "#FAF8F5";
  ctx.fillText(trousseauData.showroomName.toUpperCase(), 540, 95);

  ctx.font = "600 15px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#D4AF37";
  ctx.fillText("ROYAL HERITAGE BRIDAL TROUSSEAU LOOKBOOK", 540, 128);

  ctx.font = "400 13px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#9C9485";
  ctx.fillText(
    `Live 22K Gold Rate: ₹${trousseauData.goldRate22K.toLocaleString("en-IN")}/g  •  22K 916 BIS Hallmarked`,
    540,
    152
  );

  // 3. Left Side: Bridal Try-On Portrait Display
  const photoX = 64;
  const photoY = 185;
  const photoW = 540;
  const photoH = 780;

  ctx.save();
  ctx.beginPath();
  ctx.rect(photoX, photoY, photoW, photoH);
  ctx.clip();

  const pAspect = portraitCanvas.width / portraitCanvas.height;
  const bAspect = photoW / photoH;
  let sx = 0, sy = 0, sw = portraitCanvas.width, sh = portraitCanvas.height;
  if (pAspect > bAspect) {
    sw = portraitCanvas.height * bAspect;
    sx = (portraitCanvas.width - sw) / 2;
  } else {
    sh = portraitCanvas.width / bAspect;
    sy = (portraitCanvas.height - sh) / 2;
  }
  ctx.drawImage(portraitCanvas, sx, sy, sw, sh, photoX, photoY, photoW, photoH);
  ctx.restore();

  ctx.strokeStyle = "rgba(212, 175, 55, 0.6)";
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX, photoY, photoW, photoH);

  // Badge on portrait
  ctx.fillStyle = "rgba(11, 11, 14, 0.88)";
  ctx.fillRect(photoX + 16, photoY + 16, 210, 36);
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 1;
  ctx.strokeRect(photoX + 16, photoY + 16, 210, 36);
  ctx.fillStyle = "#FFE89E";
  ctx.font = "600 14px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("✨ BRIDAL COMBO TRY-ON", photoX + 28, photoY + 39);

  // 4. Right Side: Itemized Trousseau Pieces
  const listX = 630;
  let listY = 190;
  const listW = 385;

  ctx.fillStyle = "rgba(18, 18, 26, 0.85)";
  ctx.fillRect(listX, listY, listW, 775);
  ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(listX, listY, listW, 775);

  ctx.textAlign = "left";
  ctx.font = "bold 18px 'Cinzel', serif";
  ctx.fillStyle = "#FAF8F5";
  ctx.fillText(`Equipped Pieces (${trousseauData.totalPieces})`, listX + 20, listY + 38);

  ctx.strokeStyle = "rgba(212, 175, 55, 0.25)";
  ctx.beginPath();
  ctx.moveTo(listX + 20, listY + 52);
  ctx.lineTo(listX + listW - 20, listY + 52);
  ctx.stroke();

  let itemCardY = listY + 70;
  const maxDisplayItems = Math.min(trousseauData.items.length, 5);

  for (let i = 0; i < maxDisplayItems; i++) {
    const item = trousseauData.items[i];
    ctx.fillStyle = "rgba(28, 28, 38, 0.75)";
    ctx.fillRect(listX + 16, itemCardY, listW - 32, 120);
    ctx.strokeStyle = "rgba(212, 175, 55, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(listX + 16, itemCardY, listW - 32, 120);

    // Item Name
    ctx.fillStyle = "#FFEAA7";
    ctx.font = "bold 15px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`${i + 1}. ${item.name.substring(0, 24)}`, listX + 28, itemCardY + 28);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "500 12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`Category: ${item.categoryLabel}`, listX + 28, itemCardY + 50);

    ctx.fillStyle = "#C8C2B5";
    ctx.font = "500 12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`Crafted Weight: ${item.selectedGrams}g  •  SKU: ${item.id}`, listX + 28, itemCardY + 72);

    ctx.fillStyle = "#34D399";
    ctx.font = "bold 15px 'Cinzel', serif";
    ctx.fillText(item.priceFormatted, listX + 28, itemCardY + 102);

    itemCardY += 135;
  }

  // 5. Bottom Grand Total Banner
  const footerY = 995;
  const footerH = 290;
  ctx.fillStyle = "rgba(20, 20, 28, 0.95)";
  ctx.fillRect(photoX, footerY, 951, footerH);
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(photoX, footerY, 951, footerH);

  // Left side: Weight Totals
  ctx.textAlign = "left";
  ctx.font = "bold 20px 'Cinzel', serif";
  ctx.fillStyle = "#D4AF37";
  ctx.fillText("BRIDAL TROUSSEAU SPECIFICATIONS", photoX + 35, footerY + 45);

  ctx.font = "500 16px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#FAF8F5";
  ctx.fillText(`Total Gross Weight: ${trousseauData.totalGrossGrams.toFixed(2)} Grams`, photoX + 35, footerY + 85);
  ctx.fillText(`Total Net Gold Weight: ${trousseauData.totalNetGrams.toFixed(2)} Grams`, photoX + 35, footerY + 118);
  if (trousseauData.totalStoneWeightGrams > 0) {
    ctx.fillText(`Gemstones & Pearls: ${trousseauData.totalStoneWeightGrams.toFixed(2)} Grams (Deducted)`, photoX + 35, footerY + 151);
  }
  ctx.fillStyle = "#9C9485";
  ctx.font = "italic 13px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText("*Inclusive of 22K Gold Cost, Wastage (VA 8-15%), Making Charges & 3% GST", photoX + 35, footerY + 195);
  ctx.fillText("*Official Certified Showroom Estimate • Valid for Family Bridal Budgeting", photoX + 35, footerY + 225);

  // Right side: Grand Budget Display
  const rightX = photoX + 951 - 40;
  ctx.textAlign = "right";
  ctx.font = "500 16px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#D4AF37";
  ctx.fillText("COMBINED ESTIMATED BUDGET", rightX, footerY + 50);

  ctx.font = "bold 44px 'Cinzel', serif";
  ctx.fillStyle = "#FFE89E";
  ctx.fillText(`₹${trousseauData.grandTotal.toLocaleString("en-IN")}`, rightX, footerY + 110);

  ctx.font = "600 15px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#C5C0B6";
  ctx.fillText(
    `Budget Range: ₹${trousseauData.minPossibleTotal.toLocaleString("en-IN")} – ₹${trousseauData.maxPossibleTotal.toLocaleString("en-IN")}`,
    rightX,
    footerY + 148
  );

  ctx.font = "600 14px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#34D399";
  ctx.fillText("✓ 100% Transparent Goldsmith Estimation", rightX, footerY + 185);

  return canvas.toDataURL("image/png");
}


function drawCornerAccents(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const size = 20;
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 3;

  // Top Left
  ctx.beginPath();
  ctx.moveTo(x + size, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + size);
  ctx.stroke();

  // Top Right
  ctx.beginPath();
  ctx.moveTo(x + w - size, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + size);
  ctx.stroke();

  // Bottom Left
  ctx.beginPath();
  ctx.moveTo(x, y + h - size);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + size, y + h);
  ctx.stroke();

  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(x + w - size, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - size);
  ctx.stroke();
}
