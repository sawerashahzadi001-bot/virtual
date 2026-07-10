// ============================
// MetaDress AR FASHION — AR canvas drawing utilities
// Pure canvas-rendering functions (ready for AR integration)
// ============================

import type { AROutfit } from "./data";

export function hexToRgba(hex: string | undefined, alpha: number): string {
  if (!hex) return `rgba(201,169,110,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export interface BodyMeasurements {
  centerX: number;
  shoulderY: number;
  hipY: number;
  shoulderW: number;
  hipW: number;
  bodyH: number;
  W: number;
  H: number;
}

function getOutfitWidth(outfit: AROutfit, shoulderW: number, hipW: number) {
  if (outfit.type === "blazer" || outfit.type === "top") {
    return shoulderW * 1.25;
  }

  const baseWidth = Math.max(shoulderW * 1.5, hipW * 1.2);
  return outfit.type === "abaya" ? Math.max(baseWidth, hipW * 1.35) : baseWidth;
}

// ===== DRAW OUTFIT OVERLAY =====
export function drawOutfitOverlay(
  ctx: CanvasRenderingContext2D,
  outfit: AROutfit,
  body: BodyMeasurements,
) {
  const { centerX, shoulderY, hipY, shoulderW, hipW, bodyH, H } = body;

  ctx.save();

  // Determine outfit dimensions from live body shape
  const outfitW = getOutfitWidth(outfit, shoulderW, hipW);
  const neckY = shoulderY - Math.max(bodyH * 0.08, 20);

  switch (outfit.type) {
    case "abaya":
      drawAbaya(ctx, outfit, centerX, neckY, outfitW, H, shoulderW, hipW, bodyH);
      break;
    case "gown":
    case "dress":
    case "velvet":
    case "sequin":
    case "maxi":
    case "linen":
      drawFullDress(ctx, outfit, centerX, neckY, outfitW, H, shoulderW, hipW, bodyH);
      break;
    case "blazer":
    case "top":
      drawTop(ctx, outfit, centerX, neckY, outfitW, hipY + bodyH * 0.2, shoulderW);
      break;
    default:
      drawFullDress(ctx, outfit, centerX, neckY, outfitW, H, shoulderW, hipW, bodyH);
  }

  // Add sparkle/shimmer for sequin
  if (outfit.type === "sequin") {
    drawSparkles(ctx, centerX, neckY, outfitW, H - neckY);
  }

  ctx.restore();
}

export function drawAbaya(
  ctx: CanvasRenderingContext2D,
  outfit: AROutfit,
  cx: number,
  topY: number,
  w: number,
  H: number,
  shoulderW: number,
  hipW: number,
  bodyH: number,
) {
  const gradient = ctx.createLinearGradient(cx, topY, cx, H);
  gradient.addColorStop(0, hexToRgba(outfit.gradient[0], 0.96));
  gradient.addColorStop(0.35, hexToRgba(outfit.color, 0.92));
  gradient.addColorStop(1, hexToRgba(outfit.gradient[1], 1));

  const sideWidth = Math.max(w * 0.52, shoulderW * 1.2);
  const sleeveY = topY + bodyH * 0.14;
  const wristY = topY + bodyH * 0.48;
  const hemY = H * 0.98;

  ctx.beginPath();
  ctx.moveTo(cx - sideWidth, topY);
  ctx.lineTo(cx - sideWidth, sleeveY);
  ctx.quadraticCurveTo(cx - sideWidth * 0.95, topY + bodyH * 0.22, cx - sideWidth * 0.65, wristY);
  ctx.lineTo(cx - sideWidth * 0.55, hemY);
  ctx.lineTo(cx + sideWidth * 0.55, hemY);
  ctx.lineTo(cx + sideWidth * 0.65, wristY);
  ctx.quadraticCurveTo(cx + sideWidth * 0.95, topY + bodyH * 0.22, cx + sideWidth, sleeveY);
  ctx.lineTo(cx + sideWidth, topY);
  ctx.closePath();

  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.98;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.moveTo(cx - sideWidth, topY);
  ctx.lineTo(cx - sideWidth, sleeveY);
  ctx.quadraticCurveTo(cx - sideWidth * 0.95, topY + bodyH * 0.22, cx - sideWidth * 0.65, wristY);
  ctx.lineTo(cx - sideWidth * 0.55, hemY);
  ctx.lineTo(cx + sideWidth * 0.55, hemY);
  ctx.lineTo(cx + sideWidth * 0.65, wristY);
  ctx.quadraticCurveTo(cx + sideWidth * 0.95, topY + bodyH * 0.22, cx + sideWidth, sleeveY);
  ctx.lineTo(cx + sideWidth, topY);
  ctx.strokeStyle = hexToRgba(outfit.gradient[1], 0.55);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Central abaya panel
  ctx.beginPath();
  ctx.moveTo(cx - shoulderW * 0.16, topY + bodyH * 0.1);
  ctx.lineTo(cx - shoulderW * 0.16, hemY);
  ctx.lineTo(cx + shoulderW * 0.16, hemY);
  ctx.lineTo(cx + shoulderW * 0.16, topY + bodyH * 0.1);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(outfit.gradient[1], 0.08);
  ctx.fill();

  // Sleeve line details
  ctx.strokeStyle = hexToRgba(outfit.gradient[1], 0.16);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - sideWidth, sleeveY);
  ctx.lineTo(cx - sideWidth * 0.65, wristY);
  ctx.moveTo(cx + sideWidth, sleeveY);
  ctx.lineTo(cx + sideWidth * 0.65, wristY);
  ctx.stroke();

  // Add subtle waist seam and flare detail
  ctx.strokeStyle = hexToRgba(outfit.gradient[1], 0.22);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - sideWidth * 0.55, topY + bodyH * 0.6);
  ctx.quadraticCurveTo(cx, topY + bodyH * 0.72, cx + sideWidth * 0.55, topY + bodyH * 0.6);
  ctx.stroke();

  // Outline edge for silhouette
  ctx.strokeStyle = hexToRgba(outfit.gradient[1], 0.45);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - sideWidth, topY);
  ctx.lineTo(cx - sideWidth, sleeveY);
  ctx.quadraticCurveTo(cx - sideWidth * 0.95, topY + bodyH * 0.22, cx - sideWidth * 0.65, wristY);
  ctx.lineTo(cx - sideWidth * 0.55, hemY);
  ctx.lineTo(cx + sideWidth * 0.55, hemY);
  ctx.lineTo(cx + sideWidth * 0.65, wristY);
  ctx.quadraticCurveTo(cx + sideWidth * 0.95, topY + bodyH * 0.22, cx + sideWidth, sleeveY);
  ctx.lineTo(cx + sideWidth, topY);
  ctx.stroke();
}

// ===== DRAW FULL DRESS =====
export function drawFullDress(
  ctx: CanvasRenderingContext2D,
  outfit: AROutfit,
  cx: number,
  topY: number,
  w: number,
  H: number,
  shoulderW: number,
  hipW: number,
  bodyH: number,
) {
  const gradient = ctx.createLinearGradient(cx - w / 2, topY, cx + w / 2, H);
  gradient.addColorStop(0, hexToRgba(outfit.gradient[0], 0.82));
  gradient.addColorStop(0.4, hexToRgba(outfit.color, 0.78));
  gradient.addColorStop(1, hexToRgba(outfit.gradient[1], 0.85));

  const edgeInset = outfit.type === "abaya" ? shoulderW * 0.4 : shoulderW * 0.4;
  const flare = outfit.type === "abaya" ? Math.max(w * 0.5, hipW * 0.55) : Math.max(w * 0.35, hipW * 0.5);
  const torsoGrip = outfit.type === "abaya" ? w * 0.48 : w * 0.48;

  ctx.beginPath();
  // Neckline
  ctx.moveTo(cx - edgeInset, topY);
  if (outfit.type === "abaya") {
    ctx.lineTo(cx - edgeInset * 0.3, topY + bodyH * 0.05);
    ctx.lineTo(cx - edgeInset * 0.15, topY + bodyH * 0.1);
    ctx.lineTo(cx, topY + bodyH * 0.12);
    ctx.lineTo(cx + edgeInset * 0.15, topY + bodyH * 0.1);
    ctx.lineTo(cx + edgeInset * 0.3, topY + bodyH * 0.05);
  } else {
    ctx.lineTo(cx - edgeInset * 0.35, topY + bodyH * 0.08);
    ctx.lineTo(cx, topY + bodyH * 0.12);
    ctx.lineTo(cx + edgeInset * 0.35, topY + bodyH * 0.08);
  }
  ctx.lineTo(cx + edgeInset, topY);
  // Right shoulder out
  ctx.lineTo(cx + torsoGrip, topY + bodyH * 0.08);
  // Right bodice
  ctx.lineTo(cx + torsoGrip, topY + bodyH * 0.55);
  // Skirt flare
  ctx.lineTo(cx + flare, H * 0.98);
  // Bottom hem
  ctx.lineTo(cx, H * 0.99);
  ctx.lineTo(cx - flare, H * 0.98);
  // Left skirt
  ctx.lineTo(cx - torsoGrip, topY + bodyH * 0.55);
  // Left shoulder
  ctx.lineTo(cx - torsoGrip, topY + bodyH * 0.07);
  ctx.closePath();

  ctx.fillStyle = gradient;
  ctx.fill();

  // Waist definition
  ctx.beginPath();
  ctx.moveTo(cx - shoulderW * 0.55, topY + bodyH * 0.55);
  ctx.lineTo(cx + shoulderW * 0.55, topY + bodyH * 0.55);
  ctx.strokeStyle = hexToRgba(outfit.gradient[1], 0.4);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Fabric sheen
  const sheen = ctx.createLinearGradient(cx - w / 2, topY, cx + w * 0.2, H * 0.5);
  sheen.addColorStop(0, "rgba(255,255,255,0.12)");
  sheen.addColorStop(0.35, "rgba(255,255,255,0.08)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fill();

  if (outfit.type === "abaya") {
    // Add subtle panels for abaya fabric
    ctx.save();
    ctx.strokeStyle = hexToRgba(outfit.gradient[1], 0.14);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.18, topY + bodyH * 0.25);
    ctx.bezierCurveTo(cx - w * 0.22, topY + bodyH * 0.55, cx - w * 0.23, H * 0.8, cx - w * 0.25, H * 0.95);
    ctx.moveTo(cx + w * 0.18, topY + bodyH * 0.25);
    ctx.bezierCurveTo(cx + w * 0.22, topY + bodyH * 0.55, cx + w * 0.23, H * 0.8, cx + w * 0.25, H * 0.95);
    ctx.stroke();
    ctx.restore();
  }
}

// ===== DRAW TOP/BLAZER =====
export function drawTop(
  ctx: CanvasRenderingContext2D,
  outfit: AROutfit,
  cx: number,
  topY: number,
  w: number,
  bottomY: number,
  shoulderW: number,
) {
  const gradient = ctx.createLinearGradient(cx, topY, cx, bottomY);
  gradient.addColorStop(0, hexToRgba(outfit.gradient[0], 0.85));
  gradient.addColorStop(1, hexToRgba(outfit.gradient[1], 0.82));

  ctx.beginPath();
  ctx.moveTo(cx - shoulderW * 0.35, topY);
  ctx.lineTo(cx - w * 0.5, topY + (bottomY - topY) * 0.1);
  // Sleeve hint
  ctx.lineTo(cx - w * 0.6, topY + (bottomY - topY) * 0.35);
  ctx.lineTo(cx - w * 0.48, topY + (bottomY - topY) * 0.38);
  ctx.lineTo(cx - w * 0.42, bottomY);
  ctx.lineTo(cx + w * 0.42, bottomY);
  ctx.lineTo(cx + w * 0.48, topY + (bottomY - topY) * 0.38);
  ctx.lineTo(cx + w * 0.6, topY + (bottomY - topY) * 0.35);
  ctx.lineTo(cx + w * 0.5, topY + (bottomY - topY) * 0.1);
  ctx.lineTo(cx + shoulderW * 0.35, topY);
  // V-neck
  ctx.lineTo(cx + shoulderW * 0.12, topY + (bottomY - topY) * 0.15);
  ctx.lineTo(cx, topY + (bottomY - topY) * 0.2);
  ctx.lineTo(cx - shoulderW * 0.12, topY + (bottomY - topY) * 0.15);
  ctx.closePath();

  ctx.fillStyle = gradient;
  ctx.fill();

  // Lapel for blazer
  if (outfit.type === "blazer") {
    ctx.beginPath();
    ctx.moveTo(cx, topY + (bottomY - topY) * 0.2);
    ctx.lineTo(cx - shoulderW * 0.25, topY + (bottomY - topY) * 0.4);
    ctx.lineTo(cx - shoulderW * 0.18, topY + (bottomY - topY) * 0.5);
    ctx.lineTo(cx, topY + (bottomY - topY) * 0.35);
    ctx.lineTo(cx + shoulderW * 0.18, topY + (bottomY - topY) * 0.5);
    ctx.lineTo(cx + shoulderW * 0.25, topY + (bottomY - topY) * 0.4);
    ctx.closePath();
    ctx.fillStyle = hexToRgba(outfit.gradient[0], 0.6);
    ctx.fill();

    // Buttons
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, topY + (bottomY - topY) * (0.45 + i * 0.15), 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fill();
    }
  }
}

// ===== SPARKLES =====
export function drawSparkles(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  w: number,
  h: number,
) {
  const count = 30;
  for (let i = 0; i < count; i++) {
    const x = cx + (Math.random() - 0.5) * w;
    const y = topY + Math.random() * h;
    const size = Math.random() * 3 + 1;
    const alpha = Math.random() * 0.8 + 0.2;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 230, 100, ${alpha})`;
    ctx.fill();
  }
}
